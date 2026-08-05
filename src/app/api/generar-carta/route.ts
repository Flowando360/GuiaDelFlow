import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { generarCartaCondensada, generarPdfCarta } from '@/lib/pdf/carta/generar';
import { enviarCorreoDocumentos } from '@/lib/email/enviar';
import type { GuiaCondensada } from '@/lib/pdf/guia/tipos';

export const runtime = 'nodejs';
export const maxDuration = 60;

type RespuestasJson = Record<string, unknown>;

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

  const admin = createAdminClient();

  // La Carta necesita la Guía YA generada — usa su contenido como contexto,
  // y también se reusa el PDF ya subido para adjuntarlo al correo final.
  const { data: docGuia } = await admin
    .from('flow_documentos')
    .select('estado, contenido, storage_path')
    .eq('cuestionario_id', cuestionario.id)
    .eq('tipo', 'guia')
    .maybeSingle();

  if (docGuia?.estado !== 'listo' || !docGuia.contenido) {
    return NextResponse.json({ error: 'Primero necesitas generar tu Guía del Flow.' }, { status: 400 });
  }

  const { data: existente } = await admin
    .from('flow_documentos')
    .select('*')
    .eq('cuestionario_id', cuestionario.id)
    .eq('tipo', 'carta')
    .maybeSingle();

  if (existente?.estado === 'listo') {
    return NextResponse.json({ ok: true, yaExistia: true });
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

    const perfil = await admin.from('flow_perfiles').select('nombre_completo').eq('id', user.id).single();
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

    const rutaArchivo = `${user.id}/${cuestionario.id}/carta.pdf`;
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
      },
      { onConflict: 'cuestionario_id,tipo' }
    );

    // Correo final con los 2 PDFs adjuntos. Si falla, no se revienta la
    // respuesta — el usuario siempre puede descargar ambos documentos
    // desde /resultado; el correo es una comodidad extra, no el único
    // camino de entrega.
    if (user.email) {
      const { data: pdfGuiaDescargado } = await admin.storage
        .from('guia-del-flow')
        .download(docGuia.storage_path!);
      if (pdfGuiaDescargado) {
        const resultadoCorreo = await enviarCorreoDocumentos({
          destinatario: user.email,
          nombre: nombreMostrado,
          pdfGuia: Buffer.from(await pdfGuiaDescargado.arrayBuffer()),
          pdfCarta: pdf,
        });
        if (!resultadoCorreo.ok) {
          console.error('No se pudo enviar el correo con los documentos:', resultadoCorreo.error);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error generando la Carta:', error);
    await admin.from('flow_documentos').upsert(
      {
        cuestionario_id: cuestionario.id,
        tipo: 'carta',
        estado: 'error',
        error_detalle: error instanceof Error ? error.message : String(error),
      },
      { onConflict: 'cuestionario_id,tipo' }
    );
    return NextResponse.json({ error: 'No se pudo generar la Carta. Intenta de nuevo.' }, { status: 500 });
  }
}
