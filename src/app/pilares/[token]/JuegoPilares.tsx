'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { IMG } from '@/lib/imagenesWeb';
import {
  PILARES,
  PREGUNTAS_PILARES,
  PROMPTS_HISTORIA,
  OPCIONES_MICRORRECONOCIMIENTO,
  barajarTarjetas,
  type Pilar,
  type Tarjeta,
  type RespuestasClasificacion,
  type RespuestasReflexiones,
  type RespuestasHistoria,
} from '@/lib/pilares/contenido';
import { crearSesionPilares, guardarClasificacion, guardarReflexiones } from './actions';

type Paso =
  | 'bienvenida'
  | 'intro_pilares'
  | 'clasificacion'
  | 'micro_reconocimiento'
  | 'transicion1'
  | 'reflexion'
  | 'pilar_descubierto'
  | 'transicion2'
  | 'historia'
  | 'integrando'
  | 'revelacion'
  | 'correo'
  | 'generando';

const historiaInicial: RespuestasHistoria = { momento_antes: '', momento_despues: '', titulo: '' };
const PILARES_CON_PREGUNTAS = PILARES.filter((p) => p.id !== 'narracion');

const PREFIJOS_ACIERTO = ['Sí. Aquí aparece con claridad:'];
const PREFIJOS_OTRA_MIRADA = ['Hay otra manera de mirarlo:', 'Vale la pena distinguir esto de lo que elegiste:'];

