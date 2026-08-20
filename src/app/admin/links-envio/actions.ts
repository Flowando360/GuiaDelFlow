'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { esAdmin } from '@/lib/envio/admin';

export interface EstadoCrearLinks {
  error?: string;
  links?: string[];
}

export async function crearLinksEnvio(_prev: EstadoCrearLinks, formData: FormData): Promise<EstadoCrearLinks> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!esAdmin(user?.email)) {
    return { error: 'No autorizado.' };
  }

  const correoDestino = String(formData.get('correo_destino') ?? '').trim();
  const etiqueta = String(formData.get('etiqueta') ?? '').trim() || null;
  const cantidadCruda = Number(formData.get('cantidad'));
  const cantidad = Math.max(1, Math.min(100, Number.isFinite(cantidadCruda) ? cantidadCruda : 1));

  if (!correoDestino || !correoDestino.includes('@')) {
    return { error: 'Escribe un correo de destino válido.' };
  }

  const admin = createAdminClient();
  const filas = Array.from({ length: cantidad }, () => ({ correo_destino: correoDestino, etiqueta }));
  const { data, error } = await admin.from('flow_links_envio').insert(filas).select('id');

  if (error) {
    return { error: error.message };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.startsWith('http')
    ? process.env.NEXT_PUBLIC_SITE_URL
    : 'https://guia-del-flow.vercel.app';

  const links = (data ?? []).map((fila) => `${siteUrl}/registro?envio=${fila.id}`);

  revalidatePath('/admin/links-envio');
  return { links };
}
