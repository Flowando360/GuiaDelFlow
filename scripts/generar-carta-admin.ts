/**
 * Genera La Carta para UN cuestionario puntual, de forma administrativa —
 * replica exactamente la lógica de src/app/api/generar-carta/route.ts pero
 * usando el cliente admin (service_role) en vez de la sesión del usuario,
 * para los casos en que la persona generó su Guía y no volvió a generar la
 * Carta. Uso puntual, no pensado para producción/uso repetido.
 *
 * Uso:
 *   npx tsx scripts/generar-carta-admin.ts <cuestionario_id>
 */
import path from 'node:path';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database.types';
import { generarCartaCondensada, generarPdfCarta } from '../src/lib/pdf/carta/generar';
import type { GuiaCondensada } from '../src/lib/pdf/guia/tipos';

process.loadEnvFile(path.join(process.cwd(), '.env.local'));

const admin = createSupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const cuestionarioId = process.argv[2];
  if (!cuestionarioId) throw new Error('Uso: npx tsx scripts/generar-carta-admin.ts <cuestionario_id>');

  const { data: cuestionario, error: errorCuestionario } = await admin
    .from('flow_cuestionarios')
    .select('*')
    .eq('id', cuestionarioId)
    .maybeSingle();
  if (errorCuestionario || !cuestionario) throw new Error('No se encontró ese cuestionario.');

  const { data: docGuia } = await admin
    .from('flow_documentos')
    .select('estado, contenido, storage_path')
    .eq('cuestionario_id', cuestionario.id)
    .eq('tipo', 'guia')
    .maybeSingle();
  if (docGuia?.estado !== 'listo' || !docGuia.contenido) {
    throw new Error('La Guía todavía no está lista para este cuestionario.');
  }

  const { data: existente } = await admin
    .from('flow_documentos')
    .select('*')
    .eq('cuestionario_id', cuestionario.id)
    .eq('tipo', 'carta')
    .maybeSingle();
  if (existente?.estado === 'listo') {
    console.log('La Carta ya estaba lista — no se hizo nada.');
    return;
  }

  await admin.from('flow_documentos').upsert(
    { cuestionario_id: cuestionario.id, tipo: 'carta', estado: 'generando' },
    { onConflict: 'cuestionario_id,tipo' }
  );

  try {
    const respuestas = cuestionario.respuestas as Record<string, unknown>;
    const demograficos = (respuestas.demograficos as Record<string, unknown>) ?? {};
    const cuestionamientos = (respuestas.cuestionamientos as Record<string, unknown>) ?? {};

    const razon = cuestionamientos.razon as string | undefined;
    const c1 = cuestionamientos.cuestionamiento_1 as string | undefined;
    const c2 = cuestionamientos.cuestionamiento_2 as string | undefined;
    const c3 = cuestionamientos.cuestionamiento_3 as string | undefined;
    if (!razon || !c1 || !c2 || !c3) throw new Error('Faltan la razón o los 3 cuestionamientos del cuestionario.');

    const perfil = await admin
      .from('flow_perfiles')
      .select('nombre_completo')
      .eq('id', cuestionario.usuario_id)
      .single();
    const nombreMostrado = (demograficos.apodo as string) || perfil.data?.nombre_completo || 'Amiga/o';
    const fechaHoy = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });

    console.log(`Generando la Carta de ${nombreMostrado} (llamada a Claude)...`);
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

    const rutaArchivo = `${cuestionario.usuario_id}/${cuestionario.id}/carta.pdf`;
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

    // A propósito NO se manda correo desde este script, sin importar el
    // modo del link: es la superusuaria quien decide cuándo avisarle a la
    // persona (acá, explícitamente le pidió a Claude no avisarle a
    // Luciana todavía). El envío/liberación real sigue el flujo normal de
    // /panel (BotonLiberar en modo acompañado).
    console.log(`Listo. La Carta quedó guardada en ${rutaArchivo}. No se mandó ningún correo.`);
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
    process.exit(1);
  }
}

main();
