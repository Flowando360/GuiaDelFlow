'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { registrarse, type EstadoAuth } from '../actions';

const estadoInicial: EstadoAuth = {};

export default function RegistroPage() {
  const [estado, accion, enviando] = useActionState(registrarse, estadoInicial);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-white/70 p-8 shadow-sm ring-1 ring-flow-200 backdrop-blur">
        <p className="text-xs font-bold uppercase tracking-widest text-flow-600">Guía del Flow</p>
        <h1 className="mt-1 font-serif text-2xl font-bold text-flow-900">Creá tu cuenta</h1>
        <p className="mt-1 text-sm text-flow-800">
          Para guardar tu progreso y entregarte tus documentos cuando estén listos.
        </p>

        <form action={accion} className="mt-6 space-y-4">
          <Campo id="nombre_completo" etiqueta="Nombres y apellidos" tipo="text" autoComplete="name" />
          <Campo id="email" etiqueta="Correo electrónico" tipo="email" autoComplete="email" />
          <Campo
            id="password"
            etiqueta="Contraseña (mínimo 8 caracteres)"
            tipo="password"
            autoComplete="new-password"
          />

          {estado.error && <p className="text-sm font-semibold text-red-600">{estado.error}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-full bg-flow-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-flow-800 disabled:opacity-60"
          >
            {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-flow-800">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="font-semibold text-flow-600 hover:underline">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </main>
  );
}

function Campo({
  id,
  etiqueta,
  tipo,
  autoComplete,
}: {
  id: string;
  etiqueta: string;
  tipo: string;
  autoComplete: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-flow-900">{etiqueta}</span>
      <input
        id={id}
        name={id}
        type={tipo}
        required
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-flow-200 bg-white px-3 py-2 text-sm text-flow-text outline-none focus:border-flow-600 focus:ring-2 focus:ring-flow-200"
      />
    </label>
  );
}
