import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-flow-600">FlowAndo · El Lab del Talento</p>
      <h1 className="mt-3 max-w-xl font-serif text-4xl font-bold text-flow-900 sm:text-5xl">
        Descubre quién eres realmente
      </h1>
      <p className="mt-4 max-w-md text-flow-800">
        Completá el cuestionario y recibí tu Guía del Flow y una Carta personal escrita para vos.
      </p>

      <div className="mt-8 flex gap-3">
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
    </main>
  );
}
