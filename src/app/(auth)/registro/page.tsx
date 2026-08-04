'use client';

import { useActionState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { registrarse, type EstadoAuth } from '../actions';
import { IMG } from '@/lib/imagenesWeb';

const estadoInicial: EstadoAuth = {};

export default function RegistroPage() {
  const [estado, accion, enviando] = useActionState(registrarse, estadoInicial);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white/70 shadow-sm ring-1 ring-flow-200 backdrop-blur md:grid-cols-2">
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-flow-100 via-flow-50 to-flow-200 p-10 md:flex">
          <Image src={IMG.logo} alt="FlowAndo" width={140} height={40} className="h-9 w-auto" />
          <div className="flex flex-1 items-center justify-center py-8">
            <Image
              src={IMG.eureka}
              alt=""
              width={320}
              height={320}
              className="max-h-72 w-auto rounded-2xl object-contain"
            />
          </div>
          <p className="font-serif text-lg italic text-flow-900">
            Descubre quién eres realmente — El Lab del Talento.
          </p>
        </div>

        <div className="p-8 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-widest text-flow-600">Guía del Flow</p>
          <h1 className="mt-1 font-serif text-2xl font-bold text-flow-900">Crea tu cuenta</h1>
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
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="font-semibold text-flow-600 hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
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
