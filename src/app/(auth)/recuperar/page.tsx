'use client';

import { useActionState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { recuperarContrasena, type EstadoAuth } from '../actions';
import { IMG } from '@/lib/imagenesWeb';

const estadoInicial: EstadoAuth = {};

export default function RecuperarPage() {
  const [estado, accion, enviando] = useActionState(recuperarContrasena, estadoInicial);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
      <div className="w-full max-w-sm rounded-2xl bg-white/70 p-8 shadow-sm ring-1 ring-flow-200 backdrop-blur">
        <Image src={IMG.logo} alt="FlowAndo" width={120} height={34} className="mb-6 h-7 w-auto" />
        <p className="text-xs font-bold uppercase tracking-widest text-flow-600">Guía del Flow</p>
        <h1 className="mt-1 font-serif text-2xl font-bold text-flow-900">Recupera tu contraseña</h1>
        <p className="mt-2 text-sm text-flow-800">
          Escribe tu correo y te mandamos un link para elegir una contraseña nueva.
        </p>

        {estado.mensaje ? (
          <p className="mt-6 rounded-lg bg-flow-50 p-4 text-sm text-flow-800">{estado.mensaje}</p>
        ) : (
          <form action={accion} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-flow-900">Correo electrónico</span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-lg border border-flow-200 bg-white px-3 py-2 text-sm text-flow-text outline-none focus:border-flow-600 focus:ring-2 focus:ring-flow-200"
              />
            </label>

            {estado.error && <p className="text-sm font-semibold text-red-600">{estado.error}</p>}

            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-full bg-flow-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-flow-800 disabled:opacity-60"
            >
              {enviando ? 'Enviando…' : 'Mandar link'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-flow-800">
          <Link href="/login" className="font-semibold text-flow-600 hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
