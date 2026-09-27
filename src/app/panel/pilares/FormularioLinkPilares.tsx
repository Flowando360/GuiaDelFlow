'use client';

import { useActionState, useState, useTransition } from 'react';
import { crearLinkPilares, alternarLinkPilares, eliminarLinkPilares, type EstadoCrearLinkPilares } from './actions';

const estadoInicial: EstadoCrearLinkPilares = {};

export function FormularioLinkPilares() {
  const [estado, accion, enviando] = useActionState(crearLinkPilares, estadoInicial);
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    if (!estado.link) return;
    await navigator.clipboard.writeText(estado.link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="rounded-2xl bg-white/70 p-6 shadow-sm ring-1 ring-flow-200 backdrop-blur">
      <form action={accion} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1">
          <span className="mb-1 block text-sm font-semibold text-flow-900">Etiqueta de la campaña</span>
          <input
            name="etiqueta"
            type="text"
            required
            placeholder="Encuentro Networking Sept"
            className="w-full rounded-lg border border-flow-200 bg-white px-3 py-2 text-sm text-flow-text outline-none focus:border-flow-600 focus:ring-2 focus:ring-flow-200"
          />
        </label>
        <button
          type="submit"
          disabled={enviando}
          className="h-fit rounded-full bg-flow-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-flow-800 disabled:opacity-60"
        >
          {enviando ? 'Creando…' : 'Crear link'}
        </button>
      </form>

      {estado.error && <p className="mt-4 text-sm font-semibold text-red-600">{estado.error}</p>}

      {estado.link && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-flow-900">Link creado — compártelo con quien quieras</span>
            <button
              type="button"
              onClick={copiar}
              className="rounded-full bg-flow-100 px-3 py-1 text-xs font-bold text-flow-700 hover:bg-flow-200"
            >
              {copiado ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
          <input
            readOnly
            value={estado.link}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full rounded-lg border border-flow-200 bg-flow-50 px-3 py-2 font-mono text-xs text-flow-900"
          />
        </div>
      )}
    </div>
  );
}

export function BotonAlternarLink({ linkId, activo }: { linkId: string; activo: boolean }) {
  const [pendiente, iniciar] = useTransition();
  return (
    <button
      type="button"
      disabled={pendiente}
      onClick={() => iniciar(async () => { await alternarLinkPilares(linkId, !activo); })}
      className="text-xs font-semibold text-flow-700 hover:underline disabled:opacity-50"
    >
      {activo ? 'Desactivar' : 'Reactivar'}
    </button>
  );
}

export function BotonEliminarLinkPilares({ linkId }: { linkId: string }) {
  const [pendiente, iniciar] = useTransition();
  const [confirmando, setConfirmando] = useState(false);

  function onClick() {
    if (!confirmando) {
      setConfirmando(true);
      return;
    }
    iniciar(async () => { await eliminarLinkPilares(linkId); });
  }

  return (
    <button
      type="button"
      disabled={pendiente}
      onClick={onClick}
      className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
    >
      {confirmando ? '¿Seguro? Clic de nuevo' : 'Eliminar'}
    </button>
  );
}
