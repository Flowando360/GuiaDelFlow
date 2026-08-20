'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { esAdmin } from '@/lib/envio/admin';
import { enviarCorreoDocumentos } from '@/lib/email/enviar';

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
  const modo = String(formData.get('modo') ?? 'directo');
  const cantidadCruda = Number(formData.get('cantidad'));
  const cantidad = Math.max(1, Math.min(100, Number.isFinite(cantidadCruda) ? cantidadCruda : 1));

  if (!correoDestino || !correoDestino.includes('@')) {
    return { error: 'Escribe un correo de destino válido.' };
  }
  if (modo !== 'directo' && modo !== 'acompanado') {
    return { error: 'Modo inválido.' };
  }

  const admin = createAdminClient();
  const filas = Array.from({ length: cantidad }, () => ({ correo_destino: correoDestino, etiqueta, modo }));
  const { data, error } = await admin.from('flow_links_envio').insert(filas).select('id');

  if (error) {
    return { error: error.message };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.startsWith('http')
    ? process.env.NEXT_PUBLIC_SITE_URL
    : 'https://guia-del-flow.vercel.app';

  const links = (data ?? []).map((fila) => `${siteUrl}/registro?envio=${fila.id}`);

  revalidatePath('/panel/links');
  return { links };
}

export interface EstadoLiberar {
  ok: boolean;
  error?: string;
}

/**
 * "Libera" los documentos de un cuestionario en modo 'acompanado': manda el
 * correo con la Guía y la Carta ya generadas (sin volver a llamar a
 * Claude — reusa los PDF guardados en Storage) y deja la cuenta libre para
 * que la persona los descargue también desde /resultado.
 */
export async function liberarDocumentos(cuestionarioId: string): Promise<EstadoLiberar> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!esAdmin(user?.email)) {
    return { ok: false, error: 'No autorizado.' };
  }

  const admin = createAdminClient();

  const { data: cuestionario } = await admin
    .from('flow_cuestionarios')
    .select('id, usuario_id, liberado_at')
    .eq('id', cuestionarioId)
    .maybeSingle();

  if (!cuestionario) {
    return { ok: false, error: 'No se encontró ese cuestionario.' };
  }
  if (cuestionario.liberado_at) {
    return { ok: true }; // ya estaba liberado — idempotente, no es un error
  }

  const { data: perfil } = await admin
    .from('flow_perfiles')
    .select('envio_link_id, nombre_completo, email')
    .eq('id', cuestionario.usuario_id)
    .maybeSingle();

  if (!perfil?.envio_link_id) {
    return { ok: false, error: 'Esa cuenta no vino de un link de envío tuyo.' };
  }

  const { data: documentos } = await admin
    .from('flow_documentos')
    .select('tipo, estado, storage_path')
    .eq('cuestionario_id', cuestionarioId);

  const guia = documentos?.find((d) => d.tipo === 'guia');
  const carta = documentos?.find((d) => d.tipo === 'carta');

  if (guia?.estado !== 'listo' || carta?.estado !== 'listo' || !guia.storage_path || !carta.storage_path) {
    return { ok: false, error: 'Todavía no están listos los dos documentos (Guía y Carta).' };
  }

  const [pdfGuia, pdfCarta] = await Promise.all([
    admin.storage.from('guia-del-flow').download(guia.storage_path),
    admin.storage.from('guia-del-flow').download(carta.storage_path),
  ]);

  if (!pdfGuia.data || !pdfCarta.data) {
    return { ok: false, error: 'No se pudieron leer los PDF ya generados.' };
  }

  if (perfil.email) {
    const resultadoCorreo = await enviarCorreoDocumentos({
      destinatario: perfil.email,
      nombre: perfil.nombre_completo || 'Amiga/o',
      pdfGuia: Buffer.from(await pdfGuia.data.arrayBuffer()),
      pdfCarta: Buffer.from(await pdfCarta.data.arrayBuffer()),
    });
    if (!resultadoCorreo.ok) {
      return { ok: false, error: `No se pudo enviar el correo: ${resultadoCorreo.error}` };
    }
  }

  await admin.from('flow_cuestionarios').update({ liberado_at: new Date().toISOString() }).eq('id', cuestionarioId);

  revalidatePath('/panel');
  return { ok: true };
}
