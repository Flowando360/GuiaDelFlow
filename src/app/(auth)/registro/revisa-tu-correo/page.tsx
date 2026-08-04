import Image from 'next/image';
import { IMG } from '@/lib/imagenesWeb';

export default function RevisaTuCorreoPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-white/70 p-8 text-center shadow-sm ring-1 ring-flow-200 backdrop-blur">
        <Image
          src={IMG.escribe}
          alt=""
          width={160}
          height={160}
          className="mx-auto mb-4 h-32 w-auto object-contain"
        />
        <p className="text-xs font-bold uppercase tracking-widest text-flow-600">Guía del Flow</p>
        <h1 className="mt-1 font-serif text-2xl font-bold text-flow-900">Revisa tu correo</h1>
        <p className="mt-3 text-sm leading-relaxed text-flow-800">
          Te mandamos un link de confirmación. Haz clic ahí para activar tu cuenta y empezar tu
          cuestionario.
        </p>
      </div>
    </main>
  );
}
