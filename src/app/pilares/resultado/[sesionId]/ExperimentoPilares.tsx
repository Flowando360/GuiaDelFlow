'use client';

import { useState } from 'react';
import { guardarCompromiso24h } from './actions';

export function ExperimentoPilares({ sesionId, sugerencia }: { sesionId: string; sugerencia: string }) {
  const [compromiso, setCompromiso] = useState('');
  const [guardado, setGuardado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setGuardando(true);
    await guardarCompromiso24h(sesionId, compromiso);
    setGuardando(false);
    setGuardado(true);
  }

  return (
    <div className="mt-8 border-t border-flow-100 pt-6 text-left">
      <p className="text-xs font-bold uppercase tracking-widest text-flow-600">Y ahora, una pequeña acción</p>
      <p className="mt-2 text-sm leading-relaxed text-flow-800">
        No necesitas cambiar toda tu vida. Elige una pequeña acción relacionada con lo que acabas de descubrir.
      </p>
      <p className="mt-3 rounded-lg bg-flow-50 px-3 py-2 text-sm text-flow-800">{sugerencia}</p>

      {guardado ? (
        <p className="mt-4 text-sm font-semibold text-flow-700">💜 Guardado. Suerte con tu compromiso.</p>
      ) : (
        <>
          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-semibold text-flow-900">¿Qué vas a hacer? (opcional)</span>
            <input
              type="text"
              value={compromiso}
              onChange={(e) => setCompromiso(e.target.value)}
              className="w-full rounded-lg border border-flow-200 bg-white px-3 py-2 text-sm text-flow-text outline-none focus:border-flow-600 focus:ring-2 focus:ring-flow-200"
            />
          </label>
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="mt-3 w-full rounded-full border border-flow-300 bg-white px-6 py-2.5 text-sm font-bold text-flow-800 transition hover:border-flow-500 disabled:opacity-60"
          >
            Guardar mi compromiso
          </button>
        </>
      )}
    </div>
  );
}
