'use server';

import { createAdminClient } from '@/lib/supabase/server';

export type ResultadoAccion = { ok: true } | { ok: false; error: string };

/** Pantalla "Experimento de 24h" (sección 6/13 de la especificación) --
 * guarda lo que la persona escribió que va a hacer, opcional. */
export async function guardarCompromiso24h(sesionId: string, compromiso: string): Promise<ResultadoAccion> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('flow_pilares_sesiones')
    .update({ compromiso_24h: compromiso.trim() || null })
    .eq('id', sesionId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
