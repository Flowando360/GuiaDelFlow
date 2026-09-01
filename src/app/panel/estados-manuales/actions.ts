'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { esAdmin } from '@/lib/envio/admin';
import { ESTADOS_MANUALES } from '@/lib/panel/estadosManuales';

export interface EstadoGuardar {
  ok: boolean;
  error?: string;
}

/**
 * Pone (o actualiza) el mismo estado manual a uno o varios colaboradores a
 * la vez -- pensado para el caso real que lo originó: marcar de una sola
 * vez a todo un equipo (comercial, Talento Humano, gerencia) que ya tenía
 * su Guía del Flow resuelta antes de que este sistema existiera.
 */
export async function guardarEstadosManuales(
  colaboradorIds: string[],
  estado: string,
  nota: string | null
): Promise<EstadoGuardar> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!esAdmin(user?.email)) return { ok: false, error: 'No autorizado.' };

  if (colaboradorIds.length === 0) return { ok: false, error: 'No hay nadie seleccionado.' };
  if (!ESTADOS_MANUALES.some((e) => e.valor === estado)) return { ok: false, error: 'Estado inválido.' };

  const admin = createAdminClient();
  const filas = colaboradorIds.map((colaborador_id) => ({
    colaborador_id,
    estado,
    nota: nota?.trim() || null,
    actualizado_at: new Date().toISOString(),
  }));

  const { error } = await admin.from('flow_estados_manuales').upsert(filas, { onConflict: 'colaborador_id' });
  if (error) return { ok: false, error: error.message };

  revalidatePath('/panel/estados-manuales');
  revalidatePath('/panel');
  return { ok: true };
}

/** Quita el estado manual -- vuelve a quedar como cualquier colaborador sin marcar. */
export async function quitarEstadoManual(colaboradorId: string): Promise<EstadoGuardar> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!esAdmin(user?.email)) return { ok: false, error: 'No autorizado.' };

  const admin = createAdminClient();
  const { error } = await admin.from('flow_estados_manuales').delete().eq('colaborador_id', colaboradorId);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/panel/estados-manuales');
  revalidatePath('/panel');
  return { ok: true };
}
