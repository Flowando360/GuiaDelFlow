'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Paso {
  endpoint: string;
  textoEspera: string;
  /**
   * URL opcional a la que se dispara un POST en segundo plano, sin esperar
   * su respuesta, si este paso responde ok. Hoy solo el paso de la Guía la
   * usa, para sincronizar con Círculo de Crecimiento (ver
   * /api/circulo/sincronizar) — si falla, no afecta en nada la experiencia
   * de la persona: ni se le muestra error, ni se retrasa su documento.
   */
  dispararTrasExito?: string;
}

export function GeneradorDocumento({
  pasos,
  textoBoton,
  estadoInicial,
}: {
  /**
   * Uno o dos pasos a ejecutar EN ORDEN con un solo clic — hoy: Guía y
   * Carta cuando faltan las dos (arranque desde cero), o solo Carta cuando
   * la Guía ya está lista y falta recuperar la Carta (ver /resultado).
   */
  pasos: Paso[];
  textoBoton: string;
  estadoInicial: 'error' | null;
}) {
  const [cargando, setCargando] = useState(false);
  const [pasoActual, setPasoActual] = useState(0);
  const [error, setError] = useState<string | null>(
    estadoInicial === 'error' ? 'Algo falló generando tu documento. Intenta de nuevo.' : null
  );
  const router = useRouter();

  async function generar() {
    setCargando(true);
    setError(null);
    for (let i = 0; i < pasos.length; i++) {
      setPasoActual(i);
      const paso = pasos[i];
      try {
        const res = await fetch(paso.endpoint, { method: 'POST' });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? 'No se pudo generar el documento.');
        }
        if (paso.dispararTrasExito) {
          fetch(paso.dispararTrasExito, { method: 'POST' }).catch(() => {
            // silencioso a propósito — ver comentario del campo.
          });
        }
      } catch (e) {
        // Si el paso que falló no era el primero (ej. la Guía sí quedó
        // lista y falló la Carta), el refresh trae el estado real desde el
        // servidor y /resultado vuelve a mostrar el paso correcto a solas.
        setError(e instanceof Error ? e.message : 'No se pudo generar el documento.');
        setCargando(false);
        router.refresh();
        return;
      }
    }
    router.refresh();
  }

  if (cargando) {
    return (
      <div className="mt-6 text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-flow-200 border-t-flow-600" />
        <p className="text-sm text-flow-800">{pasos[pasoActual]?.textoEspera}</p>
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
