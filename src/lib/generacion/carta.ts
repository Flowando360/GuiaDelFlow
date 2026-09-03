import { createAdminClient } from '@/lib/supabase/server';
import { generarCartaCondensada, generarPdfCarta } from '@/lib/pdf/carta/generar';
import { enviarCorreoDocumentos, enviarCorreoAvisoInterno } from '@/lib/email/enviar';
import { obtenerEmpresaYFirmante } from '@/lib/circulo/empresa';
import type { GuiaCondensada } from '@/lib/pdf/guia/tipos';
import type { ResultadoGeneracion } from './guia';

type RespuestasJson = Record<string, unknown>;
type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Manda el correo final (Guía+Carta adjuntas) a la persona cuando el modo
 * lo permite, Y SIEMPRE manda el aviso interno a Flowando
 * (enviarCorreoAvisoInterno) sin importar el modo -- pedido el 2026-09-02
 * porque en modo "acompañado" antes no llegaba absolutamente ningún correo
 * a nadie. Deja registrado en flow_cuestionarios el resultado del envío A
 * LA PERSONA -- ver migración 0008. Antes este resultado solo quedaba en un
 * console.error de la función serverless, invisible desde /panel (Diana lo
 * pidió el 2026-08-31 después de preguntar si el correo realmente había
 * llegado).
 *
 * "No corresponde" el envío a la persona (modo 'acompanado', o cuenta sin
 * correo registrado) no es un error -- se deja enviado_at y error en null a
 * propósito, para no confundirlo con un intento fallido.
 */
async function enviarCorreoSiCorresponde(
  admin: AdminClient,
  params: { usuarioId: string; cuestionarioId: string; nombreMostrado: string; storagePathGuia: string; pdfCarta: Buffer }
): Promise<void> {
  const { usuarioId, cuestionarioId, nombreMostrado, storagePathGuia, pdfCarta } = params;

  const perfilEnvio = await admin
    .from('flow_perfiles')
    .select('email, nombre_completo, envio_link_id, colaborador_circulo_id')
    .eq('id', usuarioId)
    .single();
  let modoEnvio: 'directo' | 'acompanado' = 'directo';
  if (perfilEnvio.data?.envio_link_id) {
    const { data: linkEnvio } = await admin
      .from('flow_links_envio')
      .select('modo')
      .eq('id', perfilEnvio.data.envio_link_id)
      .maybeSingle();
    if (linkEnvio?.modo === 'acompanado') modoEnvio = 'acompanado';
  }
  const destinatarioCorreo = modoEnvio === 'acompanado' ? null : (perfilEnvio.data?.email ?? null);

  const { data: pdfGuiaDescargado } = await admin.storage.from('guia-del-flow').download(storagePathGuia);
  if (!pdfGuiaDescargado) {
    await admin
      .from('flow_cuestionarios')
      .update({ correo_documentos_error: 'No se pudo leer el PDF de la Guía ya subido para adjuntarlo.' })
      .eq('id', cuestionarioId);
    return;
  }
  const pdfGuia = Buffer.from(await pdfGuiaDescargado.arrayBuffer());

  let resultadoParaPersona: { ok: true } | { ok: false; error: string } | null = null;
  if (destinatarioCorreo) {
    const empresaYFirmante = await obtenerEmpresaYFirmante(perfilEnvio.data?.colaborador_circulo_id ?? null);
    resultadoParaPersona = await enviarCorreoDocumentos({
      destinatario: destinatarioCorreo,
      nombre: nombreMostrado,
      empresa: empresaYFirmante?.empresa ?? null,
      firmanteNombre: empresaYFirmante?.firmanteNombre ?? null,
      pdfGuia,
      pdfCarta,
    });
  }

  const resultadoAviso = await enviarCorreoAvisoInterno({
    // El nombre real (no el apodo de nombreMostrado) y el correo de la
    // CUENTA (no solo el de envío, que en modo 'acompanado' siempre viene
    // null) -- pedido el 2026-09-03: Diana necesita poder identificar a la
    // persona desde este correo, y un apodo o un correo ausente no
    // alcanza para eso.
    nombre: perfilEnvio.data?.nombre_completo || nombreMostrado,
    correo: perfilEnvio.data?.email ?? null,
    modo: modoEnvio,
    correoPersona: destinatarioCorreo,
    envioPersonaOk: resultadoParaPersona?.ok ?? null,
    pdfGuia,
    pdfCarta,
  });
  if (!resultadoAviso.ok) {
    console.error('No se pudo enviar el aviso interno a Flowando:', resultadoAviso.error);
  }

  if (!destinatarioCorreo) return;

  if (resultadoParaPersona?.ok) {
    await admin
      .from('flow_cuestionarios')
      .update({ correo_documentos_enviado_at: new Date().toISOString(), correo_documentos_error: null })
      .eq('id', cuestionarioId);
  } else {
    console.error('No se pudo enviar el correo con los documentos:', resultadoParaPersona?.error);
    await admin.from('flow_cuestionarios').update({ correo_documentos_error: resultadoParaPersona?.error }).eq('id', cuestionarioId);
  }
}

