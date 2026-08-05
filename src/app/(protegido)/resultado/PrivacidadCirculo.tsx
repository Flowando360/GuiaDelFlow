'use client';

import { useState, useTransition } from 'react';
import { actualizarAutorizacionCirculo } from './actions';

/**
 * Le permite a la persona revocar (o volver a dar) la autorización de
 * compartir un resumen de sus 18 aspectos seguros con su empresa en
 * Círculo de Crecimiento — la marcó (o no) al registrarse, pero la ley
 * exige que también la pueda retirar cuando quiera, no solo darla una vez.
 */
export function PrivacidadCirculo({ autorizadoInicial }: { autorizadoInicial: boolean }) {
  const [autorizado, setAutorizado] = useState(autorizadoInicial);
  const [pending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);

  function cambiar(nuevoValor: boolean) {
    setMensaje(null);
    startTransition(async () => {
      const res = await actualizarAutorizacionCirculo(nuevoValor);
      if (res.ok) {
        setAutorizado(nuevoValor);
        setMensaje(nuevoValor ? 'Autorización activa.' : 'Autorización retirada.');
      } else {
        setMensaje(res.error);
      }
    });
  }

  return (
    <div className="mt-8 border-t border-flow-100 pt-6 text-left">
      <h3 className="font-serif text-sm font-bold text-flow-900">Privacidad con tu empresa</h3>
      <p className="mt-1 text-xs leading-relaxed text-flow-800">
        {autorizado
          ? 'Autorizaste compartir un resumen de 18 de tus resultados (nunca los psicológicos/personales ni tu Guía completa) con tu empresa, dentro de Círculo de Crecimiento.'
          : 'No estás compartiendo nada de tus resultados con tu empresa en este momento.'}
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() => cambiar(!autorizado)}
        className="mt-3 rounded-full border border-flow-300 bg-white px-4 py-1.5 text-xs font-bold text-flow-800 transition hover:border-flow-500 disabled:opacity-60"
      >
        {pending ? 'Actualizando…' : autorizado ? 'Retirar autorización' : 'Autorizar de nuevo'}
      </button>
      {mensaje && <p className="mt-2 text-xs text-flow-600">{mensaje}</p>}
    </div>
  );
}
