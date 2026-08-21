import { createAdminClient } from '@/lib/supabase/server';
import { FormularioLinks, BotonEliminarLink } from './FormularioLinks';

export default async function LinksEnvioPage() {
  const admin = createAdminClient();

  const [{ data: links }, { data: perfiles }] = await Promise.all([
    admin
      .from('flow_links_envio')
      .select('id, correo_destino, etiqueta, modo, creado_at')
      .order('creado_at', { ascending: false })
      .limit(300),
    admin.from('flow_perfiles').select('envio_link_id').not('envio_link_id', 'is', null),
  ]);

  const usados = new Set((perfiles ?? []).map((fila) => fila.envio_link_id as string));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-flow-600">Guía del Flow · Panel</p>
        <h1 className="mt-1 font-serif text-2xl font-bold text-flow-900">Links de envío</h1>
        <p className="mt-2 text-sm text-flow-800">
          Crea links especiales para compartir en vez del registro normal. Quien se registre con uno de estos
          queda visible en <a href="/panel" className="underline">tu panel</a>, y según el modo que elijas, sus
          documentos le llegan de inmediato o los revisas tú primero.
        </p>
      </div>

      <FormularioLinks />

      <div>
        <h2 className="font-serif text-lg font-bold text-flow-900">Links creados</h2>
        {!links || links.length === 0 ? (
          <p className="mt-2 text-sm text-flow-700">Todavía no has creado ninguno.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl ring-1 ring-flow-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-flow-50 text-xs font-semibold uppercase tracking-wide text-flow-700">
                <tr>
                  <th className="px-3 py-2">Paciente</th>
                  <th className="px-3 py-2">Correo</th>
                  <th className="px-3 py-2">Modo</th>
                  <th className="px-3 py-2">Creado</th>
                  <th className="px-3 py-2">Usado</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link.id} className="border-t border-flow-100">
                    <td className="px-3 py-2">{link.etiqueta ?? '—'}</td>
                    <td className="px-3 py-2 text-flow-700">{link.correo_destino ?? '—'}</td>
                    <td className="px-3 py-2 text-flow-700">
                      {link.modo === 'acompanado' ? 'Acompañado' : 'Directo'}
                    </td>
                    <td className="px-3 py-2 text-flow-700">
                      {new Date(link.creado_at).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-3 py-2">
                      {usados.has(link.id) ? (
                        <span className="font-semibold text-flow-600">Sí</span>
                      ) : (
                        <span className="text-flow-400">No</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <BotonEliminarLink linkId={link.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
