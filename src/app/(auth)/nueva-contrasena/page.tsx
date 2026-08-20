'use client';

import { useActionState } from 'react';
import Image from 'next/image';
import { actualizarContrasena, type EstadoAuth } from '../actions';
import { IMG } from '@/lib/imagenesWeb';
import { CampoContrasena } from '@/components/CampoContrasena';

const estadoInicial: EstadoAuth = {};

export default function NuevaContrasenaPage() {
  const [estado, accion, enviando] = useActionState(actualizarContrasena, estadoInicial);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
      <div className="w-full max-w-sm rounded-2xl bg-white/70 p-8 shadow-sm ring-1 ring-flow-200 backdrop-blur">
        <Image src={IMG.logo} alt="FlowAndo" width={120} height={34} className="mb-6 h-7 w-auto" />
        <p className="text-xs font-bold uppercase tracking-widest text-flow-600">Guía del Flow</p>
        <h1 className="mt-1 font-serif text-2xl font-bold text-flow-900">Elige tu nueva contraseña</h1>

        <form action={accion} className="mt-6 space-y-4">
          <CampoContrasena
            id="password"
            etiqueta="Contraseña nueva (mínimo 8 caracteres)"
            autoComplete="new-password"
            minLength={8}
          />

          {estado.error && <p className="text-sm font-semibold text-red-600">{estado.error}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-full bg-flow-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-flow-800 disabled:opacity-60"
          >
            {enviando ? 'Guardando…' : 'Guardar y continuar'}
          </button>
        </form>
      </div>
    </main>
  );
}
