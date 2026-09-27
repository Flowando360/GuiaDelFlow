import { createAdminClient } from '@/lib/supabase/server';
import { generarPilaresCondensado, generarPdfPilares } from '@/lib/pdf/pilares/generar';
import { enviarCorreoPilares } from '@/lib/email/enviar';
import type { RespuestasClasificacion, RespuestasReflexiones, RespuestasHistoria } from '@/lib/pilares/contenido';
import type { PilaresCondensado } from '@/lib/pdf/pilares/tipos';

const BUCKET = 'pilares-del-flow';

export type ResultadoAnalisisPilares =
  | { ok: true; pilar_mas_vivo: string; explicacion_pilar_mas_visible: string }
  | { ok: false; error: string };

export type ResultadoGeneracionPilares = { ok: true } | { ok: false; error: string };

/**
 * Fase 1 del resultado (pantallas "Integración"/"Revelación" de la
 * especificación, sección 5): llama a Claude con TODO lo que la persona ya
 * jugó (clasificación + reflexiones + historia) -- todavía SIN correo,
 * porque Claude no lo necesita para nada. Guarda `resultado` completo y deja
 * la sesión en 'esperando_correo'. Idempotente: si `resultado` ya existe
 * (ej. la persona recargó la pantalla de revelación), no vuelve a llamar a
 * Claude, solo devuelve lo mismo de antes.
 */
export async function analizarSesionPilares(sesionId: string): Promise<ResultadoAnalisisPilares> {
  const admin = createAdminClient();

  const { data: sesion, error: errorSesion } = await admin
    .from('flow_pilares_sesiones')
    .select('*')
    .eq('id', sesionId)
    .maybeSingle();

  if (errorSesion || !sesion) {
    return { ok: false, error: 'No se encontró esa sesión de juego.' };
  }

  const resultadoExistente = sesion.resultado as PilaresCondensado | null;
  if (resultadoExistente) {
    return {
      ok: true,
      pilar_mas_vivo: resultadoExistente.pilar_mas_vivo,
      explicacion_pilar_mas_visible: resultadoExistente.explicacion_pilar_mas_visible,
    };
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

    await admin
      .from('flow_pilares_sesiones')
      .update({ resultado: condensado, estado: 'esperando_correo', error_detalle: null })
      .eq('id', sesionId);

    return {
      ok: true,
      pilar_mas_vivo: condensado.pilar_mas_vivo,
      explicacion_pilar_mas_visible: condensado.explicacion_pilar_mas_visible,
    };
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    console.error('Error analizando la sesión de Los 4 Pilares:', error);
    await admin.from('flow_pilares_sesiones').update({ estado: 'error', error_detalle: mensaje }).eq('id', sesionId);
    return { ok: false, error: mensaje };
  }
}

/**
 * Fase 2 (pantallas "Correo"/"Generación" de la especificación): ya con el
 * correo, arma el PDF a partir del `resultado` que dejó analizarSesionPilares
 * (no vuelve a llamar a Claude), lo sube y lo envía. Si por algún motivo
 * `resultado` no existe todavía (ej. se saltó la fase 1), la calcula acá
 * mismo como respaldo, para que este paso nunca se quede sin poder avanzar.
 */
export async function generarPdfSesionPilares(sesionId: string, correoNuevo?: string): Promise<ResultadoGeneracionPilares> {
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

  const correo = correoNuevo ?? sesion.correo;
  if (!correo) {
    return { ok: false, error: 'Falta el correo de esta sesión.' };
  }

  await admin.from('flow_pilares_sesiones').update({ correo, estado: 'generando' }).eq('id', sesionId);

  try {
    let condensado = sesion.resultado as PilaresCondensado | null;
    if (!condensado) {
      const analisis = await analizarSesionPilares(sesionId);
      if (!analisis.ok) return { ok: false, error: analisis.error };
      const { data: sesionActualizada } = await admin
        .from('flow_pilares_sesiones')
        .select('resultado')
        .eq('id', sesionId)
        .maybeSingle();
      condensado = sesionActualizada?.resultado as PilaresCondensado | null;
      if (!condensado) return { ok: false, error: 'No se pudo preparar el resultado.' };
    }

    const pdf = await generarPdfPilares(condensado);

    const rutaArchivo = `${sesionId}/pilares.pdf`;
    const { error: errorSubida } = await admin.storage.from(BUCKET).upload(rutaArchivo, pdf, {
      contentType: 'application/pdf',
      upsert: true,
    });
    if (errorSubida) throw errorSubida;

    await admin
      .from('flow_pilares_sesiones')
      .update({ estado: 'listo', storage_path: rutaArchivo, error_detalle: null })
      .eq('id', sesionId);

    const resultadoCorreo = await enviarCorreoPilares({ destinatario: correo, nombre: sesion.nombre, pdfPilares: pdf });
    if (resultadoCorreo.ok) {
      await admin.from('flow_pilares_sesiones').update({ correo_enviado_at: new Date().toISOString(), correo_error: null }).eq('id', sesionId);
    } else {
      console.error('No se pudo enviar el correo de Los 4 Pilares:', resultadoCorreo.error);
      await admin.from('flow_pilares_sesiones').update({ correo_error: resultadoCorreo.error }).eq('id', sesionId);
    }

    return { ok: true };
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    console.error('Error generando el PDF de Los 4 Pilares:', error);
    await admin.from('flow_pilares_sesiones').update({ estado: 'error', error_detalle: mensaje }).eq('id', sesionId);
    return { ok: false, error: mensaje };
  }
}
