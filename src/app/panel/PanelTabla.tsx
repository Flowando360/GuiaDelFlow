'use client';

import { useMemo, useState } from 'react';
import { BotonLiberar, BotonDescargar, BotonReintentar } from './Acciones';

export interface FilaPanel {
  /** Null = sin cuenta en Guía del Flow -- solo tiene estado manual (ver /panel/estados-manuales). */
  usuarioId: string | null;
  nombre: string;
  email: string | null;
  empresa: string | null;
  empresaSiglas: string | null;
  etiqueta: string | null;
  modo: string;
  cuestionarioId: string | null;
  completado: boolean;
  liberadoAt: string | null;
  guiaLista: boolean;
  cartaLista: boolean;
  guiaEstado: string | null;
  cartaEstado: string | null;
  correoEnviadoAt: string | null;
  correoError: string | null;
  estadoManual: string | null;
  notaManual: string | null;
  /** ISO -- la más reciente entre generado_at de la Guía y la Carta. */
  fechaGeneracion: string | null;
  estadoTexto: string;
  correoTexto: string;
}

const SIN_EMPRESA = '__sin_empresa__';
const TODAS = '__todas__';

/** Clave estable por fila -- las filas sin cuenta (usuarioId null) no tienen nada que descargar ni seleccionar. */
function clave(fila: FilaPanel): string {
  return fila.usuarioId ?? `sin-cuenta:${fila.email ?? fila.nombre}`;
}

