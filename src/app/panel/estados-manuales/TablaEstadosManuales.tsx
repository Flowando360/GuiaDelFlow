'use client';

import { useMemo, useState, useTransition } from 'react';
import { ESTADOS_MANUALES, etiquetaEstadoManual } from '@/lib/panel/estadosManuales';
import { guardarEstadosManuales, quitarEstadoManual } from './actions';

export interface FilaColaborador {
  colaboradorId: string;
  nombre: string;
  email: string | null;
  empresa: string;
  /** Ya tiene Guía+Carta generadas de verdad en el sistema (no solo cuenta creada). */
  tieneGuiaReal: boolean;
  estadoManual: string | null;
  notaManual: string | null;
}

const TODAS = '__todas__';

export function TablaEstadosManuales({ filas, empresas }: { filas: FilaColaborador[]; empresas: string[] }) {
  const [filtroEmpresa, setFiltroEmpresa] = useState(empresas.length === 1 ? empresas[0] : TODAS);
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [estado, setEstado] = useState<string>(ESTADOS_MANUALES[0].valor);
  const [nota, setNota] = useState('');
  const [pendiente, iniciar] = useTransition();
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

  const filasFiltradas = useMemo(
    () => (filtroEmpresa === TODAS ? filas : filas.filter((f) => f.empresa === filtroEmpresa)),
    [filas, filtroEmpresa]
  );

  function alternar(id: string) {
    setSeleccion((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  }

  function alternarTodas() {
    const todasMarcadas = filasFiltradas.length > 0 && filasFiltradas.every((f) => seleccion.has(f.colaboradorId));
    setSeleccion((prev) => {
      const nuevo = new Set(prev);
      for (const f of filasFiltradas) {
        if (todasMarcadas) nuevo.delete(f.colaboradorId);
        else nuevo.add(f.colaboradorId);
      }
      return nuevo;
    });
  }

  function guardar() {
    setMensaje(null);
    iniciar(async () => {
      const resultado = await guardarEstadosManuales([...seleccion], estado, nota);
      if (resultado.ok) {
        setMensaje({ ok: true, texto: `Estado guardado para ${seleccion.size} persona${seleccion.size === 1 ? '' : 's'}.` });
        setSeleccion(new Set());
        setNota('');
      } else {
        setMensaje({ ok: false, texto: resultado.error ?? 'No se pudo guardar.' });
      }
    });
  }

  function quitar(colaboradorId: string) {
    iniciar(async () => {
      await quitarEstadoManual(colaboradorId);
    });
  }

  const todasMarcadas = filasFiltradas.length > 0 && filasFiltradas.every((f) => seleccion.has(f.colaboradorId));

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-xl bg-flow-50 p-4 ring-1 ring-flow-200">
        <div>
          <label className="mb-1 block text-xs font-semibold text-flow-700">Empresa</label>
          <select
            value={filtroEmpresa}
            onChange={(e) => setFiltroEmpresa(e.target.value)}
            className="rounded-lg border border-flow-300 bg-white px-2.5 py-1.5 text-sm text-flow-900"
          >
            <option value={TODAS}>Todas</option>
            {empresas.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-flow-700">Nuevo estado para los seleccionados</label>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="rounded-lg border border-flow-300 bg-white px-2.5 py-1.5 text-sm text-flow-900"
          >
            {ESTADOS_MANUALES.map((e) => (
              <option key={e.valor} value={e.valor}>
                {e.etiqueta}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[220px] flex-1">
          <label className="mb-1 block text-xs font-semibold text-flow-700">Nota (opcional)</label>
          <input
            type="text"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Ej. Se le entregó en persona antes de este sistema"
            className="w-full rounded-lg border border-flow-300 bg-white px-2.5 py-1.5 text-sm text-flow-900"
          />
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-flow-700">{seleccion.size} seleccionada{seleccion.size === 1 ? '' : 's'}</span>
            <button
              type="button"
              disabled={seleccion.size === 0 || pendiente}
              onClick={guardar}
              className="rounded-full bg-flow-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-flow-800 disabled:opacity-40"
            >
              {pendiente ? 'Guardando…' : 'Aplicar estado'}
            </button>
          </div>
          {mensaje && (
            <p className={`max-w-xs text-right text-xs font-semibold ${mensaje.ok ? 'text-flow-600' : 'text-red-600'}`}>
              {mensaje.texto}
            </p>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl ring-1 ring-flow-200">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-flow-50 text-xs font-semibold uppercase tracking-wide text-flow-700">
            <tr>
              <th className="px-3 py-2">
                <input type="checkbox" checked={todasMarcadas} onChange={alternarTodas} aria-label="Seleccionar todas (según filtro)" />
              </th>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Empresa</th>
              <th className="px-3 py-2">En el sistema</th>
              <th className="px-3 py-2">Estado manual</th>
            </tr>
          </thead>
          <tbody>
            {filasFiltradas.map((fila) => (
              <tr key={fila.colaboradorId} className="border-t border-flow-100 align-top">
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={seleccion.has(fila.colaboradorId)}
                    onChange={() => alternar(fila.colaboradorId)}
                    aria-label={`Seleccionar a ${fila.nombre}`}
                  />
                </td>
                <td className="px-3 py-3">
                  <div className="font-semibold text-flow-900">{fila.nombre}</div>
                  <div className="text-xs text-flow-600">{fila.email ?? '—'}</div>
                </td>
                <td className="px-3 py-3 text-flow-700">{fila.empresa}</td>
                <td className="px-3 py-3 text-flow-700">
                  {fila.tieneGuiaReal ? 'Guía y Carta generadas' : 'Sin generar'}
                </td>
                <td className="px-3 py-3">
                  {fila.estadoManual ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <div>
                        <div className="font-semibold text-flow-900">{etiquetaEstadoManual(fila.estadoManual)}</div>
                        {fila.notaManual && <div className="text-xs text-flow-600">{fila.notaManual}</div>}
                      </div>
                      <button
                        type="button"
                        disabled={pendiente}
                        onClick={() => quitar(fila.colaboradorId)}
                        className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-40"
                      >
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-flow-400">Sin marcar</span>
                  )}
                </td>
              </tr>
            ))}
            {filasFiltradas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-sm text-flow-400">
                  Ningún colaborador coincide con este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
