'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { IMG } from '@/lib/imagenesWeb';

// Cada cuánto se pregunta si ya se confirmó, y por cuánto tiempo — pasado
// ese límite se deja de insistir (la persona igual puede refrescar la
// página si confirma más tarde; ver comentario en la página de arriba).
const INTERVALO_MS = 3000;
const LIMITE_MS = 3 * 60 * 1000;

export default function RevisaTuCorreoPage() {
  return (
    <Suspense fallback={<Tarjeta titulo="Revisa tu correo" cuerpo="Cargando…" />}>
      <RevisaTuCorreoContenido />
    </Suspense>
  );
}

function RevisaTuCorreoContenido() {
  const id = useSearchParams().get('id');
  const [confirmado, setConfirmado] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const empezoEn = useRef<number | null>(null);

  useEffect(() => {
    if (!id) return;
    empezoEn.current = Date.now();

    let cancelado = false;
    const intervalo = setInterval(async () => {
      if (empezoEn.current !== null && Date.now() - empezoEn.current > LIMITE_MS) {
        clearInterval(intervalo);
        return;
      }
      try {
        const respuesta = await fetch(`/api/auth/estado-confirmacion?id=${encodeURIComponent(id)}`);
        const datos = await respuesta.json();
        if (!cancelado && datos.confirmado) {
          setConfirmado(true);
          setEmail(datos.email ?? null);
          clearInterval(intervalo);
        }
      } catch {
        // Un fallo de red puntual no debe romper el polling — se reintenta
        // en el siguiente tick.
      }
    }, INTERVALO_MS);

    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, [id]);

  if (confirmado) {
    return (
      <Tarjeta
        titulo="¡Tu correo ya quedó confirmado!"
        cuerpo={
          <>
            <p className="mt-3 text-sm leading-relaxed text-flow-800">
              A veces esto pasa automáticamente — por ejemplo, si tu correo es de una empresa o
              universidad con filtros de seguridad que revisan los links antes de que los veas. No
              hace falta que busques el correo: ya puedes continuar.
            </p>
            <Link
              href={email ? `/login?email=${encodeURIComponent(email)}` : '/login'}
              className="mt-6 inline-block w-full rounded-full bg-flow-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-flow-800"
            >
              Iniciar sesión
            </Link>
          </>
        }
      />
    );
  }

  return (
    <Tarjeta
      titulo="Revisa tu correo"
      cuerpo={
        <p className="mt-3 text-sm leading-relaxed text-flow-800">
          Te mandamos un link de confirmación. Haz clic ahí para activar tu cuenta y empezar tu
          cuestionario — esta página se actualiza sola apenas lo confirmes.
        </p>
      }
    />
  );
}

function Tarjeta({ titulo, cuerpo }: { titulo: string; cuerpo: React.ReactNode }) {
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
        <h1 className="mt-1 font-serif text-2xl font-bold text-flow-900">{titulo}</h1>
        {cuerpo}
      </div>
    </main>
  );
}