export function PanelTabla({ filas }: { filas: FilaPanel[] }) {
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [filtroEmpresa, setFiltroEmpresa] = useState(TODAS);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [descargando, setDescargando] = useState(false);
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null);

  const empresas = useMemo(
    () => [...new Set(filas.map((f) => f.empresa).filter((e): e is string => Boolean(e)))].sort(),
    [filas]
  );

  const filasFiltradas = useMemo(() => {
    return filas.filter((f) => {
      if (filtroEmpresa === SIN_EMPRESA && f.empresa) return false;
      if (filtroEmpresa !== TODAS && filtroEmpresa !== SIN_EMPRESA && f.empresa !== filtroEmpresa) return false;
      if ((desde || hasta) && !f.fechaGeneracion) return false;
      if (desde && f.fechaGeneracion! < desde) return false;
      // El input date da "AAAA-MM-DD" (sin hora) -- se compara contra la
      // fecha completa agregando el final del día para incluir "hasta" completo.
      if (hasta && f.fechaGeneracion! > `${hasta}T23:59:59`) return false;
      return true;
    });
  }, [filas, filtroEmpresa, desde, hasta]);

  // Solo tiene sentido seleccionar/descargar lo que ya tenga al menos un
  // documento listo -- lo demás (sin terminar, generando, en error) no
  // tiene nada que meter al zip.
  const filasDescargables = useMemo(() => filasFiltradas.filter((f) => f.guiaLista || f.cartaLista), [filasFiltradas]);
  const todasSeleccionadas = filasDescargables.length > 0 && filasDescargables.every((f) => seleccion.has(clave(f)));

  function alternarFila(key: string) {
    setSeleccion((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(key)) nuevo.delete(key);
      else nuevo.add(key);
      return nuevo;
    });
  }

  function alternarTodas() {
    setSeleccion((prev) => {
      if (todasSeleccionadas) {
        const nuevo = new Set(prev);
        for (const f of filasDescargables) nuevo.delete(clave(f));
        return nuevo;
      }
      const nuevo = new Set(prev);
      for (const f of filasDescargables) nuevo.add(clave(f));
      return nuevo;
    });
  }

  async function descargarSeleccion() {
    const items = filas
      .filter((f) => seleccion.has(clave(f)) && f.usuarioId && f.cuestionarioId)
      .map((f) => ({ usuarioId: f.usuarioId!, cuestionarioId: f.cuestionarioId }));
    if (items.length === 0) return;

    setErrorDescarga(null);
    setDescargando(true);
    try {
      const res = await fetch('/api/panel/descargar-masivo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'No se pudo armar la descarga.');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `guia-del-flow_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErrorDescarga(e instanceof Error ? e.message : 'No se pudo armar la descarga.');
    } finally {
      setDescargando(false);
    }
  }

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
            <option value={SIN_EMPRESA}>Sin empresa (PS)</option>
            {empresas.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-flow-700">Generado desde</label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="rounded-lg border border-flow-300 bg-white px-2.5 py-1.5 text-sm text-flow-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-flow-700">Generado hasta</label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="rounded-lg border border-flow-300 bg-white px-2.5 py-1.5 text-sm text-flow-900"
          />
        </div>
        {(filtroEmpresa !== TODAS || desde || hasta) && (
          <button
            type="button"
            onClick={() => {
              setFiltroEmpresa(TODAS);
              setDesde('');
              setHasta('');
            }}
            className="text-xs font-semibold text-flow-600 hover:underline"
          >
            Limpiar filtros
          </button>
        )}

        <div className="ml-auto flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-flow-700">
              {seleccion.size} seleccionada{seleccion.size === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              disabled={seleccion.size === 0 || descargando}
              onClick={descargarSeleccion}
              className="rounded-full bg-flow-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-flow-800 disabled:opacity-40"
            >
              {descargando ? 'Armando ZIP…' : 'Descargar seleccionados'}
            </button>
          </div>
          {errorDescarga && <p className="max-w-xs text-right text-xs font-semibold text-red-600">{errorDescarga}</p>}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl ring-1 ring-flow-200">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="bg-flow-50 text-xs font-semibold uppercase tracking-wide text-flow-700">
            <tr>
              <th className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={todasSeleccionadas}
                  onChange={alternarTodas}
                  disabled={filasDescargables.length === 0}
                  aria-label="Seleccionar todas las descargables (según filtro)"
                />
              </th>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Empresa / Etiqueta</th>
              <th className="px-3 py-2">Origen</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Correo</th>
              <th className="px-3 py-2">Documentos</th>
            </tr>
          </thead>
          <tbody>
            {filasFiltradas.map((fila) => (
              <tr key={clave(fila)} className="border-t border-flow-100 align-top">
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={seleccion.has(clave(fila))}
                    onChange={() => alternarFila(clave(fila))}
                    disabled={!fila.guiaLista && !fila.cartaLista}
                    aria-label={`Seleccionar a ${fila.nombre}`}
                  />
                </td>
                <td className="px-3 py-3">
                  <div className="font-semibold text-flow-900">{fila.nombre}</div>
                  <div className="text-xs text-flow-600">{fila.email ?? '—'}</div>
                </td>
                <td className="px-3 py-3 text-flow-700">{fila.empresa ?? fila.etiqueta ?? '—'}</td>
                <td className="px-3 py-3 text-flow-700">
                  {fila.empresa ? 'Círculo de Crecimiento' : fila.modo === 'acompanado' ? 'Acompañado' : 'Directo'}
                </td>
                <td className="px-3 py-3 text-flow-700">{fila.estadoTexto}</td>
                <td className={`px-3 py-3 ${fila.correoTexto.startsWith('Falló') ? 'font-semibold text-red-600' : 'text-flow-700'}`}>
                  {fila.correoTexto}
                </td>
                <td className="px-3 py-3">
                  {fila.guiaLista && fila.cartaLista && fila.cuestionarioId ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <BotonDescargar cuestionarioId={fila.cuestionarioId} tipo="guia" texto="Guía" />
                      <BotonDescargar cuestionarioId={fila.cuestionarioId} tipo="carta" texto="Carta" />
                      {fila.modo === 'acompanado' && !fila.liberadoAt && (
                        <BotonLiberar cuestionarioId={fila.cuestionarioId} />
                      )}
                      {fila.modo === 'acompanado' && fila.liberadoAt && (
                        <span className="text-xs font-semibold text-flow-500">Ya liberada</span>
                      )}
                      {/* Documentos listos pero el correo nunca se confirmó -- Reintentar
                          acá NO regenera el PDF, solo reintenta el envío (ver carta.ts). */}
                      {fila.correoTexto !== '—' && fila.correoTexto !== 'Enviado' && fila.usuarioId && (
                        <BotonReintentar usuarioId={fila.usuarioId} texto="Reenviar correo" />
                      )}
                    </div>
                  ) : fila.completado && fila.usuarioId ? (
                    <BotonReintentar usuarioId={fila.usuarioId} />
                  ) : (
                    <span className="text-xs text-flow-400">—</span>
                  )}
                </td>
              </tr>
            ))}
            {filasFiltradas.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-sm text-flow-400">
                  Ningún registro coincide con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
