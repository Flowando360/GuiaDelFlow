import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { IMG } from '@/lib/imagenesWeb';
import { GeneradorGuia } from './GeneradorGuia';

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

  const { data: documento } = await supabase
    .from('flow_documentos')
    .select('*')
    .eq('cuestionario_id', cuestionario.id)
    .eq('tipo', 'guia')
    .maybeSingle();

  let urlDescarga: string | null = null;
  if (documento?.estado === 'listo' && documento.storage_path) {
    const { data } = await supabase.storage.from('guia-del-flow').createSignedUrl(documento.storage_path, 3600);
    urlDescarga = data?.signedUrl ?? null;
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white/70 p-8 text-center shadow-sm ring-1 ring-flow-200 backdrop-blur">
        <Image src={IMG.p6} alt="" width={160} height={160} className="mx-auto mb-4 h-32 w-auto object-contain" />
        <p className="text-xs font-bold uppercase tracking-widest text-flow-600">Guía del Flow</p>

        {documento?.estado === 'listo' && urlDescarga ? (
          <>
            <h1 className="mt-1 font-serif text-2xl font-bold text-flow-900">¡Tu Guía está lista!</h1>
            <p className="mt-3 text-sm leading-relaxed text-flow-800">
              La escribimos especialmente para ti a partir de todo lo que respondiste. Descárgala y léela con calma.
            </p>
            <a
              href={urlDescarga}
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
            <GeneradorGuia estadoInicial={documento?.estado === 'error' ? 'error' : null} />
          </>
        )}
      </div>
    </main>
  );
}
