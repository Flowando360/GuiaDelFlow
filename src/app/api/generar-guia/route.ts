import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { calcularTodosLosAspectos } from '@/lib/calculo/motor';
import type { DatosNacimiento, RespuestasCuestionario } from '@/lib/calculo/tipos';
import { generarGuiaCondensada, generarPdfGuia } from '@/lib/pdf/guia/generar';

// Puppeteer necesita Node.js (no Edge), y la llamada a Claude + el
// render del PDF se acercan al límite de 60s del plan Hobby de Vercel.
export const runtime = 'nodejs';
export const maxDuration = 60;

type RespuestasJson = Record<string, unknown>;

function parsearFechaNacimiento(fecha: string): DatosNacimiento {
  // Los <input type="date"> mandan "AAAA-MM-DD".
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return { dia, mes, anio };
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: cuestionario, error: errorCuestionario } = await supabase
    .from('flow_cuestionarios')
    .select('*')
    .eq('usuario_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (errorCuestionario || !cuestionario) {
    return NextResponse.json({ error: 'No se encontró tu cuestionario.' }, { status: 404 });
  }
  if (!cuestionario.completado_at) {
    return NextResponse.json({ error: 'Todavía no terminaste el cuestionario.' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Si ya hay un documento listo o generándose, no dupliques el trabajo.
  const { data: existente } = await admin
    .from('flow_documentos')
    .select('*')
    .eq('cuestionario_id', cuestionario.id)
    .eq('tipo', 'guia')
    .maybeSingle();

  if (existente?.estado === 'listo') {
    return NextResponse.json({ ok: true, yaExistia: true });
  }

  await admin.from('flow_documentos').upsert(
    {
      cuestionario_id: cuestionario.id,
      tipo: 'guia',
      estado: 'generando',
    },
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

    const perfil = await admin.from('flow_perfiles').select('nombre_completo').eq('id', user.id).single();
    const nombreMostrado = (demograficos.apodo as string) || perfil.data?.nombre_completo || 'Amiga/o';
    const fechaHoy = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const origen = `${String(nacimiento.dia).padStart(2, '0')}/${String(nacimiento.mes).padStart(2, '0')}/${nacimiento.anio}`;

    const guia = await generarGuiaCondensada({
      nombre: nombreMostrado,
      fecha: fechaHoy,
      origen,
      resultados,
    });

    const pdf = await generarPdfGuia(guia);

    const rutaArchivo = `${user.id}/${cuestionario.id}/guia.pdf`;
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
        generado_at: new Date().toISOString(),
      },
      { onConflict: 'cuestionario_id,tipo' }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error generando la Guía:', error);
    await admin.from('flow_documentos').upsert(
      {
        cuestionario_id: cuestionario.id,
        tipo: 'guia',
        estado: 'error',
        error_detalle: error instanceof Error ? error.message : String(error),
      },
      { onConflict: 'cuestionario_id,tipo' }
    );
    return NextResponse.json({ error: 'No se pudo generar la Guía. Intenta de nuevo.' }, { status: 500 });
  }
}
