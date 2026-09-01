'use client';

import { useState, useTransition } from 'react';
import { liberarDocumentos, regenerarDocumentos } from './actions';

export function BotonDescargar({
  cuestionarioId,
  tipo,
  texto,
}: {
  cuestionarioId: string;
  tipo: 'guia' | 'carta';
  texto: string;
}) {
  return (
    <a
      href={`/api/panel/descargar/${cuestionarioId}/${tipo}`}
      className="rounded-full border border-flow-300 bg-white px-3 py-1 text-xs font-bold text-flow-800 transition hover:border-flow-500"
    >
      Descargar {texto}
    </a>
  );
}

export function BotonLiberar({ cuestionarioId }: { cuestionarioId: string }) {
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [liberado, setLiberado] = useState(false);

  function onClick() {
    setError(null);
    iniciar(async () => {
      const resultado = await liberarDocumentos(cuestionarioId);
      if (resultado.ok) {
        setLiberado(true);
      } else {
        setError(resultado.error ?? 'No se pudo liberar.');
      }
    });
  }

  if (liberado) {
    return <span className="text-xs font-semibold text-flow-600">¡Liberada!</span>;
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pendiente}
        className="rounded-full bg-flow-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-flow-800 disabled:opacity-60"
      >
        {pendiente ? 'Liberando…' : 'Liberar'}
      </button>
      {error && <span className="text-xs font-semibold text-red-600">{error}</span>}
    </span>
  );
}

/**
 * Para cuando alguien se quedó a mitad de camino (cerró la pestaña, se
 * cortó la conexión) y su documento quedó en "generando" o en "error" para
 * siempre, o ni se llegó a crear -- ver comentario de regenerarDocumentos.
 */
export function BotonReintentar({ usuarioId, texto = 'Reintentar' }: { usuarioId: string; texto?: string }) {
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  function onClick() {
    setError(null);
    iniciar(async () => {
      const resultado = await regenerarDocumentos(usuarioId);
      if (resultado.ok) {
        setListo(true);
      } else {
        setError(resultado.error ?? 'No se pudo reintentar.');
      }
    });
  }

  if (listo) {
    return <span className="text-xs font-semibold text-flow-600">¡Listo!</span>;
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pendiente}
        className="rounded-full border border-flow-300 bg-white px-3 py-1 text-xs font-bold text-flow-800 transition hover:border-flow-500 disabled:opacity-60"
      >
        {pendiente ? 'Reintentando… (puede tardar un par de minutos)' : texto}
      </button>
      {error && <span className="max-w-[220px] text-xs font-semibold text-red-600">{error}</span>}
    </span>
  );
}
