import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { IMG } from '@/lib/imagenesWeb';
import { GeneradorDocumento } from './GeneradorDocumento';

export default async function ResultadoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: cuestionario } = await supabase
    .from('flow_cuestionarios')
    .select('id, completado_at')
    .eq('usuario_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!cuestionario?.completado_at) {
    redirect('/cuestionario');
  }

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

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white/70 p-8 text-center shadow-sm ring-1 ring-flow-200 backdrop-blur">
        <Image src={IMG.p6} alt="" width={160} height={160} className="mx-auto mb-4 h-32 w-auto object-contain" />
        <p className="text-xs font-bold uppercase tracking-widest text-flow-600">Guía del Flow</p>

        {/* ── Paso 1: la Guía ── */}
        {guiaLista ? (
          <>
            <h1 className="mt-1 font-serif text-2xl font-bold text-flow-900">¡Tu Guía está lista!</h1>
            <p className="mt-3 text-sm leading-relaxed text-flow-800">
              La escribimos especialmente para ti a partir de todo lo que respondiste.
            </p>
            <a
              href="/api/descargar/guia"
              className="mt-6 inline-block w-full rounded-full bg-flow-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-flow-800"
            >
              Descargar mi Guía del Flow
            </a>
          </>
        ) : (
          <>
            <h1 className="mt-1 font-serif text-2xl font-bold text-flow-900">¡Terminaste el cuestionario!</h1>
            <p className="mt-3 text-sm leading-relaxed text-flow-800">
              Ahora podemos escribir tu Guía del Flow, tu documento personal con tus talentos, propósito y desafíos.
            </p>
            <GeneradorDocumento
              endpoint="/api/generar-guia"
              textoBoton="Generar mi Guía del Flow"
              textoEspera="Estamos escribiendo tu Guía del Flow… esto puede tardar un minuto, no cierres esta página."
              estadoInicial={guia?.estado === 'error' ? 'error' : null}
              dispararTrasExito="/api/circulo/sincronizar"
            />
          </>
        )}

        {/* ── Paso 2: la Carta (solo aparece cuando la Guía ya está lista) ── */}
        {guiaLista && (
          <div className="mt-8 border-t border-flow-100 pt-6">
            {cartaLista ? (
              <>
                <h2 className="font-serif text-xl font-bold text-flow-900">Tu Carta de Flowi también está lista</h2>
                <p className="mt-2 text-sm leading-relaxed text-flow-800">
                  Un mensaje personal respondiendo lo que nos compartiste, escrito con todo el cariño. También te
                  enviamos los dos documentos a tu correo.
                </p>
                <a
                  href="/api/descargar/carta"
                  className="mt-4 inline-block w-full rounded-full border border-flow-300 bg-white px-6 py-3 text-sm font-bold text-flow-800 transition hover:border-flow-500"
                >
                  Descargar mi Carta
                </a>
              </>
            ) : (
              <>
                <h2 className="font-serif text-xl font-bold text-flow-900">Todavía falta tu Carta</h2>
                <p className="mt-2 text-sm leading-relaxed text-flow-800">
                  Flowi ya leyó tu Guía — ahora puede responder tus 3 cuestionamientos en un mensaje personal.
                </p>
                <GeneradorDocumento
                  endpoint="/api/generar-carta"
                  textoBoton="Generar mi Carta"
                  textoEspera="Flowi está escribiendo tu Carta…"
                  estadoInicial={carta?.estado === 'error' ? 'error' : null}
                />
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
