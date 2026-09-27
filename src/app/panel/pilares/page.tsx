import { createAdminClient } from '@/lib/supabase/server';
import { FormularioLinkPilares, BotonAlternarLink, BotonEliminarLinkPilares } from './FormularioLinkPilares';

export default async function PanelPilaresPage() {
  const admin = createAdminClient();

  const [{ data: links }, { data: sesiones }] = await Promise.all([
    admin.from('flow_pilares_links').select('id, etiqueta, activo, creado_at').order('creado_at', { ascending: false }),
    admin
      .from('flow_pilares_sesiones')
      .select('id, nombre, correo, estado, resultado, creado_at, flow_pilares_links(etiqueta)')
      .order('creado_at', { ascending: false })
      .limit(300),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:px-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-flow-600">Los 4 Pilares</p>
        <h1 className="mt-1 font-serif text-2xl font-bold text-flow-900">Links de campaña</h1>
        <p className="mt-2 text-sm text-flow-800">
          Un link, muchas personas: compártelo con quien quieras y cada quien se inscribe, juega y recibe su PDF por
          su cuenta. Aquí ves quién ha jugado.
        </p>
      </div>

      <FormularioLinkPilares />

      <div>
        <h2 className="font-serif text-lg font-bold text-flow-900">Links creados</h2>
        {!links || links.length === 0 ? (
          <p className="mt-2 text-sm text-flow-700">Todavía no has creado ninguno.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl ring-1 ring-flow-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-flow-50 text-xs font-semibold uppercase tracking-wide text-flow-700">
                <tr>
                  <th className="px-3 py-2">Campaña</th>
                  <th className="px-3 py-2">Creado</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link.id} className="border-t border-flow-100">
                    <td className="px-3 py-2">{link.etiqueta}</td>
                    <td className="px-3 py-2 text-flow-700">
                      {new Date(link.creado_at).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="px-3 py-2">
                      {link.activo ? (
                        <span className="font-semibold text-emerald-600">Activo</span>
                      ) : (
                        <span className="text-flow-400">Inactivo</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-3">
                        <BotonAlternarLink linkId={link.id} activo={link.activo} />
                        <BotonEliminarLinkPilares linkId={link.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="font-serif text-lg font-bold text-flow-900">Quién ha jugado</h2>
        {!sesiones || sesiones.length === 0 ? (
          <p className="mt-2 text-sm text-flow-700">Todavía nadie ha jugado.</p>
        ) : (
          <div className="mt-3 overflow-x-auto overflow-hidden rounded-xl ring-1 ring-flow-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-flow-50 text-xs font-semibold uppercase tracking-wide text-flow-700">
                <tr>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Correo</th>
                  <th className="px-3 py-2">Campaña</th>
                  <th className="px-3 py-2">Pilar más vivo</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {sesiones.map((s) => {
                  const resultado = s.resultado as { pilar_mas_vivo?: string } | null;
                  return (
                    <tr key={s.id} className="border-t border-flow-100">
                      <td className="px-3 py-2">{s.nombre}</td>
                      <td className="px-3 py-2 text-flow-700">{s.correo}</td>
                      <td className="px-3 py-2 text-flow-700">
                        {(s.flow_pilares_links as unknown as { etiqueta: string } | null)?.etiqueta ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-flow-700">{resultado?.pilar_mas_vivo ?? '—'}</td>
                      <td className="px-3 py-2">
                        {s.estado === 'listo' && <span className="font-semibold text-emerald-600">Listo</span>}
                        {s.estado === 'generando' && <span className="text-flow-500">Generando…</span>}
                        {s.estado === 'error' && <span className="font-semibold text-red-600">Error</span>}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {s.estado === 'listo' && (
                          <a href={`/api/pilares/descargar/${s.id}`} className="text-xs font-semibold text-flow-700 hover:underline">
                            Descargar
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
