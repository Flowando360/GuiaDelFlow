/**
 * Rellena el ESQUEMA DEL SER (título, descripción laboral, cómo aprovechar y cómo acompañar) de las Guías del Flow que ya
 * estaban sincronizadas con Espiral de Crecimiento antes del 2026-11-13, cuando solo viajaba un título y un puntaje
 * inventado. Recalcula los aspectos desde los resultados guardados de cada persona (flow_resultados), redacta el
 * esquema (nunca se guarda el texto de la Guía) y lo escribe en ser_puntajes. También ubica cada inteligencia en su
 * aspecto correcto (antes solo había 3 casillas) y completa «Talento único».
 *
 * REQUIERE que la migración 0142_ser_esquema_laboral.sql de Espiral ya esté aplicada.
 * Solo toca personas que autorizaron compartir con su empresa (autorizacion_circulo_en).
 *
 * Por defecto SOLO SIMULA (no escribe nada, no llama a la IA). Para escribir:
 *   npx tsx scripts/rellenar-esquema-ser.ts --aplicar [--empresa=<uuid>] [--limite=5]
 * Conviene probar primero con --empresa=00000000-0000-0000-0000-000000000001 (CONVERGIA) y --limite=2.
 */
import path from 'node:path';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database.types';
import { construirAspectos, redactarEsquema } from '../src/lib/circulo/esquema-ser';
import type { ResultadosCalculados } from '../src/lib/calculo/tipos';

process.loadEnvFile(path.join(process.cwd(), '.env.local'));

const aplicar = process.argv.includes('--aplicar');
const empresa = process.argv.find((a) => a.startsWith('--empresa='))?.split('=')[1];
const limite = Number(process.argv.find((a) => a.startsWith('--limite='))?.split('=')[1] ?? '0') || undefined;

const admin = createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: guias, error } = await admin
    .from('guia_del_flow')
    .select('id, colaborador_id, cuestionario_flow_id, colaboradores!inner(empresa_id)')
    .not('cuestionario_flow_id', 'is', null);
  if (error) throw error;

  let lista = ((guias ?? []) as any[]).filter((g) => !empresa || g.colaboradores?.empresa_id === empresa);
  if (limite) lista = lista.slice(0, limite);
  console.log(`${aplicar ? 'APLICANDO' : 'SIMULACIÓN'}: ${lista.length} guía(s) a revisar.`);

  let hechas = 0;
  let omitidas = 0;
  for (const g of lista) {
    const empresaId = g.colaboradores.empresa_id as string;

    // Solo quien autorizó compartir con su empresa.
    const { data: cuestionario } = await admin.from('flow_cuestionarios').select('id, usuario_id').eq('id', g.cuestionario_flow_id).maybeSingle();
    const { data: perfil } = cuestionario
      ? await admin.from('flow_perfiles').select('autorizacion_circulo_en').eq('id', cuestionario.usuario_id).maybeSingle()
      : { data: null };
    if (!perfil?.autorizacion_circulo_en) {
      omitidas++;
      console.log(`  - ${g.id}: sin autorización de la persona, se omite.`);
      continue;
    }

    const { data: resultados } = await admin
      .from('flow_resultados')
      .select('aspectos')
      .eq('cuestionario_id', g.cuestionario_flow_id)
      .order('calculado_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!resultados) {
      omitidas++;
      console.log(`  - ${g.id}: sin resultados calculados, se omite.`);
      continue;
    }

    const aspectosGuia = construirAspectos(resultados.aspectos as unknown as ResultadosCalculados);
    if (!aplicar) {
      console.log(`  · ${g.id}: ${aspectosGuia.length} aspectos se redactarían.`);
      continue;
    }

    const esquema = await redactarEsquema(aspectosGuia);
    const { data: catalogo } = await admin.from('ser_aspectos').select('id, nombre').eq('empresa_id', empresaId).eq('sensible', false);
    const idPorNombre = new Map((catalogo ?? []).map((a) => [a.nombre, a.id]));

    const filas = esquema.flatMap((a) => {
      const aspectoId = idPorNombre.get(a.nombre);
      if (!aspectoId) return [];
      return [
        {
          guia_del_flow_id: g.id,
          aspecto_id: aspectoId,
          puntaje: null as number | null,
          nota: a.titulo,
          descripcion: a.descripcion,
          aprovechar: a.aprovechar,
          acompanar: a.acompanar,
          enfoque: a.enfoque,
          updated_at: new Date().toISOString(),
        },
      ];
    });

    const { error: errorEscritura } = await admin.from('ser_puntajes').upsert(filas, { onConflict: 'guia_del_flow_id,aspecto_id' });
    if (errorEscritura) {
      console.log(`  ✗ ${g.id}: ${errorEscritura.message}`);
      continue;
    }

    // Las síntesis anteriores se hicieron con puntajes inventados: se vacían para que Espiral las regenere desde el esquema.
    await admin
      .from('guia_del_flow')
      .update({ informe_lider: null, informe_lider_generado_at: null, informe_colaborador: null, informe_colaborador_generado_at: null })
      .eq('id', g.id);

    hechas++;
    console.log(`  ✓ ${g.id}: ${filas.length} aspectos escritos.`);
  }

  console.log(`\nListo. Escritas: ${hechas} · omitidas: ${omitidas}.`);
  if (aplicar && hechas > 0) {
    console.log('Las síntesis quedaron vacías: Espiral las genera sola con su cron (generar-informes-pendientes) o con «Generar informes con IA» en la ficha.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
