import Image from 'next/image';
import { createAdminClient } from '@/lib/supabase/server';
import { IMG } from '@/lib/imagenesWeb';
import { JuegoPilares } from './JuegoPilares';

export default async function PilaresPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const admin = createAdminClient();
  const { data: link } = await admin.from('flow_pilares_links').select('id, activo').eq('id', token).maybeSingle();

  if (!link || !link.activo) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white/70 p-8 text-center shadow-sm ring-1 ring-flow-200 backdrop-blur">
          <Image src={IMG.triste} alt="" width={140} height={140} className="mx-auto mb-4 h-28 w-auto object-contain" />
          <p className="text-xs font-bold uppercase tracking-widest text-flow-600">Los 4 Pilares</p>
          <h1 className="mt-1 font-serif text-2xl font-bold text-flow-900">Este link ya no está activo</h1>
          <p className="mt-3 text-sm leading-relaxed text-flow-800">
            Pídele a quien te lo compartió que te pase el link vigente.
          </p>
        </div>
      </main>
    );
  }

  return <JuegoPilares linkId={link.id} />;
}
