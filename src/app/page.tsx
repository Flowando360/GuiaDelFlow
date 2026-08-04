import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { IMG } from '@/lib/imagenesWeb';

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-10 px-4 py-12 sm:px-8 md:flex-row md:justify-between md:py-20">
      <div className="max-w-xl text-center md:text-left">
        <p className="text-xs font-bold uppercase tracking-widest text-flow-600">FlowAndo · El Lab del Talento</p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-flow-900 sm:text-5xl">
          Descubre quién eres realmente
        </h1>
        <p className="mt-4 text-flow-800">
          Completa el cuestionario y recibe tu Guía del Flow y una Carta personal escrita para ti.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
          {user ? (
            <Link
              href="/cuestionario"
              className="rounded-full bg-flow-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-flow-800"
            >
              Continuar mi cuestionario
            </Link>
          ) : (
            <>
              <Link
                href="/registro"
                className="rounded-full bg-flow-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-flow-800"
              >
                Empezar mi Guía del Flow
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-flow-200 bg-white px-6 py-3 text-sm font-bold text-flow-800 transition hover:border-flow-400"
              >
                Ya tengo cuenta
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="relative flex w-full max-w-md items-center justify-center rounded-3xl bg-gradient-to-br from-flow-100 via-flow-50 to-flow-200 p-10">
        <Image
          src={IMG.pmundo}
          alt="Personajes de FlowAndo alrededor del mundo"
          width={420}
          height={420}
          priority
          className="h-auto w-full max-w-sm object-contain"
        />
      </div>
    </main>
  );
}
