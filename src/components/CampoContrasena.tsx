'use client';

import { useState } from 'react';

/**
 * Input de contraseña con el "ojito" para mostrar/ocultar el texto — se
 * usa en login, registro y en la pantalla de nueva contraseña, para no
 * repetir el mismo botón 3 veces.
 */
export function CampoContrasena({
  id,
  etiqueta,
  autoComplete,
  minLength,
}: {
  id: string;
  etiqueta: string;
  autoComplete: string;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-flow-900">{etiqueta}</span>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          required
          autoComplete={autoComplete}
          minLength={minLength}
          className="w-full rounded-lg border border-flow-200 bg-white px-3 py-2 pr-10 text-sm text-flow-text outline-none focus:border-flow-600 focus:ring-2 focus:ring-flow-200"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-flow-400 hover:text-flow-700"
        >
          {visible ? <IconoOjoTachado /> : <IconoOjo />}
        </button>
      </div>
    </label>
  );
}

function IconoOjo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3.5" />
    </svg>
  );
}

function IconoOjoTachado() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M3 3l18 18M10.6 10.6a3.5 3.5 0 0 0 4.8 4.8M6.6 6.7C3.9 8.4 1.5 12 1.5 12s3.5 7 10.5 7c2 0 3.7-.5 5.1-1.3M9.9 5.2A11 11 0 0 1 12 5c7 0 10.5 7 10.5 7-.4.8-1.4 2.5-3 4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
