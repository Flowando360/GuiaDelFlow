'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { TARJETAS, PREGUNTAS_PILARES, type RespuestasClasificacion, type RespuestasReflexiones } from '@/lib/pilares/contenido';

export type ResultadoAccion = { ok: true } | { ok: false; error: string };
export type ResultadoCrearSesion = { ok: true; sesionId: string } | { ok: false; error: string };

/**
 * Paso 0 (landing, sección 5 de la especificación): crea la sesión con SOLO
 * el nombre -- el correo se pide hasta el final del juego. Se crea ya en
 * este punto (no al terminar) para que las sesiones abandonadas a mitad de
 * camino queden registradas y se puedan medir en /panel/pilares (sección
 * 17/19 de la especificación).
 */
export async function crearSesionPilares(datos: { nombre: string; linkId: string | null }): Promise<ResultadoCrearSesion> {
  const nombre = datos.nombre.trim();
  if (!nombre) return { ok: false, error: 'Falta tu nombre.' };

  const admin = createAdminClient();

  let linkId: string | null = null;
  if (datos.linkId) {
    const { data: link } = await admin.from('flow_pilares_links').select('id, activo').eq('id', datos.linkId).maybeSingle();
    if (link?.activo) linkId = link.id;
  }

  const { data: sesion, error } = await admin
    .from('flow_pilares_sesiones')
    .insert({ link_id: linkId, nombre, estado: 'jugando' })
    .select('id')
    .single();

  if (error || !sesion) {
    return { ok: false, error: error?.message ?? 'No se pudo iniciar tu sesión.' };
  }

  return { ok: true, sesionId: sesion.id };
}

/** Ronda 1 completa: guarda la clasificación de las 12 tarjetas. */
export async function guardarClasificacion(sesionId: string, clasificacion: RespuestasClasificacion): Promise<ResultadoAccion> {
  if (Object.keys(clasificacion).length !== TARJETAS.length) {
    return { ok: false, error: 'Faltan tarjetas por clasificar.' };
  }
  const admin = createAdminClient();
  const { error } = await admin.from('flow_pilares_sesiones').update({ clasificacion }).eq('id', sesionId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Ronda 2 completa: guarda las 9 respuestas de autoindagación. */
export async function guardarReflexiones(sesionId: string, reflexiones: RespuestasReflexiones): Promise<ResultadoAccion> {
  const faltaAlguna = PREGUNTAS_PILARES.some((p) => !reflexiones[p.id]?.trim());
  if (faltaAlguna) return { ok: false, error: 'Faltan preguntas por responder.' };
  const admin = createAdminClient();
  const { error } = await admin.from('flow_pilares_sesiones').update({ reflexiones }).eq('id', sesionId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