/**
 * Genera la Carta de `usuarioId` (busca su cuestionario más reciente ya
 * completado). Extraído de /api/generar-carta -- ver comentario en
 * guia.ts, misma razón: reusarse desde /panel para reintentar por alguien
 * que se quedó a mitad de camino.
 *
 * Si la Carta ya estaba lista pero el correo nunca se mandó (o falló), NO
 * vuelve a generar el PDF -- solo reintenta el envío con el que ya existe.
 * Antes esto quedaba invisible: "Reintentar" devolvía yaExistia:true y no
 * hacía nada más, así que un correo fallido se quedaba fallido para
 * siempre sin que nadie pudiera arreglarlo desde acá.
 */
export async function generarCartaParaUsuario(usuarioId: string): Promise<ResultadoGeneracion> {
  const admin = createAdminClient();

  const { data: cuestionario, error: errorCuestionario } = await admin
    .from('flow_cuestionarios')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (errorCuestionario || !cuestionario) {
    return { ok: false, error: 'No se encontró su cuestionario.' };
  }

  // La Carta necesita la Guía YA generada -- usa su contenido como contexto,
  // y también se reusa el PDF ya subido para adjuntarlo al correo final.
  const { data: docGuia } = await admin
    .from('flow_documentos')
    .select('estado, contenido, storage_path')
    .eq('cuestionario_id', cuestionario.id)
    .eq('tipo', 'guia')
    .maybeSingle();

  if (docGuia?.estado !== 'listo' || !docGuia.contenido) {
    return { ok: false, error: 'Primero hay que generar la Guía.' };
  }

  const { data: existente } = await admin
    .from('flow_documentos')
    .select('*')
    .eq('cuestionario_id', cuestionario.id)
    .eq('tipo', 'carta')
    .maybeSingle();

  if (existente?.estado === 'listo') {
    if (cuestionario.correo_documentos_enviado_at || !existente.storage_path) {
      return { ok: true, yaExistia: true };
    }
    // La Carta ya existe pero el correo nunca se confirmó -- reintenta solo
    // el envío, sin tocar el PDF.
    const perfil = await admin.from('flow_perfiles').select('nombre_completo').eq('id', usuarioId).single();
    const { data: pdfCartaDescargada } = await admin.storage.from('guia-del-flow').download(existente.storage_path);
    if (pdfCartaDescargada) {
      await enviarCorreoSiCorresponde(admin, {
        usuarioId,
        cuestionarioId: cuestionario.id,
        nombreMostrado: perfil.data?.nombre_completo || 'Amiga/o',
        storagePathGuia: docGuia.storage_path!,
        pdfCarta: Buffer.from(await pdfCartaDescargada.arrayBuffer()),
      });
    }
    return { ok: true, yaExistia: true };
  }

  await admin.from('flow_documentos').upsert(
    { cuestionario_id: cuestionario.id, tipo: 'carta', estado: 'generando' },
    { onConflict: 'cuestionario_id,tipo' }
  );

  try {
    const respuestas = cuestionario.respuestas as RespuestasJson;
    const demograficos = (respuestas.demograficos as RespuestasJson) ?? {};
    const cuestionamientos = (respuestas.cuestionamientos as RespuestasJson) ?? {};

    const razon = cuestionamientos.razon as string | undefined;
    const c1 = cuestionamientos.cuestionamiento_1 as string | undefined;
    const c2 = cuestionamientos.cuestionamiento_2 as string | undefined;
    const c3 = cuestionamientos.cuestionamiento_3 as string | undefined;
    if (!razon || !c1 || !c2 || !c3) {
      throw new Error('Faltan la razón o los 3 cuestionamientos del cuestionario.');
    }

    const perfil = await admin.from('flow_perfiles').select('nombre_completo').eq('id', usuarioId).single();
    const nombreMostrado = (demograficos.apodo as string) || perfil.data?.nombre_completo || 'Amiga/o';
    const fechaHoy = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const carta = await generarCartaCondensada({
      nombre: nombreMostrado,
      fecha: fechaHoy,
      razon,
      cuestionamiento1: c1,
      cuestionamiento2: c2,
      cuestionamiento3: c3,
      guia: docGuia.contenido as GuiaCondensada,
    });

    const pdf = await generarPdfCarta(carta);

    const rutaArchivo = `${usuarioId}/${cuestionario.id}/carta.pdf`;
    const { error: errorSubida } = await admin.storage.from('guia-del-flow').upload(rutaArchivo, pdf, {
      contentType: 'application/pdf',
      upsert: true,
    });
    if (errorSubida) throw errorSubida;

    await admin.from('flow_documentos').upsert(
      {
        cuestionario_id: cuestionario.id,
        tipo: 'carta',
        estado: 'listo',
        storage_path: rutaArchivo,
        generado_at: new Date().toISOString(),
        // Limpia el error de un intento fallido anterior -- ver mismo
        // comentario en guia.ts.
        error_detalle: null,
      },
      { onConflict: 'cuestionario_id,tipo' }
    );

    await enviarCorreoSiCorresponde(admin, {
      usuarioId,
      cuestionarioId: cuestionario.id,
      nombreMostrado,
      storagePathGuia: docGuia.storage_path!,
      pdfCarta: pdf,
    });

    return { ok: true };
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    console.error('Error generando la Carta:', error);
    await admin.from('flow_documentos').upsert(
      { cuestionario_id: cuestionario.id, tipo: 'carta', estado: 'error', error_detalle: mensaje },
      { onConflict: 'cuestionario_id,tipo' }
    );
    return { ok: false, error: mensaje };
  }
}
