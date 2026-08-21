'use client';

import { useActionState, useState, useTransition } from 'react';
import { crearLinksEnvio, eliminarLinkEnvio, type EstadoCrearLinks } from '../actions';
import { COPY_MODO_ENVIO } from '@/lib/envio/copy';

const estadoInicial: EstadoCrearLinks = {};

export function FormularioLinks() {
  const [estado, accion, enviando] = useActionState(crearLinksEnvio, estadoInicial);
  const [copiado, setCopiado] = useState(false);
  const [modo, setModo] = useState<'directo' | 'acompanado'>('directo');

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
          <span className="mb-1 block text-sm font-semibold text-flow-900">Nombre del paciente</span>
          <input
            name="etiqueta"
            type="text"
            required
            placeholder="Juan Pérez"
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
            Correo del paciente (opcional — solo si ya lo tienes, es únicamente para tu propia referencia)
          </span>
          <input
            name="correo_destino"
            type="email"
            placeholder="tucorreo@ejemplo.com"
            className="w-full rounded-lg border border-flow-200 bg-white px-3 py-2 text-sm text-flow-text outline-none focus:border-flow-600 focus:ring-2 focus:ring-flow-200"
          />
        </label>

        <fieldset className="sm:col-span-3">
          <legend className="mb-2 block text-sm font-semibold text-flow-900">¿Cómo llegan los resultados?</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <OpcionModo
              valor="directo"
              seleccionado={modo === 'directo'}
              onSelect={() => setModo('directo')}
              titulo="Directo a la persona"
              descripcion="La Guía y la Carta le llegan por correo a la persona apenas termina. Tú también puedes verla y descargarla desde el panel cuando quieras."
            />
            <OpcionModo
              valor="acompanado"
              seleccionado={modo === 'acompanado'}
              onSelect={() => setModo('acompanado')}
              titulo="Acompañado (yo la reviso primero)"
              descripcion="No se manda nada automático. Tú la revisas desde el panel y decides cuándo liberarla — ahí le llega a la persona y queda descargable para ella."
            />
          </div>
          <p className="mt-3 rounded-lg bg-flow-50 px-3 py-2 text-xs italic text-flow-700">
            {COPY_MODO_ENVIO[modo].texto}
          </p>
        </fieldset>
      </form>

      {estado.error && <p className="mt-4 text-sm font-semibold text-red-600">{estado.error}</p>}

      {estado.correoEnviado && (
        <p className="mt-4 text-sm font-semibold text-flow-700">
          💜 Le mandamos la invitación por correo a {estado.correoEnviado}.
        </p>
      )}
      {estado.correoError && (
        <p className="mt-4 text-sm font-semibold text-red-600">
          El link se creó bien, pero no se pudo mandar el correo de invitación ({estado.correoError}). Puedes
          copiar el link de abajo y mandárselo tú.
        </p>
      )}

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

export function BotonEliminarLink({ linkId }: { linkId: string }) {
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  function onClick() {
    if (!confirmando) {
      setConfirmando(true);
      return;
    }
    setError(null);
    iniciar(async () => {
      const resultado = await eliminarLinkEnvio(linkId);
      if (!resultado.ok) {
        setError(resultado.error ?? 'No se pudo eliminar.');
        setConfirmando(false);
      }
      // si sale bien, revalidatePath ya quita la fila de la tabla — no hay
      // más que hacer acá.
    });
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        onBlur={() => setConfirmando(false)}
        disabled={pendiente}
        className={`rounded-full px-3 py-1 text-xs font-bold transition disabled:opacity-60 ${
          confirmando
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'border border-flow-300 bg-white text-flow-700 hover:border-red-400 hover:text-red-600'
        }`}
      >
        {pendiente ? 'Eliminando…' : confirmando ? '¿Seguro? Confirmar' : 'Eliminar'}
      </button>
      {error && <span className="text-xs font-semibold text-red-600">{error}</span>}
    </span>
  );
}

function OpcionModo({
  valor,
  seleccionado,
  onSelect,
  titulo,
  descripcion,
}: {
  valor: string;
  seleccionado: boolean;
  onSelect: () => void;
  titulo: string;
  descripcion: string;
}) {
  return (
    <label
      className={`block cursor-pointer rounded-xl border p-3 text-sm transition ${
        seleccionado ? 'border-flow-500 bg-flow-50' : 'border-flow-200 bg-white hover:border-flow-300'
      }`}
    >
      <input type="radio" name="modo" value={valor} checked={seleccionado} onChange={onSelect} className="sr-only" />
      <span className="block font-semibold text-flow-900">{titulo}</span>
      <span className="mt-1 block text-xs text-flow-700">{descripcion}</span>
    </label>
  );
}
