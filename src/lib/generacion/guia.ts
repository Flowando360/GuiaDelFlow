import { createAdminClient } from '@/lib/supabase/server';
import { calcularTodosLosAspectos } from '@/lib/calculo/motor';
import type { DatosNacimiento, RespuestasCuestionario } from '@/lib/calculo/tipos';
import { generarGuiaCondensada, generarPdfGuia } from '@/lib/pdf/guia/generar';

type RespuestasJson = Record<string, unknown>;

export type ResultadoGeneracion = { ok: true; yaExistia?: boolean } | { ok: false; error: string };

function parsearFechaNacimiento(fecha: string): DatosNacimiento {
  // Los <input type="date"> mandan "AAAA-MM-DD".
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return { dia, mes, anio };
}

/**
 * Genera la Guía del Flow de `usuarioId` (busca su cuestionario más reciente
 * ya completado). Extraído de /api/generar-guia para poder llamarse tanto
 * desde ahí (la propia persona, con su sesión) como desde /panel (la
 * superusuaria, reintentando por alguien más que se quedó a mitad de
 * camino -- ver comentario en panel/actions.ts).
 */
export async function generarGuiaParaUsuario(usuarioId: string): Promise<ResultadoGeneracion> {
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
  if (!cuestionario.completado_at) {
    return { ok: false, error: 'Todavía no terminó el cuestionario.' };
  }

  // Si ya hay un documento listo, no dupliques el trabajo.
  const { data: existente } = await admin
    .from('flow_documentos')
    .select('*')
    .eq('cuestionario_id', cuestionario.id)
    .eq('tipo', 'guia')
    .maybeSingle();

  if (existente?.estado === 'listo') {
    return { ok: true, yaExistia: true };
  }

  await admin.from('flow_documentos').upsert(
    { cuestionario_id: cuestionario.id, tipo: 'guia', estado: 'generando' },
    { onConflict: 'cuestionario_id,tipo' }
  );

  try {
    const respuestas = cuestionario.respuestas as RespuestasJson;
    const demograficos = (respuestas.demograficos as RespuestasJson) ?? {};
    const likert = (respuestas.likert as RespuestasCuestionario) ?? {};
    const nacimiento = parsearFechaNacimiento(String(demograficos.fecha_nacimiento));

    const resultados = calcularTodosLosAspectos(nacimiento, likert);

    // No hay un unique constraint en cuestionario_id todavía (ver
    // supabase/migrations/0002_flow_resultados_unico.sql, pendiente de
    // correr), así que en vez de upsert con onConflict se borra el
    // cálculo anterior (si existía) y se inserta el nuevo.
    await admin.from('flow_resultados').delete().eq('cuestionario_id', cuestionario.id);
    await admin.from('flow_resultados').insert({ cuestionario_id: cuestionario.id, aspectos: resultados });

    const perfil = await admin.from('flow_perfiles').select('nombre_completo').eq('id', usuarioId).single();
    const nombreMostrado = (demograficos.apodo as string) || perfil.data?.nombre_completo || 'Amiga/o';
    const fechaHoy = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const origen = `${String(nacimiento.dia).padStart(2, '0')}/${String(nacimiento.mes).padStart(2, '0')}/${nacimiento.anio}`;

    const guia = await generarGuiaCondensada({ nombre: nombreMostrado, fecha: fechaHoy, origen, resultados });
    const pdf = await generarPdfGuia(guia);

    const rutaArchivo = `${usuarioId}/${cuestionario.id}/guia.pdf`;
    const { error: errorSubida } = await admin.storage.from('guia-del-flow').upload(rutaArchivo, pdf, {
      contentType: 'application/pdf',
      upsert: true,
    });
    if (errorSubida) throw errorSubida;

    await admin.from('flow_documentos').upsert(
      {
        cuestionario_id: cuestionario.id,
        tipo: 'guia',
        estado: 'listo',
        storage_path: rutaArchivo,
        contenido: guia,
        generado_at: new Date().toISOString(),
      },
      { onConflict: 'cuestionario_id,tipo' }
    );

    return { ok: true };
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    console.error('Error generando la Guía:', error);
    await admin.from('flow_documentos').upsert(
      { cuestionario_id: cuestionario.id, tipo: 'guia', estado: 'error', error_detalle: mensaje },
      { onConflict: 'cuestionario_id,tipo' }
    );
    return { ok: false, error: mensaje };
  }
}
