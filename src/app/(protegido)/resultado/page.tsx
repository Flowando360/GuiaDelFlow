import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { IMG } from '@/lib/imagenesWeb';
import { GeneradorDocumento } from './GeneradorDocumento';
import { PrivacidadCirculo } from './PrivacidadCirculo';

export default async function ResultadoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: cuestionario } = await supabase
    .from('flow_cuestionarios')
    .select('id, completado_at, liberado_at')
    .eq('usuario_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!cuestionario?.completado_at) {
    redirect('/cuestionario');
  }

  const { data: perfil } = await supabase
    .from('flow_perfiles')
    .select('autorizacion_circulo_en, envio_link_id')
    .eq('id', user.id)
    .maybeSingle();

  const { data: documentos } = await supabase
    .from('flow_documentos')
    .select('*')
    .eq('cuestionario_id', cuestionario.id);

  const guia = documentos?.find((d) => d.tipo === 'guia');
  const carta = documentos?.find((d) => d.tipo === 'carta');

  // La descarga pasa por /api/descargar/[tipo] (nuestro propio dominio, con
  // Content-Disposition: attachment) en vez de un link directo a una URL
  // firmada de Supabase Storage — ver comentario en esa ruta para el porqué.
  const guiaLista = guia?.estado === 'listo';
  const cartaLista = carta?.estado === 'listo';

  // Modo 'acompanado' (ver flow_links_envio.modo / /panel): la persona
  // completó todo, pero los documentos quedan retenidos hasta que la
  // superusuaria los libera desde el panel. select('modo') sobre
  // flow_links_envio necesita el admin client porque no hay policy pública
  // de lectura ahí (a propósito, ver 0005).
  // Solo aplica una vez que YA están listos los dos documentos — antes de
  // eso, la persona debe poder seguir generándolos normalmente (esta parte
  // sí la dispara ella misma desde /resultado; lo único que se retiene es
  // el correo final y la descarga, ver /api/generar-carta y /panel).
  let retenidaAcompanado = false;
  if (guiaLista && cartaLista && perfil?.envio_link_id && !cuestionario.liberado_at) {
    const admin = createAdminClient();
    const { data: link } = await admin
      .from('flow_links_envio')
      .select('modo')
      .eq('id', perfil.envio_link_id)
      .maybeSingle();
    retenidaAcompanado = link?.modo === 'acompanado';
  }

  if (retenidaAcompanado) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white/70 p-8 text-center shadow-sm ring-1 ring-flow-200 backdrop-blur">
          <Image src={IMG.p6} alt="" width={160} height={160} className="mx-auto mb-4 h-32 w-auto object-contain" />
          <p className="text-xs font-bold uppercase tracking-widest text-flow-600">Guía del Flow</p>
          <h1 className="mt-1 font-serif text-2xl font-bold text-flow-900">Un camino acompañado</h1>
          <p className="mt-3 text-sm leading-relaxed text-flow-800">
            Este es un camino que recorres acompañada. Quien te invitó leerá primero tu Guía y tu Carta, y te las
            compartirá en el momento justo — para que cuando las recibas, no sea sola.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white/70 p-8 text-center shadow-sm ring-1 ring-flow-200 backdrop-blur">
        <Image src={IMG.p6} alt="" width={160} height={160} className="mx-auto mb-4 h-32 w-auto object-contain" />
        <p className="text-xs font-bold uppercase tracking-widest text-flow-600">Guía del Flow</p>

        {guiaLista && cartaLista ? (
          // ── Ambos documentos listos: un solo bloque, un botón para cada uno ──
          <>
            <h1 className="mt-1 font-serif text-2xl font-bold text-flow-900">¡Tus documentos están listos!</h1>
            <p className="mt-3 text-sm leading-relaxed text-flow-800">
              Tu Guía del Flow y tu Carta de Flowi, escritas especialmente para ti a partir de todo lo que
              respondiste. También te las enviamos a tu correo.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <a
                href="/api/descargar/guia"
                className="inline-block w-full rounded-full bg-flow-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-flow-800"
              >
                Descargar mi Guía del Flow
              </a>
              <a
                href="/api/descargar/carta"
                className="inline-block w-full rounded-full border border-flow-300 bg-white px-6 py-3 text-sm font-bold text-flow-800 transition hover:border-flow-500"
              >
                Descargar mi Carta
              </a>
            </div>
          </>
        ) : guiaLista ? (
          // ── Caso de recuperación: la Guía quedó lista pero la Carta no (ej.
          // la persona cerró la página antes de que el botón único terminara,
          // o falló ese segundo paso) — se ofrece completar solo lo que falta.
          <>
            <h1 className="mt-1 font-serif text-2xl font-bold text-flow-900">¡Tu Guía está lista!</h1>
            <p className="mt-3 text-sm leading-relaxed text-flow-800">
              La escribimos especialmente para ti a partir de todo lo que respondiste.
            </p>
            <p className="mt-3 rounded-lg bg-flow-50 px-3 py-2 text-sm font-semibold text-flow-700">
              No olvides generar también tu Carta más abajo — el correo con los dos documentos te llega solo cuando
              generas ambos.
            </p>
            <a
              href="/api/descargar/guia"
              className="mt-6 inline-block w-full rounded-full bg-flow-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-flow-800"
            >
              Descargar mi Guía del Flow
            </a>
            <div className="mt-8 border-t border-flow-100 pt-6">
              <h2 className="font-serif text-xl font-bold text-flow-900">Todavía falta tu Carta</h2>
              <p className="mt-2 text-sm leading-relaxed text-flow-800">
                Flowi ya leyó tu Guía — ahora puede responder tus 3 cuestionamientos en un mensaje personal.
              </p>
              <GeneradorDocumento
                pasos={[
                  { endpoint: '/api/generar-carta', textoEspera: 'Flowi está escribiendo tu Carta…' },
                ]}
                textoBoton="Generar mi Carta"
                estadoInicial={carta?.estado === 'error' ? 'error' : null}
              />
            </div>
          </>
        ) : (
          // ── Arranque desde cero: un solo botón genera la Guía y, apenas
          // termina, sigue de una con la Carta — sin que la persona tenga que
          // volver a pinchar nada en el medio.
          <>
            <h1 className="mt-1 font-serif text-2xl font-bold text-flow-900">¡Terminaste el cuestionario!</h1>
            <p className="mt-3 text-sm leading-relaxed text-flow-800">
              Ahora podemos escribir tu Guía del Flow (tu documento personal con tus talentos, propósito y desafíos)
              y tu Carta de Flowi.
            </p>
            <GeneradorDocumento
              pasos={[
                {
                  endpoint: '/api/generar-guia',
                  textoEspera: 'Estamos escribiendo tu Guía del Flow… esto puede tardar un minuto, no cierres esta página.',
                  dispararTrasExito: '/api/circulo/sincronizar',
                },
                {
                  endpoint: '/api/generar-carta',
                  textoEspera: 'Ya casi — ahora Flowi está escribiendo tu Carta…',
                },
              ]}
              textoBoton="Generar mi Guía del Flow y mi Carta"
              estadoInicial={guia?.estado === 'error' ? 'error' : null}
            />
          </>
        )}

        <PrivacidadCirculo autorizadoInicial={Boolean(perfil?.autorizacion_circulo_en)} />
      </div>
    </main>
  );
}
