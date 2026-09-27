'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { esAdmin } from '@/lib/envio/admin';

export interface EstadoCrearLinkPilares {
  error?: string;
  link?: string;
}

/**
 * Crea un link de campaña reutilizable para "Los 4 Pilares" (a diferencia
 * de crearLinksEnvio en ../actions.ts: acá siempre es UN link para MUCHAS
 * personas, no un lote de links de un solo uso cada uno — ver
 * Diseno-Juego-4-Pilares.md, sección 7).
 */
export async function crearLinkPilares(_prev: EstadoCrearLinkPilares, formData: FormData): Promise<EstadoCrearLinkPilares> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!esAdmin(user?.email)) {
    return { error: 'No autorizado.' };
  }

  const etiqueta = String(formData.get('etiqueta') ?? '').trim();
  if (!etiqueta) {
    return { error: 'Escribe una etiqueta para identificar esta campaña.' };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from('flow_pilares_links').insert({ etiqueta }).select('id').single();
  if (error || !data) {
    return { error: error?.message ?? 'No se pudo crear el link.' };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.startsWith('http')
    ? process.env.NEXT_PUBLIC_SITE_URL
    : 'https://guia-del-flow.vercel.app';

  revalidatePath('/panel/pilares');
  return { link: `${siteUrl}/pilares/${data.id}` };
}

export interface EstadoAccionPilares {
  ok: boolean;
  error?: string;
}

export async function alternarLinkPilares(linkId: string, activo: boolean): Promise<EstadoAccionPilares> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!esAdmin(user?.email)) return { ok: false, error: 'No autorizado.' };

  const admin = createAdminClient();
  const { error } = await admin.from('flow_pilares_links').update({ activo }).eq('id', linkId);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/panel/pilares');
  return { ok: true };
}

export async function eliminarLinkPilares(linkId: string): Promise<EstadoAccionPilares> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!esAdmin(user?.email)) return { ok: false, error: 'No autorizado.' };

  const admin = createAdminClient();
  const { error } = await admin.from('flow_pilares_links').delete().eq('id', linkId);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/panel/pilares');
  return { ok: true };
}
