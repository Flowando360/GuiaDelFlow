'use client';

import { useState, useTransition } from 'react';
import { liberarDocumentos } from './actions';

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
