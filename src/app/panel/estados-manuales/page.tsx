import { createAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { TablaEstadosManuales, type FilaColaborador } from './TablaEstadosManuales';

export default async function EstadosManualesPage() {
  const admin = createAdminClient();

  const [{ data: empresas }, { data: colaboradores }, { data: estadosManuales }] = await Promise.all([
    admin.from('empresas').select('id, nombre').order('nombre'),
    admin
      .from('colaboradores')
      .select('id, nombre_completo, email, empresa_id')
      .eq('es_externo', false)
      .in('estado', ['activo', 'periodo_prueba'])
      .order('nombre_completo'),
    admin.from('flow_estados_manuales').select('colaborador_id, estado, nota'),
  ]);

  const colaboradorIds = (colaboradores ?? []).map((c) => c.id);
  const { data: perfiles } =
    colaboradorIds.length > 0
      ? await admin.from('flow_perfiles').select('id, colaborador_circulo_id').in('colaborador_circulo_id', colaboradorIds)
      : { data: [] as { id: string; colaborador_circulo_id: string | null }[] };

  const usuarioIds = (perfiles ?? []).map((p) => p.id);
  const { data: cuestionarios } =
    usuarioIds.length > 0
      ? await admin.from('flow_cuestionarios').select('id, usuario_id').in('usuario_id', usuarioIds)
      : { data: [] as { id: string; usuario_id: string }[] };

  const cuestionarioIds = (cuestionarios ?? []).map((c) => c.id);
  const { data: documentos } =
    cuestionarioIds.length > 0
      ? await admin
          .from('flow_documentos')
          .select('cuestionario_id, tipo, estado')
          .in('cuestionario_id', cuestionarioIds)
          .eq('estado', 'listo')
      : { data: [] as { cuestionario_id: string; tipo: string; estado: string }[] };

  // colaborador_id -> tiene Guía Y Carta listas de verdad (no solo cuenta creada)
  const cuestionarioPorUsuario = new Map((cuestionarios ?? []).map((c) => [c.usuario_id, c.id]));
  const tiposListoPorCuestionario = new Map<string, Set<string>>();
  for (const d of documentos ?? []) {
    const set = tiposListoPorCuestionario.get(d.cuestionario_id) ?? new Set<string>();
    set.add(d.tipo);
    tiposListoPorCuestionario.set(d.cuestionario_id, set);
  }
  const colaboradorConGuiaReal = new Set<string>();
  for (const p of perfiles ?? []) {
    if (!p.colaborador_circulo_id) continue;
    const cuestionarioId = cuestionarioPorUsuario.get(p.id);
    const tipos = cuestionarioId ? tiposListoPorCuestionario.get(cuestionarioId) : undefined;
    if (tipos?.has('guia') && tipos?.has('carta')) colaboradorConGuiaReal.add(p.colaborador_circulo_id);
  }

  const empresaPorId = new Map((empresas ?? []).map((e) => [e.id, e.nombre]));
  const estadoManualPorColaborador = new Map((estadosManuales ?? []).map((e) => [e.colaborador_id, e]));

  const filas: FilaColaborador[] = (colaboradores ?? []).map((c) => {
    const manual = estadoManualPorColaborador.get(c.id);
    return {
      colaboradorId: c.id,
      nombre: c.nombre_completo,
      email: c.email,
      empresa: empresaPorId.get(c.empresa_id) ?? '—',
      tieneGuiaReal: colaboradorConGuiaReal.has(c.id),
      estadoManual: manual?.estado ?? null,
      notaManual: manual?.nota ?? null,
    };
  });

  const empresasDisponibles = [...new Set(filas.map((f) => f.empresa))].sort();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-8">
      <Link href="/panel" className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-flow-600 hover:underline">
        ← Volver al panel
      </Link>
      <p className="text-xs font-bold uppercase tracking-widest text-flow-600">Guía del Flow · Panel</p>
      <h1 className="mt-1 font-serif text-2xl font-bold text-flow-900">Estados manuales</h1>
      <p className="mt-2 text-sm text-flow-800">
        Para colaboradores cuya Guía del Flow se resolvió por fuera de este sistema (antes de existir, en
        persona, etc.) -- marca su estado acá para que quede reflejado, sin necesidad de que se registren.
        Aplica para cualquier empresa cliente.
      </p>

      <TablaEstadosManuales filas={filas} empresas={empresasDisponibles} />
    </main>
  );
}
