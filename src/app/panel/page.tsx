import { createAdminClient } from '@/lib/supabase/server';
import { BotonLiberar, BotonDescargar } from './Acciones';

interface FilaPanel {
  usuarioId: string;
  nombre: string;
  email: string;
  etiqueta: string | null;
  modo: string;
  cuestionarioId: string | null;
  completado: boolean;
  liberadoAt: string | null;
  guiaLista: boolean;
  cartaLista: boolean;
}

export default async function PanelPage() {
  const admin = createAdminClient();

  const { data: perfiles } = await admin
    .from('flow_perfiles')
    .select('id, nombre_completo, email, envio_link_id')
    .not('envio_link_id', 'is', null)
    .order('created_at', { ascending: false });

  if (!perfiles || perfiles.length === 0) {
    return <PanelVacio />;
  }

  const linkIds = [...new Set(perfiles.map((p) => p.envio_link_id as string))];
  const usuarioIds = perfiles.map((p) => p.id);

  const [{ data: links }, { data: cuestionarios }] = await Promise.all([
    admin.from('flow_links_envio').select('id, etiqueta, modo, correo_destino').in('id', linkIds),
    admin
      .from('flow_cuestionarios')
      .select('id, usuario_id, completado_at, liberado_at, created_at')
      .in('usuario_id', usuarioIds)
      .order('created_at', { ascending: false }),
  ]);

  const linkPorId = new Map((links ?? []).map((l) => [l.id, l]));

  // Un usuario puede tener más de un intento de cuestionario — nos
  // quedamos con el más reciente de cada uno (ya vienen ordenados desc).
  const cuestionarioPorUsuario = new Map<string, NonNullable<typeof cuestionarios>[number]>();
  for (const c of cuestionarios ?? []) {
    if (!cuestionarioPorUsuario.has(c.usuario_id)) cuestionarioPorUsuario.set(c.usuario_id, c);
  }

  const cuestionarioIds = [...cuestionarioPorUsuario.values()].map((c) => c.id);
  const { data: documentos } = await admin
    .from('flow_documentos')
    .select('cuestionario_id, tipo, estado')
    .in('cuestionario_id', cuestionarioIds);

  const docsPorCuestionario = new Map<string, { guia?: string; carta?: string }>();
  for (const d of documentos ?? []) {
    const actual = docsPorCuestionario.get(d.cuestionario_id) ?? {};
    actual[d.tipo as 'guia' | 'carta'] = d.estado;
    docsPorCuestionario.set(d.cuestionario_id, actual);
  }

  const filas: FilaPanel[] = perfiles.map((p) => {
    const link = linkPorId.get(p.envio_link_id as string);
    const cuestionario = cuestionarioPorUsuario.get(p.id);
    const docs = cuestionario ? (docsPorCuestionario.get(cuestionario.id) ?? {}) : {};
    return {
      usuarioId: p.id,
      nombre: p.nombre_completo,
      email: p.email,
      etiqueta: link?.etiqueta ?? null,
      modo: link?.modo ?? 'directo',
      cuestionarioId: cuestionario?.id ?? null,
      completado: Boolean(cuestionario?.completado_at),
      liberadoAt: cuestionario?.liberado_at ?? null,
      guiaLista: docs.guia === 'listo',
      cartaLista: docs.carta === 'listo',
    };
  });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-8">
      <p className="text-xs font-bold uppercase tracking-widest text-flow-600">Guía del Flow · Panel</p>
      <h1 className="mt-1 font-serif text-2xl font-bold text-flow-900">Tus registros</h1>
      <p className="mt-2 text-sm text-flow-800">
        Personas que se registraron con alguno de tus links de envío. Desde acá puedes descargar su Guía y su
        Carta, y liberarlas cuando el link es de modo acompañado.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl ring-1 ring-flow-200">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-flow-50 text-xs font-semibold uppercase tracking-wide text-flow-700">
            <tr>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Etiqueta</th>
              <th className="px-3 py-2">Modo</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Documentos</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={fila.usuarioId} className="border-t border-flow-100 align-top">
                <td className="px-3 py-3">
                  <div className="font-semibold text-flow-900">{fila.nombre}</div>
                  <div className="text-xs text-flow-600">{fila.email}</div>
                </td>
                <td className="px-3 py-3 text-flow-700">{fila.etiqueta ?? '—'}</td>
                <td className="px-3 py-3 text-flow-700">
                  {fila.modo === 'acompanado' ? 'Acompañado' : 'Directo'}
                </td>
                <td className="px-3 py-3 text-flow-700">
                  {!fila.completado
                    ? 'Sin terminar el cuestionario'
                    : !fila.guiaLista || !fila.cartaLista
                      ? 'Generando documentos…'
                      : fila.modo === 'acompanado' && !fila.liberadoAt
                        ? 'Lista — pendiente de liberar'
                        : 'Completo'}
                </td>
                <td className="px-3 py-3">
                  {fila.cuestionarioId && fila.guiaLista && fila.cartaLista ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <BotonDescargar cuestionarioId={fila.cuestionarioId} tipo="guia" texto="Guía" />
                      <BotonDescargar cuestionarioId={fila.cuestionarioId} tipo="carta" texto="Carta" />
                      {fila.modo === 'acompanado' && !fila.liberadoAt && (
                        <BotonLiberar cuestionarioId={fila.cuestionarioId} />
                      )}
                      {fila.modo === 'acompanado' && fila.liberadoAt && (
                        <span className="text-xs font-semibold text-flow-500">Ya liberada</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-flow-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function PanelVacio() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-flow-600">Guía del Flow · Panel</p>
      <h1 className="mt-1 font-serif text-2xl font-bold text-flow-900">Todavía no hay registros</h1>
      <p className="mt-3 text-sm text-flow-800">
        Cuando alguien se registre con uno de tus links de envío, aparecerá aquí.
      </p>
    </main>
  );
}
