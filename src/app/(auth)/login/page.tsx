'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { iniciarSesion, type EstadoAuth } from '../actions';

const estadoInicial: EstadoAuth = {};

export default function LoginPage() {
  const [estado, accion, enviando] = useActionState(iniciarSesion, estadoInicial);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-white/70 p-8 shadow-sm ring-1 ring-flow-200 backdrop-blur">
        <p className="text-xs font-bold uppercase tracking-widest text-flow-600">Guía del Flow</p>
        <h1 className="mt-1 font-serif text-2xl font-bold text-flow-900">Iniciá sesión</h1>

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
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-flow-900">Contraseña</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-flow-200 bg-white px-3 py-2 text-sm text-flow-text outline-none focus:border-flow-600 focus:ring-2 focus:ring-flow-200"
            />
          </label>

          {estado.error && <p className="text-sm font-semibold text-red-600">{estado.error}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-full bg-flow-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-flow-800 disabled:opacity-60"
          >
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-flow-800">
          ¿Todavía no tenés cuenta?{' '}
          <Link href="/registro" className="font-semibold text-flow-600 hover:underline">
            Creá una
          </Link>
        </p>
      </div>
    </main>
  );
}
