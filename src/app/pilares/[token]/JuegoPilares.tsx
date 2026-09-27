'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { IMG } from '@/lib/imagenesWeb';
import {
  TARJETAS,
  PREGUNTAS_PILARES,
  PROMPTS_HISTORIA,
  PILARES,
  type Pilar,
  type RespuestasClasificacion,
  type RespuestasReflexiones,
  type RespuestasHistoria,
} from '@/lib/pilares/contenido';
import { crearSesionPilares } from './actions';

type Paso = 'bienvenida' | 'clasificacion' | 'reflexiones' | 'historia' | 'enviando';

const historiaInicial: RespuestasHistoria = { momento_antes: '', momento_despues: '', titulo: '' };
const PILARES_CON_PREGUNTAS = PILARES.filter((p) => p.id !== 'narracion');

export function JuegoPilares({ linkId }: { linkId: string }) {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>('bienvenida');
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');

  const [tarjetaIndex, setTarjetaIndex] = useState(0);
  const [clasificacion, setClasificacion] = useState<RespuestasClasificacion>({});
  const [feedback, setFeedback] = useState<{ texto: string; acerto: boolean } | null>(null);

  const [reflexiones, setReflexiones] = useState<RespuestasReflexiones>({});
  const [historia, setHistoria] = useState<RespuestasHistoria>(historiaInicial);

  const [error, setError] = useState<string | null>(null);
  const [textoEspera, setTextoEspera] = useState('Estamos tejiendo tu historia…');

  const tarjeta = TARJETAS[tarjetaIndex];
  const progresoClasificacion = Math.round((tarjetaIndex / TARJETAS.length) * 100);

  function elegirPilarTarjeta(pilarElegido: Pilar) {
    if (feedback) return; // ya se respondió esta, esperando el "Siguiente"
    setClasificacion((prev) => ({ ...prev, [tarjeta.id]: pilarElegido }));
    setFeedback({ texto: tarjeta.feedback, acerto: pilarElegido === tarjeta.pilar });
  }

  function siguienteTarjeta() {
    setFeedback(null);
    if (tarjetaIndex + 1 < TARJETAS.length) {
      setTarjetaIndex(tarjetaIndex + 1);
    } else {
      setPaso('reflexiones');
    }
  }

  const reflexionesCompletas = PREGUNTAS_PILARES.every((p) => reflexiones[p.id]?.trim());
  const historiaCompleta = Boolean(historia.momento_antes.trim() && historia.momento_despues.trim() && historia.titulo.trim());

  async function enviarJuego() {
    setPaso('enviando');
    setError(null);
    setTextoEspera('Guardando tus respuestas…');

    const creado = await crearSesionPilares({ nombre, correo, linkId, clasificacion, reflexiones, historia });
    if (!creado.ok) {
      setError(creado.error);
      setPaso('historia');
      return;
    }

    setTextoEspera('Flowi está tejiendo tu historia con los 4 pilares… esto puede tardar un minuto, no cierres esta página.');
    try {
      const res = await fetch('/api/pilares/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sesionId: creado.sesionId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'No se pudo generar tu resultado.');
      }
      router.push(`/pilares/resultado/${creado.sesionId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo generar tu resultado.');
      setPaso('historia');
    }
  }

  function renderPaso() {
    if (paso === 'bienvenida') {
      return (
        <>
          <p className="text-xs font-bold uppercase tracking-widest text-flow-600">Los 4 Pilares</p>
          <h1 className="mt-1 font-serif text-2xl font-bold text-flow-900">Redescúbrete en 4 pilares</h1>
          <p className="mt-3 text-sm leading-relaxed text-flow-800">
            Emily Esfahani Smith pasó cinco años estudiando qué hace que una vida se sienta significativa — no
            feliz, <em>significativa</em>. Encontró cuatro respuestas. Este juego te toma unos 8 minutos y termina
            en un PDF solo tuyo, con lo que descubras.
          </p>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setPaso('clasificacion');
            }}
          >
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-flow-900">Tu nombre</span>
              <input
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-lg border border-flow-200 bg-white px-3 py-2 text-sm text-flow-text outline-none focus:border-flow-600 focus:ring-2 focus:ring-flow-200"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-flow-900">Tu correo</span>
              <input
                required
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="w-full rounded-lg border border-flow-200 bg-white px-3 py-2 text-sm text-flow-text outline-none focus:border-flow-600 focus:ring-2 focus:ring-flow-200"
              />
              <span className="mt-1 block text-xs text-flow-500">Ahí te llega tu PDF al terminar.</span>
            </label>
            <button
              type="submit"
              className="w-full rounded-full bg-flow-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-flow-800"
            >
              Empezar
            </button>
          </form>
        </>
      );
    }

    if (paso === 'clasificacion') {
      return (
        <>
          <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-flow-100">
            <div className="h-full rounded-full bg-flow-600 transition-all" style={{ width: `${progresoClasificacion}%` }} />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-flow-600">
            Escena {tarjetaIndex + 1} de {TARJETAS.length}
          </p>
          <p className="mt-3 font-serif text-lg italic leading-relaxed text-flow-900">&ldquo;{tarjeta.texto}&rdquo;</p>

          {!feedback ? (
            <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {PILARES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => elegirPilarTarjeta(p.id)}
                  className="rounded-xl border border-flow-200 bg-white px-4 py-3 text-sm font-semibold text-flow-800 transition hover:border-flow-500 hover:bg-flow-50"
                >
                  {p.nombre}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-6">
              <p className={`text-sm font-bold ${feedback.acerto ? 'text-emerald-600' : 'text-flow-700'}`}>
                {feedback.acerto ? '✦ Así es.' : 'Esta era de otro pilar.'}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-flow-800">{feedback.texto}</p>
              <button
                type="button"
                onClick={siguienteTarjeta}
                className="mt-5 w-full rounded-full bg-flow-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-flow-800"
              >
                {tarjetaIndex + 1 < TARJETAS.length ? 'Siguiente' : 'Continuar'}
              </button>
            </div>
          )}
        </>
      );
    }

    if (paso === 'reflexiones') {
      return (
        <>
          <p className="text-xs font-bold uppercase tracking-widest text-flow-600">Revisa lo que hoy te da significado</p>
          <h2 className="mt-1 font-serif text-xl font-bold text-flow-900">Responde con lo primero que se te ocurra</h2>
          <p className="mt-2 text-sm text-flow-700">No hay respuestas correctas — solo tú, revisando tu propia vida.</p>
          <div className="mt-5 space-y-7">
            {PILARES_CON_PREGUNTAS.map(({ id: pilarId, nombre: nombrePilar }) => (
              <div key={pilarId}>
                <p className="mb-2 text-sm font-bold text-flow-700">{nombrePilar}</p>
                <div className="space-y-4">
                  {PREGUNTAS_PILARES.filter((p) => p.pilar === pilarId).map((p) => (
                    <label key={p.id} className="block">
                      <span className="mb-1.5 block text-sm text-flow-900">{p.texto}</span>
                      <input
                        type="text"
                        value={reflexiones[p.id] ?? ''}
                        onChange={(e) => setReflexiones((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        className="w-full rounded-lg border border-flow-200 bg-white px-3 py-2 text-sm text-flow-text outline-none focus:border-flow-600 focus:ring-2 focus:ring-flow-200"
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={!reflexionesCompletas}
            onClick={() => setPaso('historia')}
            className="mt-6 w-full rounded-full bg-flow-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-flow-800 disabled:opacity-40"
          >
            Continuar
          </button>
        </>
      );
    }

    if (paso === 'historia') {
      return (
        <>
          <p className="text-xs font-bold uppercase tracking-widest text-flow-600">El cuarto pilar: tu historia</p>
          <h2 className="mt-1 font-serif text-xl font-bold text-flow-900">La historia que te cuentas a ti mismo/a</h2>
          <div className="mt-5 space-y-5">
            <Campo
              etiqueta={PROMPTS_HISTORIA.momento_antes}
              valor={historia.momento_antes}
              onChange={(v) => setHistoria((prev) => ({ ...prev, momento_antes: v }))}
            />
            <Campo
              etiqueta={PROMPTS_HISTORIA.momento_despues}
              valor={historia.momento_despues}
              onChange={(v) => setHistoria((prev) => ({ ...prev, momento_despues: v }))}
            />
            <Campo
              etiqueta={PROMPTS_HISTORIA.titulo}
              valor={historia.titulo}
              onChange={(v) => setHistoria((prev) => ({ ...prev, titulo: v }))}
              filas={1}
            />
          </div>
          {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}
          <button
            type="button"
            disabled={!historiaCompleta}
            onClick={enviarJuego}
            className="mt-6 w-full rounded-full bg-flow-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-flow-800 disabled:opacity-40"
          >
            Descubrir mis 4 pilares
          </button>
        </>
      );
    }

    return (
      <div className="py-8 text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-flow-200 border-t-flow-600" />
        <p className="text-sm text-flow-800">{textoEspera}</p>
      </div>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
      <div className="w-full max-w-lg rounded-3xl bg-white/70 p-8 shadow-sm ring-1 ring-flow-200 backdrop-blur">
        {paso === 'bienvenida' && (
          <Image src={IMG.eureka} alt="" width={200} height={200} className="mx-auto mb-4 h-24 w-auto object-contain" />
        )}
        {renderPaso()}
      </div>
    </main>
  );
}

function Campo({
  etiqueta,
  valor,
  onChange,
  filas = 2,
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  filas?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-flow-900">{etiqueta}</span>
      <textarea
        required
        rows={filas}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-flow-200 bg-white px-3 py-2 text-sm text-flow-text outline-none focus:border-flow-600 focus:ring-2 focus:ring-flow-200"
      />
    </label>
  );
}