function AristaPilares({ descubiertos }: { descubiertos: Set<Pilar> }) {
  return (
    <div className="mb-5 flex justify-center gap-3">
      {PILARES.map((p) => (
        <div
          key={p.id}
          className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl transition ${
            descubiertos.has(p.id) ? 'bg-flow-600 shadow-sm' : 'bg-flow-100 opacity-50'
          }`}
          title={p.nombre}
        >
          {p.icono}
        </div>
      ))}
    </div>
  );
}

export function JuegoPilares({ linkId }: { linkId: string }) {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>('bienvenida');
  const [nombre, setNombre] = useState('');
  const [sesionId, setSesionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Ronda 1 — clasificación
  const [tarjetas] = useState<Tarjeta[]>(() => barajarTarjetas());
  const [tarjetaIndex, setTarjetaIndex] = useState(0);
  const [clasificacion, setClasificacion] = useState<RespuestasClasificacion>({});
  const [feedback, setFeedback] = useState<{ prefijo: string; texto: string } | null>(null);

  // Ronda 2 — autoindagación por pilar
  const [pilarIndex, setPilarIndex] = useState(0);
  const [reflexiones, setReflexiones] = useState<RespuestasReflexiones>({});

  // Progreso visual de la "arquitectura"
  const [pilaresDescubiertos, setPilaresDescubiertos] = useState<Set<Pilar>>(new Set());

  // Ronda 3 — narración
  const [historia, setHistoria] = useState<RespuestasHistoria>(historiaInicial);

  // Revelación + correo
  const [revelacion, setRevelacion] = useState<{ pilar_mas_vivo: string; explicacion_pilar_mas_visible: string } | null>(null);
  const [correo, setCorreo] = useState('');
  const [textoEspera, setTextoEspera] = useState('Flowi está tejiendo tu historia…');

  const tarjeta = tarjetas[tarjetaIndex];

  async function empezar() {
    setError(null);
    const creado = await crearSesionPilares({ nombre, linkId });
    if (!creado.ok) {
      setError(creado.error);
      return;
    }
    setSesionId(creado.sesionId);
    setPaso('intro_pilares');
  }

  function elegirPilarTarjeta(pilarElegido: Pilar) {
    if (feedback) return;
    setClasificacion((prev) => ({ ...prev, [tarjeta.id]: pilarElegido }));
    const acerto = pilarElegido === tarjeta.pilar;
    const prefijo = acerto
      ? PREFIJOS_ACIERTO[0]
      : PREFIJOS_OTRA_MIRADA[tarjetaIndex % PREFIJOS_OTRA_MIRADA.length];
    setFeedback({ prefijo, texto: tarjeta.feedback });
  }

  async function siguienteTarjeta() {
    setFeedback(null);
    const esMultiploDeTres = (tarjetaIndex + 1) % 3 === 0;
    const esUltima = tarjetaIndex + 1 >= tarjetas.length;

    if (esMultiploDeTres) {
      setPaso('micro_reconocimiento');
      return;
    }
    if (esUltima) {
      await terminarClasificacion();
      return;
    }
    setTarjetaIndex(tarjetaIndex + 1);
  }

  async function terminarClasificacion() {
    if (sesionId) await guardarClasificacion(sesionId, clasificacion);
    setPaso('transicion1');
  }

  async function continuarTrasMicro() {
    const esUltima = tarjetaIndex + 1 >= tarjetas.length;
    if (esUltima) {
      await terminarClasificacion();
      return;
    }
    setTarjetaIndex(tarjetaIndex + 1);
    setPaso('clasificacion');
  }

  const pilarActual = PILARES_CON_PREGUNTAS[pilarIndex];
  const preguntasPilarActual = pilarActual ? PREGUNTAS_PILARES.filter((p) => p.pilar === pilarActual.id) : [];
  const pilarActualCompleto = preguntasPilarActual.every((p) => reflexiones[p.id]?.trim());

  async function completarPilarReflexion() {
    if (!pilarActual) return;
    setPilaresDescubiertos((prev) => new Set(prev).add(pilarActual.id));
    setPaso('pilar_descubierto');
  }

  async function continuarTrasPilarDescubierto() {
    const siguienteIndex = pilarIndex + 1;
    if (siguienteIndex < PILARES_CON_PREGUNTAS.length) {
      setPilarIndex(siguienteIndex);
      setPaso('reflexion');
      return;
    }
    if (sesionId) await guardarReflexiones(sesionId, reflexiones);
    setPaso('transicion2');
  }

  const historiaCompleta = Boolean(historia.momento_antes.trim() && historia.momento_despues.trim() && historia.titulo.trim());

  async function analizarHistoria() {
    if (!sesionId) return;
    setPaso('integrando');
    setError(null);
    try {
      const res = await fetch('/api/pilares/analizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sesionId, historia }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'No se pudo preparar tu resultado.');
      setPilaresDescubiertos((prev) => new Set(prev).add('narracion'));
      setRevelacion({ pilar_mas_vivo: data.pilar_mas_vivo, explicacion_pilar_mas_visible: data.explicacion_pilar_mas_visible });
      setPaso('revelacion');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo preparar tu resultado.');
      setPaso('historia');
    }
  }

  async function enviarCorreoYGenerar() {
    if (!sesionId) return;
    if (!correo.includes('@')) {
      setError('Ese correo no parece válido.');
      return;
    }
    setEnviando(true);
    setError(null);
    setPaso('generando');
    setTextoEspera('Flowi está tejiendo tu historia…');
    const mensajes = [
      'Flowi está tejiendo tu historia…',
      'Los cuatro pilares no compiten: se sostienen.',
      'Flowi está encontrando las palabras que mejor reflejan lo que escribiste.',
      'Ya casi. Tu resultado está tomando forma.',
    ];
    let i = 0;
    const intervalo = setInterval(() => {
      i = (i + 1) % mensajes.length;
      setTextoEspera(mensajes[i]);
    }, 4500);

    try {
      const res = await fetch('/api/pilares/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sesionId, correo }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'No se pudo generar tu resultado.');
      }
      router.push(`/pilares/resultado/${sesionId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo generar tu resultado.');
      setPaso('correo');
      setEnviando(false);
    } finally {
      clearInterval(intervalo);
    }
  }

  function renderPaso() {
    if (paso === 'bienvenida') {
      return (
        <>
          <p className="text-xs font-bold uppercase tracking-widest text-flow-600">Los 4 Pilares</p>
          <h1 className="mt-1 font-serif text-2xl font-bold text-flow-900">¿Qué hace que una vida tenga significado?</h1>
          <p className="mt-3 text-sm leading-relaxed text-flow-800">
            En unos 10-12 minutos vas a explorar cuatro formas de encontrar y construir significado en tu vida. Al
            final recibirás una lectura personal de lo que descubriste.
          </p>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              empezar();
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
            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-full bg-flow-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-flow-800"
            >
              Empezar mi viaje
            </button>
          </form>
        </>
      );
    }

    if (paso === 'intro_pilares') {
      return (
        <>
          <p className="text-xs font-bold uppercase tracking-widest text-flow-600">Los cuatro pilares</p>
          <h1 className="mt-1 font-serif text-xl font-bold text-flow-900">
            Una vida con significado se sostiene sobre más de una cosa.
          </h1>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {PILARES.map((p) => (
              <div key={p.id} className="rounded-xl border border-flow-200 bg-white p-4 text-center">
                <div className="text-2xl">{p.icono}</div>
                <div className="mt-1 text-sm font-bold text-flow-900">{p.nombre}</div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm leading-relaxed text-flow-800">
            No tienes que tenerlos todos resueltos. Vamos a descubrir qué aparece hoy en tu vida.
          </p>
          <button
            type="button"
            onClick={() => setPaso('clasificacion')}
            className="mt-6 w-full rounded-full bg-flow-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-flow-800"
          >
            Empezar
          </button>
        </>
      );
    }

    if (paso === 'clasificacion') {
      const progreso = Math.round((tarjetaIndex / tarjetas.length) * 100);
      return (
        <>
          <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-flow-100">
            <div className="h-full rounded-full bg-flow-600 transition-all" style={{ width: `${progreso}%` }} />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-flow-600">
            {tarjetaIndex + 1} de {tarjetas.length}
          </p>
          <h2 className="mt-1 font-serif text-lg font-bold text-flow-900">¿Dónde pondrías esto?</h2>
          <p className="mt-1 text-xs text-flow-600">Lee la situación y colócala donde creas que tiene más que ver.</p>
          <p className="mt-3 font-serif text-lg italic leading-relaxed text-flow-900">&ldquo;{tarjeta.texto}&rdquo;</p>

          {!feedback ? (
            <div className="mt-6 grid grid-cols-2 gap-2.5">
              {PILARES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => elegirPilarTarjeta(p.id)}
                  className="rounded-xl border border-flow-200 bg-white px-3 py-3 text-sm font-semibold text-flow-800 transition hover:border-flow-500 hover:bg-flow-50"
                >
                  <span className="mr-1.5">{p.icono}</span>
                  {p.nombre}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-6">
              <p className="text-sm font-bold text-flow-700">{feedback.prefijo}</p>
              <p className="mt-2 text-sm leading-relaxed text-flow-800">{feedback.texto}</p>
              <button
                type="button"
                onClick={siguienteTarjeta}
                className="mt-5 w-full rounded-full bg-flow-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-flow-800"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      );
    }

    if (paso === 'micro_reconocimiento') {
      return (
        <>
          <h2 className="font-serif text-xl font-bold text-flow-900">¿Y esto te pasa a ti?</h2>
          <p className="mt-2 text-sm text-flow-700">Solo para pensarlo un momento — no construye ningún puntaje.</p>
          <div className="mt-6 flex flex-col gap-2.5">
            {OPCIONES_MICRORRECONOCIMIENTO.map((op) => (
              <button
                key={op}
                type="button"
                onClick={continuarTrasMicro}
                className="rounded-xl border border-flow-200 bg-white px-4 py-3 text-sm font-semibold text-flow-800 transition hover:border-flow-500 hover:bg-flow-50"
              >
                {op}
              </button>
            ))}
          </div>
        </>
      );
    }

    if (paso === 'transicion1') {
      return (
        <>
          <Image src={IMG.ilumina} alt="" width={160} height={160} className="mx-auto mb-4 h-28 w-auto object-contain" />
          <p className="text-center font-serif text-lg italic leading-relaxed text-flow-900">
            &ldquo;Ya viste cómo aparece el significado en situaciones cotidianas. Ahora vamos a mirar esos mismos
            pilares en tu propia vida.&rdquo;
          </p>
          <p className="mt-2 text-center text-xs font-bold uppercase tracking-widest text-flow-500">— Flowi</p>
          <button
            type="button"
            onClick={() => setPaso('reflexion')}
            className="mt-6 w-full rounded-full bg-flow-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-flow-800"
          >
            Mirarme a mí
          </button>
        </>
      );
    }

    if (paso === 'reflexion' && pilarActual) {
      return (
        <>
          <AristaPilares descubiertos={pilaresDescubiertos} />
          <p className="text-xs font-bold uppercase tracking-widest text-flow-600">
            {pilarIndex + 1} de {PILARES_CON_PREGUNTAS.length}
          </p>
          <h2 className="mt-1 font-serif text-xl font-bold text-flow-900">
            <span className="mr-1.5">{pilarActual.icono}</span>
            Descubre tu {pilarActual.nombre.toLowerCase()}
          </h2>
          <p className="mt-2 text-sm text-flow-700">No tienes que pensar demasiado. Escribe lo primero que te venga.</p>
          <div className="mt-5 space-y-4">
            {preguntasPilarActual.map((p) => (
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
          <button
            type="button"
            disabled={!pilarActualCompleto}
            onClick={completarPilarReflexion}
            className="mt-6 w-full rounded-full bg-flow-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-flow-800 disabled:opacity-40"
          >
            Continuar
          </button>
        </>
      );
    }

    if (paso === 'pilar_descubierto') {
      const anterior = PILARES_CON_PREGUNTAS[pilarIndex];
      return (
        <div className="py-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-flow-600 text-3xl shadow-sm">
            {anterior?.icono}
          </div>
          <p className="font-serif text-xl font-bold text-flow-900">Pilar descubierto</p>
          <p className="mt-2 text-sm text-flow-700">{anterior?.nombre}</p>
          <button
            type="button"
            onClick={continuarTrasPilarDescubierto}
            className="mt-6 w-full rounded-full bg-flow-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-flow-800"
          >
            Continuar
          </button>
        </div>
      );
    }

    if (paso === 'transicion2') {
      return (
        <>
          <Image src={IMG.medita} alt="" width={160} height={160} className="mx-auto mb-4 h-28 w-auto object-contain" />
          <p className="text-center font-serif text-lg italic leading-relaxed text-flow-900">
            &ldquo;Ya miraste tus vínculos, aquello que te mueve y esos momentos en que sales de la rutina. Queda una
            última parte: tu propia historia.&rdquo;
          </p>
          <p className="mt-2 text-center text-xs font-bold uppercase tracking-widest text-flow-500">— Flowi</p>
          <button
            type="button"
            onClick={() => setPaso('historia')}
            className="mt-6 w-full rounded-full bg-flow-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-flow-800"
          >
            Mirar mi historia
          </button>
        </>
      );
    }

    if (paso === 'historia') {
      return (
        <>
          <AristaPilares descubiertos={pilaresDescubiertos} />
          <p className="text-xs font-bold uppercase tracking-widest text-flow-600">📖 La historia que te cuentas</p>
          <p className="mt-2 text-sm text-flow-700">
            Hay hechos que no podemos cambiar. Pero podemos descubrir qué historia estamos construyendo con ellos.
          </p>
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
            onClick={analizarHistoria}
            className="mt-6 w-full rounded-full bg-flow-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-flow-800 disabled:opacity-40"
          >
            Continuar
          </button>
        </>
      );
    }

    if (paso === 'integrando') {
      return (
        <div className="py-8 text-center">
          <AristaPilares descubiertos={pilaresDescubiertos} />
          <p className="font-serif text-lg font-bold text-flow-900">Tu arquitectura del significado</p>
          <p className="mt-3 text-sm leading-relaxed text-flow-800">
            Acabas de mirar cuatro dimensiones diferentes de tu vida. Ahora Flowi va a juntar lo que apareció en tus
            respuestas.
          </p>
          <div className="mx-auto mt-6 h-8 w-8 animate-spin rounded-full border-4 border-flow-200 border-t-flow-600" />
        </div>
      );
    }

    if (paso === 'revelacion' && revelacion) {
      const pilarInfo = PILARES.find((p) => p.nombre === revelacion.pilar_mas_vivo);
      return (
        <div className="py-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-flow-600">
            Lo que más se hizo visible en tus respuestas…
          </p>
          <div className="mx-auto my-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-flow-600 text-3xl shadow-sm">
            {pilarInfo?.icono ?? '✦'}
          </div>
          <p className="font-serif text-2xl font-bold text-flow-900">{revelacion.pilar_mas_vivo}</p>
          <p className="mt-3 text-left text-sm leading-relaxed text-flow-800">{revelacion.explicacion_pilar_mas_visible}</p>
          <button
            type="button"
            onClick={() => setPaso('correo')}
            className="mt-6 w-full rounded-full bg-flow-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-flow-800"
          >
            Ver mi resultado completo
          </button>
        </div>
      );
    }

    if (paso === 'correo') {
      return (
        <>
          <p className="text-xs font-bold uppercase tracking-widest text-flow-600">Tu resultado está listo</p>
          <h2 className="mt-1 font-serif text-xl font-bold text-flow-900">
            Flowi ya tiene con qué escribir algo que de verdad sea tuyo. ¿A dónde te lo enviamos?
          </h2>
          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              enviarCorreoYGenerar();
            }}
          >
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-flow-900">Tu correo</span>
              <input
                required
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="w-full rounded-lg border border-flow-200 bg-white px-3 py-2 text-sm text-flow-text outline-none focus:border-flow-600 focus:ring-2 focus:ring-flow-200"
              />
            </label>
            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-full bg-flow-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-flow-800 disabled:opacity-60"
            >
              Ver mi resultado
            </button>
          </form>
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
