'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { esAdmin } from '@/lib/envio/admin';
import { enviarCorreoDocumentos, enviarCorreoInvitacion } from '@/lib/email/enviar';

export interface EstadoCrearLinks {
  error?: string;
  links?: string[];
  correoEnviado?: string;
  correoError?: string;
}

export async function crearLinksEnvio(_prev: EstadoCrearLinks, formData: FormData): Promise<EstadoCrearLinks> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!esAdmin(user?.email)) {
    return { error: 'No autorizado.' };
  }

  const correoDestino = String(formData.get('correo_destino') ?? '').trim() || null;
  const etiqueta = String(formData.get('etiqueta') ?? '').trim() || null;
  const modo = String(formData.get('modo') ?? 'directo');
  const cantidadCruda = Number(formData.get('cantidad'));
  const cantidad = Math.max(1, Math.min(100, Number.isFinite(cantidadCruda) ? cantidadCruda : 1));

  // El correo es opcional — casi nunca se tiene al crear el link (ver
  // migración 0007). Basta con el nombre del paciente para identificarlo.
  if (!etiqueta) {
    return { error: 'Escribe el nombre del paciente.' };
  }
  if (correoDestino && !correoDestino.includes('@')) {
    return { error: 'El correo no es válido — déjalo vacío si todavía no lo tienes.' };
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

  // Solo se manda invitación por correo cuando hay UN paciente concreto
  // (un solo link) con correo — un lote de varios links comparte el mismo
  // correo_destino de referencia, así que mandarle el mismo correo N veces
  // no tendría sentido.
  if (correoDestino && cantidad === 1 && links[0]) {
    const resultado = await enviarCorreoInvitacion({ destinatario: correoDestino, nombre: etiqueta, urlLink: links[0] });
    if (resultado.ok) {
      return { links, correoEnviado: correoDestino };
    }
    return { links, correoError: resultado.error };
  }

  return { links };
}

export interface EstadoEliminar {
  ok: boolean;
  error?: string;
}

/**
 * Borra un link de envío por completo de la base de datos, sin importar si
 * ya fue usado por alguien para registrarse. flow_perfiles.envio_link_id
 * tiene "on delete set null" (ver migración 0005), así que si el link ya
 * tenía cuentas registradas, esas cuentas simplemente quedan con
 * envio_link_id = null (dejan de aparecer en /panel, pero la cuenta y sus
 * documentos generados no se tocan).
 */
export async function eliminarLinkEnvio(linkId: string): Promise<EstadoEliminar> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!esAdmin(user?.email)) {
    return { ok: false, error: 'No autorizado.' };
  }

  const admin = createAdminClient();
  const { error } = await admin.from('flow_links_envio').delete().eq('id', linkId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath('/panel/links');
  revalidatePath('/panel');
  return { ok: true };
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
