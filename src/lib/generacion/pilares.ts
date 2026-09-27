import { createAdminClient } from '@/lib/supabase/server';
import { generarPilaresCondensado, generarPdfPilares } from '@/lib/pdf/pilares/generar';
import { enviarCorreoPilares } from '@/lib/email/enviar';
import type { RespuestasClasificacion, RespuestasReflexiones, RespuestasHistoria } from '@/lib/pilares/contenido';

const BUCKET = 'pilares-del-flow';

export type ResultadoGeneracionPilares = { ok: true } | { ok: false; error: string };

/**
 * Genera (o reintenta) el PDF de "Los 4 Pilares" de una sesión y lo manda
 * por correo. Igual patrón que generarCartaParaUsuario/generarGuiaParaUsuario
 * (src/lib/generacion/), pero sin cuenta ni modo acompañado/directo — acá
 * el envío siempre es directo e inmediato, apenas la persona termina de
 * jugar (ver Diseno-Juego-4-Pilares.md, sección 7: "no tiene sentido
 * revisarlo antes, es autoservicio").
 */
export async function generarPilaresParaSesion(sesionId: string): Promise<ResultadoGeneracionPilares> {
  const admin = createAdminClient();

  const { data: sesion, error: errorSesion } = await admin
    .from('flow_pilares_sesiones')
    .select('*')
    .eq('id', sesionId)
    .maybeSingle();

  if (errorSesion || !sesion) {
    return { ok: false, error: 'No se encontró esa sesión de juego.' };
  }

  if (sesion.estado === 'listo' && sesion.storage_path) {
    return { ok: true };
  }

  try {
    const clasificacion = sesion.clasificacion as RespuestasClasificacion;
    const reflexiones = sesion.reflexiones as RespuestasReflexiones;
    const historia = sesion.historia as RespuestasHistoria;
    const fechaHoy = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const condensado = await generarPilaresCondensado({
      nombre: sesion.nombre,
      fecha: fechaHoy,
      clasificacion,
      reflexiones,
      historia,
    });

    const pdf = await generarPdfPilares(condensado);

    const rutaArchivo = `${sesion.id}/pilares.pdf`;
    const { error: errorSubida } = await admin.storage.from(BUCKET).upload(rutaArchivo, pdf, {
      contentType: 'application/pdf',
      upsert: true,
    });
    if (errorSubida) throw errorSubida;

    await admin
      .from('flow_pilares_sesiones')
      .update({
        estado: 'listo',
        storage_path: rutaArchivo,
        resultado: condensado,
        error_detalle: null,
      })
      .eq('id', sesionId);

    const resultadoCorreo = await enviarCorreoPilares({ destinatario: sesion.correo, nombre: sesion.nombre, pdfPilares: pdf });
    if (resultadoCorreo.ok) {
      await admin.from('flow_pilares_sesiones').update({ correo_enviado_at: new Date().toISOString(), correo_error: null }).eq('id', sesionId);
    } else {
      console.error('No se pudo enviar el correo de Los 4 Pilares:', resultadoCorreo.error);
      await admin.from('flow_pilares_sesiones').update({ correo_error: resultadoCorreo.error }).eq('id', sesionId);
    }

    return { ok: true };
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    console.error('Error generando Los 4 Pilares:', error);
    await admin.from('flow_pilares_sesiones').update({ estado: 'error', error_detalle: mensaje }).eq('id', sesionId);
    return { ok: false, error: mensaje };
  }
}
