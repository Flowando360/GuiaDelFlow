'use client';

import { Suspense, useActionState, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { registrarse, type EstadoAuth } from '../actions';
import { IMG } from '@/lib/imagenesWeb';
import { CampoContrasena } from '@/components/CampoContrasena';
import { COPY_MODO_ENVIO } from '@/lib/envio/copy';

const estadoInicial: EstadoAuth = {};

function Cargando() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-flow-200 border-t-flow-600" />
    </main>
  );
}

export default function RegistroPage() {
  return (
    <Suspense fallback={<Cargando />}>
      <FormularioRegistro />
    </Suspense>
  );
}

function FormularioRegistro() {
  const [estado, accion, enviando] = useActionState(registrarse, estadoInicial);
  const searchParams = useSearchParams();
  const token = searchParams.get('invitacion');
  // Link de envío configurado (ver src/lib/envio/enlace.ts): no cambia nada
  // visible del formulario, solo viaja como campo oculto hasta la acción.
  const envioToken = searchParams.get('envio');

  // Si viene de un link de invitación (ver Círculo de Crecimiento), se
  // prellenan nombre y correo con los datos reales del colaborador — la
  // persona los puede editar igual, esto es solo comodidad. La conexión
  // real no depende de lo que quede aquí, sino del token en sí (se manda
  // como campo oculto del formulario, ver más abajo).
  const [cargandoInvitacion, setCargandoInvitacion] = useState(Boolean(token));
  const [prellenado, setPrellenado] = useState({ nombre_completo: '', email: '' });

  useEffect(() => {
    if (!token) return;
    fetch(`/api/circulo/invitacion?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data: { nombre: string | null; correo: string | null }) => {
        setPrellenado({ nombre_completo: data.nombre ?? '', email: data.correo ?? '' });
      })
      .finally(() => setCargandoInvitacion(false));
  }, [token]);

  // Link de envío (?envio=) — solo necesitamos saber el modo para mostrar
  // el aviso de consentimiento correcto (ver src/lib/envio/copy.ts). Nunca
  // se pide correo_destino ni etiqueta acá, esos son internos.
  const [modoEnvio, setModoEnvio] = useState<'directo' | 'acompanado' | null>(null);
  useEffect(() => {
    if (!envioToken) return;
    fetch(`/api/envio/modo?id=${encodeURIComponent(envioToken)}`)
      .then((r) => r.json())
      .then((data: { modo: 'directo' | 'acompanado' | null }) => setModoEnvio(data.modo))
      .catch(() => setModoEnvio(null));
  }, [envioToken]);

  if (cargandoInvitacion) {
    return <Cargando />;
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white/70 shadow-sm ring-1 ring-flow-200 backdrop-blur md:grid-cols-2">
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-flow-100 via-flow-50 to-flow-200 p-10 md:flex">
          <Image src={IMG.logo} alt="FlowAndo" width={140} height={40} className="h-9 w-auto" />
          <div className="flex flex-1 items-center justify-center py-8">
            <Image
              src={IMG.eureka}
              alt=""
              width={320}
              height={320}
              className="max-h-72 w-auto rounded-2xl object-contain"
            />
          </div>
          <p className="font-serif text-lg italic text-flow-900">
            Descubre quién eres realmente — El Lab del Talento.
          </p>
        </div>

        <div className="p-8 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-widest text-flow-600">Guía del Flow</p>
          <h1 className="mt-1 font-serif text-2xl font-bold text-flow-900">Crea tu cuenta</h1>
          <p className="mt-1 text-sm text-flow-800">
            {token
              ? 'Te invitaron a hacer tu Guía del Flow. Revisa que estos datos sean los tuyos.'
              : 'Para guardar tu progreso y entregarte tus documentos cuando estén listos.'}
          </p>

          <form action={accion} className="mt-6 space-y-4">
            <input type="hidden" name="invitacion_token" value={token ?? ''} />
            <input type="hidden" name="envio_token" value={envioToken ?? ''} />
            <Campo id="nombre_completo" etiqueta="Nombres y apellidos" tipo="text" autoComplete="name" defaultValue={prellenado.nombre_completo} />
            <Campo id="email" etiqueta="Correo electrónico" tipo="email" autoComplete="email" defaultValue={prellenado.email} />
            <CampoContrasena
              id="password"
              etiqueta="Contraseña (mínimo 8 caracteres)"
              autoComplete="new-password"
              minLength={8}
            />

            <label className="flex items-start gap-2.5 text-xs text-flow-800">
              <input
                type="checkbox"
                name="autorizacion_circulo"
                value="si"
                required
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-flow-300 text-flow-600 focus:ring-flow-400"
              />
              <span>
                {token
                  ? 'Autorizo que un resumen de 18 de mis resultados (talentos, propósito, liderazgo, comunicación, trabajo en equipo y similares — nunca los psicológicos/personales ni mi Guía completa) se comparta con la empresa que me invitó, dentro de Círculo de Crecimiento, para fines de desarrollo profesional. Puedo revocar esta autorización cuando quiera.'
                  : 'Si mi correo coincide con el de una empresa cliente de FlowAndo, autorizo que un resumen de 18 de mis resultados (talentos, propósito, liderazgo, comunicación, trabajo en equipo y similares — nunca los psicológicos/personales ni mi Guía completa) se comparta con esa empresa dentro de Círculo de Crecimiento, para fines de desarrollo profesional. Puedo revocar esta autorización cuando quiera.'}
              </span>
            </label>

            {envioToken && modoEnvio && (
              <label className="flex items-start gap-2.5 text-xs text-flow-800">
                <input
                  type="checkbox"
                  name="autorizacion_envio"
                  value="si"
                  required
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-flow-300 text-flow-600 focus:ring-flow-400"
                />
                <span>
                  <strong>{COPY_MODO_ENVIO[modoEnvio].titulo}.</strong> {COPY_MODO_ENVIO[modoEnvio].texto}
                </span>
              </label>
            )}

            {estado.error && <p className="text-sm font-semibold text-red-600">{estado.error}</p>}

            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-full bg-flow-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-flow-800 disabled:opacity-60"
            >
              {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-flow-800">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="font-semibold text-flow-600 hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

function Campo({
  id,
  etiqueta,
  tipo,
  autoComplete,
  defaultValue,
}: {
  id: string;
  etiqueta: string;
  tipo: string;
  autoComplete: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-flow-900">{etiqueta}</span>
      <input
        id={id}
        name={id}
        type={tipo}
        required
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-flow-200 bg-white px-3 py-2 text-sm text-flow-text outline-none focus:border-flow-600 focus:ring-2 focus:ring-flow-200"
      />
    </label>
  );
}
