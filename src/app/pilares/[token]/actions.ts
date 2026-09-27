'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { TARJETAS, PREGUNTAS_PILARES, type RespuestasClasificacion, type RespuestasReflexiones, type RespuestasHistoria } from '@/lib/pilares/contenido';

export interface EnvioJuegoPilares {
  nombre: string;
  correo: string;
  linkId: string | null;
  clasificacion: RespuestasClasificacion;
  reflexiones: RespuestasReflexiones;
  historia: RespuestasHistoria;
}

export type ResultadoEnvioJuego = { ok: true; sesionId: string } | { ok: false; error: string };

/**
 * Crea la fila de la sesión (estado 'generando') con lo que la persona
 * respondió en las 3 partes del juego. No llama a Claude ni genera el PDF
 * acá -- eso lo dispara el cliente después, contra /api/pilares/generar,
 * para no bloquear esta acción con una llamada que puede tardar (mismo
 * motivo por el que /resultado en el flujo de Guía/Carta separa "crear" de
 * "generar").
 */
export async function crearSesionPilares(datos: EnvioJuegoPilares): Promise<ResultadoEnvioJuego> {
  const nombre = datos.nombre.trim();
  const correo = datos.correo.trim().toLowerCase();

  if (!nombre) return { ok: false, error: 'Falta tu nombre.' };
  if (!correo.includes('@')) return { ok: false, error: 'Ese correo no parece válido.' };

  if (Object.keys(datos.clasificacion).length !== TARJETAS.length) {
    return { ok: false, error: 'Faltan tarjetas por clasificar.' };
  }
  const preguntasSinResponder = PREGUNTAS_PILARES.some((p) => !datos.reflexiones[p.id]?.trim());
  if (preguntasSinResponder) {
    return { ok: false, error: 'Faltan preguntas por responder.' };
  }
  if (!datos.historia.momento_antes?.trim() || !datos.historia.momento_despues?.trim() || !datos.historia.titulo?.trim()) {
    return { ok: false, error: 'Falta completar tu historia.' };
  }

  const admin = createAdminClient();

  let linkId: string | null = null;
  if (datos.linkId) {
    const { data: link } = await admin.from('flow_pilares_links').select('id, activo').eq('id', datos.linkId).maybeSingle();
    if (link?.activo) linkId = link.id;
  }

  const { data: sesion, error } = await admin
    .from('flow_pilares_sesiones')
    .insert({
      link_id: linkId,
      nombre,
      correo,
      clasificacion: datos.clasificacion,
      reflexiones: datos.reflexiones,
      historia: datos.historia,
      estado: 'generando',
    })
    .select('id')
    .single();

  if (error || !sesion) {
    return { ok: false, error: error?.message ?? 'No se pudo guardar tu sesión.' };
  }

  return { ok: true, sesionId: sesion.id };
}
