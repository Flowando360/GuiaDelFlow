'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function GeneradorPilares({ sesionId }: { sesionId: string }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function reintentar() {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch('/api/pilares/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sesionId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'No se pudo generar tu resultado.');
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo generar tu resultado.');
      setCargando(false);
    }
  }

  if (cargando) {
    return (
      <div className="mt-6 text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-flow-200 border-t-flow-600" />
        <p className="text-sm text-flow-800">Flowi está tejiendo tu historia de nuevo…</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {error && <p className="mb-3 text-sm font-semibold text-red-600">{error}</p>}
      <button
        type="button"
        onClick={reintentar}
        className="w-full rounded-full bg-flow-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-flow-800"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
