import Image from 'next/image';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { IMG } from '@/lib/imagenesWeb';
import { GeneradorPilares } from './GeneradorPilares';

export default async function ResultadoPilaresPage({ params }: { params: Promise<{ sesionId: string }> }) {
  const { sesionId } = await params;

  const admin = createAdminClient();
  const { data: sesion } = await admin
    .from('flow_pilares_sesiones')
    .select('id, nombre, estado')
    .eq('id', sesionId)
    .maybeSingle();

  if (!sesion) notFound();

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white/70 p-8 text-center shadow-sm ring-1 ring-flow-200 backdrop-blur">
        <Image src={IMG.p6} alt="" width={160} height={160} className="mx-auto mb-4 h-32 w-auto object-contain" />
        <p className="text-xs font-bold uppercase tracking-widest text-flow-600">Los 4 Pilares</p>

        {sesion.estado === 'listo' && (
          <>
            <h1 className="mt-1 font-serif text-2xl font-bold text-flow-900">¡{sesion.nombre}, ya está listo!</h1>
            <p className="mt-3 text-sm leading-relaxed text-flow-800">
              Tu Pertenencia, tu Propósito, tu Trascendencia y tu historia, escritos a partir de lo que jugaste.
              También te lo enviamos a tu correo.
            </p>
            <a
              href={`/api/pilares/descargar/${sesion.id}`}
              className="mt-6 inline-block w-full rounded-full bg-flow-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-flow-800"
            >
              Descargar mis 4 Pilares
            </a>
          </>
        )}

        {sesion.estado === 'generando' && (
          <>
            <h1 className="mt-1 font-serif text-2xl font-bold text-flow-900">Todavía lo estamos tejiendo…</h1>
            <p className="mt-3 text-sm leading-relaxed text-flow-800">Espera un momento y recarga esta página.</p>
          </>
        )}

        {sesion.estado === 'error' && (
          <>
            <h1 className="mt-1 font-serif text-2xl font-bold text-flow-900">Algo se cruzó en el camino</h1>
            <p className="mt-3 text-sm leading-relaxed text-flow-800">
              No pudimos terminar de escribir tu resultado. Intenta de nuevo.
            </p>
            <GeneradorPilares sesionId={sesion.id} />
          </>
        )}
      </div>
    </main>
  );
}
