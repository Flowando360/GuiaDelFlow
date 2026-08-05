'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function GeneradorDocumento({
  endpoint,
  textoBoton,
  textoEspera,
  estadoInicial,
  dispararTrasExito,
}: {
  endpoint: string;
  textoBoton: string;
  textoEspera: string;
  estadoInicial: 'error' | null;
  /**
   * URL opcional a la que se dispara un POST en segundo plano, sin esperar
   * su respuesta, si `endpoint` responde ok. Hoy solo la usa la Guía, para
   * sincronizar con Círculo de Crecimiento (ver /api/circulo/sincronizar) —
   * si falla, no afecta en nada la experiencia de la persona: ni se le
   * muestra error, ni se retrasa su Guía.
   */
  dispararTrasExito?: string;
}) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(
    estadoInicial === 'error' ? 'Algo falló generando tu documento. Intenta de nuevo.' : null
  );
  const router = useRouter();

  async function generar() {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'No se pudo generar el documento.');
      }
      if (dispararTrasExito) {
        fetch(dispararTrasExito, { method: 'POST' }).catch(() => {
          // silencioso a propósito — ver comentario del prop.
        });
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo generar el documento.');
      setCargando(false);
    }
  }

  if (cargando) {
    return (
      <div className="mt-6 text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-flow-200 border-t-flow-600" />
        <p className="text-sm text-flow-800">{textoEspera}</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {error && <p className="mb-3 text-sm font-semibold text-red-600">{error}</p>}
      <button
        type="button"
        onClick={generar}
        className="w-full rounded-full bg-flow-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-flow-800"
      >
        {error ? 'Intentar de nuevo' : textoBoton}
      </button>
    </div>
  );
}
