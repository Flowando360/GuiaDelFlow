'use client';

import { useActionState, useState } from 'react';
import { crearLinksEnvio, type EstadoCrearLinks } from './actions';

const estadoInicial: EstadoCrearLinks = {};

export function FormularioLinks() {
  const [estado, accion, enviando] = useActionState(crearLinksEnvio, estadoInicial);
  const [copiado, setCopiado] = useState(false);

  async function copiarTodos() {
    if (!estado.links) return;
    await navigator.clipboard.writeText(estado.links.join('\n'));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="rounded-2xl bg-white/70 p-6 shadow-sm ring-1 ring-flow-200 backdrop-blur">
      <form action={accion} className="grid gap-4 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-flow-900">Correo de destino</span>
          <input
            name="correo_destino"
            type="email"
            required
            placeholder="psicologo@correo.com"
            className="w-full rounded-lg border border-flow-200 bg-white px-3 py-2 text-sm text-flow-text outline-none focus:border-flow-600 focus:ring-2 focus:ring-flow-200"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-flow-900">Cuántos links</span>
          <input
            name="cantidad"
            type="number"
            min={1}
            max={100}
            defaultValue={1}
            required
            className="w-full rounded-lg border border-flow-200 bg-white px-3 py-2 text-sm text-flow-text outline-none focus:border-flow-600 focus:ring-2 focus:ring-flow-200"
          />
        </label>
        <button
          type="submit"
          disabled={enviando}
          className="h-fit rounded-full bg-flow-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-flow-800 disabled:opacity-60"
        >
          {enviando ? 'Creando…' : 'Crear'}
        </button>
        <label className="block sm:col-span-3">
          <span className="mb-1 block text-sm font-semibold text-flow-900">
            Etiqueta (opcional — para reconocerlo después, ej. nombre del profesional)
          </span>
          <input
            name="etiqueta"
            type="text"
            placeholder="Consultorio Dra. Pérez"
            className="w-full rounded-lg border border-flow-200 bg-white px-3 py-2 text-sm text-flow-text outline-none focus:border-flow-600 focus:ring-2 focus:ring-flow-200"
          />
        </label>
      </form>

      {estado.error && <p className="mt-4 text-sm font-semibold text-red-600">{estado.error}</p>}

      {estado.links && estado.links.length > 0 && (
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-flow-900">
              {estado.links.length === 1 ? '1 link creado' : `${estado.links.length} links creados`}
            </span>
            <button
              type="button"
              onClick={copiarTodos}
              className="rounded-full bg-flow-100 px-3 py-1 text-xs font-bold text-flow-700 hover:bg-flow-200"
            >
              {copiado ? '¡Copiado!' : 'Copiar todos'}
            </button>
          </div>
          <textarea
            readOnly
            rows={Math.min(estado.links.length, 10)}
            value={estado.links.join('\n')}
            className="w-full rounded-lg border border-flow-200 bg-flow-50 px-3 py-2 font-mono text-xs text-flow-900"
            onFocus={(e) => e.currentTarget.select()}
          />
        </div>
      )}
    </div>
  );
}
