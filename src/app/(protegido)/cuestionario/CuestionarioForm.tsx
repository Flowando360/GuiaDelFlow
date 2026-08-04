'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { PASOS, TOTAL_PASOS, IMAGEN_POR_PASO, textoPregunta, opcionesPregunta } from '@/lib/cuestionario/estructura';
import { IMG } from '@/lib/imagenesWeb';
import { guardarPaso, finalizarCuestionario } from './actions';

type RespuestasJson = Record<string, unknown>;

const ESCALA_LIKERT = [
  { valor: 1, etiqueta: 'Nada de acuerdo' },
  { valor: 2, etiqueta: 'Poco de acuerdo' },
  { valor: 3, etiqueta: 'Neutral' },
  { valor: 4, etiqueta: 'De acuerdo' },
  { valor: 5, etiqueta: 'Totalmente de acuerdo' },
];

export function CuestionarioForm({
  cuestionarioId,
  respuestasIniciales,
  pasoInicial,
}: {
  cuestionarioId: string;
  respuestasIniciales: RespuestasJson;
  pasoInicial: number;
}) {
  const [pasoIndex, setPasoIndex] = useState(pasoInicial);
  const [demograficos, setDemograficos] = useState<RespuestasJson>(
    (respuestasIniciales.demograficos as RespuestasJson) ?? {}
  );
  const [cuestionamientos, setCuestionamientos] = useState<RespuestasJson>(
    (respuestasIniciales.cuestionamientos as RespuestasJson) ?? {}
  );
  const [likert, setLikert] = useState<RespuestasJson>((respuestasIniciales.likert as RespuestasJson) ?? {});
  const [error, setError] = useState<string | null>(null);
  const [enviando, iniciarTransicion] = useTransition();

  const paso = PASOS[pasoIndex];
  const esUltimoPaso = pasoIndex === TOTAL_PASOS - 1;
  const progreso = Math.round(((pasoIndex + 1) / TOTAL_PASOS) * 100);

  function validar(): string | null {
    if (paso.tipo === 'demografico') {
      for (const campo of paso.campos) {
        if (campo.requerido && !demograficos[campo.id]) return `Falta completar: ${campo.etiqueta}`;
      }
    } else if (paso.tipo === 'cuestionamientos') {
      const requeridos = ['razon', 'cuestionamiento_1', 'cuestionamiento_2', 'cuestionamiento_3'];
      for (const c of requeridos) {
        if (!cuestionamientos[c]) return 'Completá los 4 campos antes de seguir.';
      }
    } else if (paso.tipo === 'likert' || paso.tipo === 'ninez') {
      for (const codigo of paso.codigos) {
        if (likert[codigo] === undefined) return 'Respondé todas las preguntas de esta pantalla antes de seguir.';
      }
    }
    return null;
  }

  function datosDelPaso(): RespuestasJson {
    if (paso.tipo === 'demografico') return { demograficos };
    if (paso.tipo === 'cuestionamientos') return { cuestionamientos };
    // likert / ninez: solo mandamos los códigos de ESTE paso, el server
    // hace merge con lo que ya había en otros pasos.
    const parcial: RespuestasJson = {};
    for (const codigo of paso.codigos) parcial[codigo] = likert[codigo];
    return { likert: parcial };
  }

  function avanzar() {
    const mensaje = validar();
    if (mensaje) {
      setError(mensaje);
      return;
    }
    setError(null);

    iniciarTransicion(async () => {
      if (esUltimoPaso) {
        await finalizarCuestionario(cuestionarioId, datosDelPaso());
      } else {
        await guardarPaso(cuestionarioId, datosDelPaso());
        setPasoIndex((i) => i + 1);
      }
    });
  }

  function retroceder() {
    setError(null);
    setPasoIndex((i) => Math.max(0, i - 1));
  }

  const imagenPaso = IMG[IMAGEN_POR_PASO[paso.id] ?? 'eureka'];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-16 sm:px-8">
      <div className="mb-6">
        <div className="mb-1.5 flex justify-between text-xs font-semibold text-flow-800">
          <span>
            Paso {pasoIndex + 1} de {TOTAL_PASOS}
          </span>
          <span>{progreso}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-flow-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-flow-600 to-flow-400 transition-all"
            style={{ width: `${progreso}%` }}
          />
        </div>
      </div>

      <div className="grid flex-1 gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
        <div className="relative hidden flex-col items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-flow-100 via-flow-50 to-flow-200 p-8 md:flex">
          <Image
            key={imagenPaso}
            src={imagenPaso}
            alt=""
            width={280}
            height={280}
            className="max-h-64 w-auto object-contain"
          />
        </div>

        <div className="rounded-2xl bg-white/70 p-6 shadow-sm ring-1 ring-flow-200 backdrop-blur sm:p-8">
          <h1 className="font-serif text-2xl font-bold text-flow-900">{paso.titulo}</h1>
          <p className="mt-1 text-sm text-flow-800">{paso.subtitulo}</p>

          <div className="mt-6 space-y-6">
            {paso.tipo === 'demografico' && (
              <PasoDemografico campos={paso.campos} valores={demograficos} onCambiar={setDemograficos} />
            )}
            {paso.tipo === 'cuestionamientos' && (
              <PasoCuestionamientos valores={cuestionamientos} onCambiar={setCuestionamientos} />
            )}
            {(paso.tipo === 'likert' || paso.tipo === 'ninez') && (
              <PasoPreguntas
                key={paso.id}
                codigos={paso.codigos}
                tipo={paso.tipo}
                valores={likert}
                onCambiar={(codigo, valor) => setLikert((prev) => ({ ...prev, [codigo]: valor }))}
              />
            )}
          </div>

          {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}

          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={retroceder}
              disabled={pasoIndex === 0 || enviando}
              className="text-sm font-semibold text-flow-800 hover:underline disabled:opacity-0"
            >
              ← Anterior
            </button>
            <button
              type="button"
              onClick={avanzar}
              disabled={enviando}
              className="rounded-full bg-flow-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-flow-800 disabled:opacity-60"
            >
              {enviando ? 'Guardando…' : esUltimoPaso ? 'Terminar' : 'Siguiente →'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

// ── Sub-componentes por tipo de paso ────────────────────────────────────

function PasoDemografico({
  campos,
  valores,
  onCambiar,
}: {
  campos: { id: string; etiqueta: string; tipo: string; opciones?: string[]; requerido?: boolean }[];
  valores: RespuestasJson;
  onCambiar: (v: RespuestasJson) => void;
}) {
  const clasesCampo =
    'w-full rounded-lg border border-flow-200 bg-white px-3 py-2 text-sm text-flow-text outline-none focus:border-flow-600 focus:ring-2 focus:ring-flow-200';

  return (
    <>
      {campos.map((campo) => (
        <label key={campo.id} className="block">
          <span className="mb-1 block text-sm font-semibold text-flow-900">
            {campo.etiqueta}
            {!campo.requerido && <span className="ml-1 font-normal text-flow-800">(opcional)</span>}
          </span>
          {campo.tipo === 'seleccion' ? (
            <select
              value={(valores[campo.id] as string) ?? ''}
              onChange={(e) => onCambiar({ ...valores, [campo.id]: e.target.value })}
              className={clasesCampo}
            >
              <option value="" disabled>
                Selecciona una opción
              </option>
              {campo.opciones?.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {opcion}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={campo.tipo === 'fecha' ? 'date' : 'text'}
              value={(valores[campo.id] as string) ?? ''}
              onChange={(e) => onCambiar({ ...valores, [campo.id]: e.target.value })}
              className={clasesCampo}
            />
          )}
        </label>
      ))}
    </>
  );
}

function PasoCuestionamientos({
  valores,
  onCambiar,
}: {
  valores: RespuestasJson;
  onCambiar: (v: RespuestasJson) => void;
}) {
  const campos = [
    {
      id: 'razon',
      etiqueta:
        'Sabiendo que la Guía del Flow es un espejo de quién eres y un mapa que revela tus talentos, tu propósito y tus posibilidades de evolución, ¿qué te está impulsando hoy a descubrirla y a llevar tu potencial a un nuevo nivel?',
    },
    { id: 'cuestionamiento_1', etiqueta: '¿Qué hoy te duele, te inquieta o te tiene buscando respuestas?' },
    { id: 'cuestionamiento_2', etiqueta: '¿Qué sientes que no está fluyendo como sabes que podría?' },
    { id: 'cuestionamiento_3', etiqueta: '¿Qué anhelas transformar de ti o de tu vida en este momento?' },
  ];
  return (
    <>
      {campos.map((campo) => (
        <label key={campo.id} className="block">
          <span className="mb-1 block text-sm font-semibold text-flow-900">{campo.etiqueta}</span>
          <textarea
            rows={3}
            value={(valores[campo.id] as string) ?? ''}
            onChange={(e) => onCambiar({ ...valores, [campo.id]: e.target.value })}
            className="w-full resize-none rounded-lg border border-flow-200 bg-white px-3 py-2 text-sm text-flow-text outline-none focus:border-flow-600 focus:ring-2 focus:ring-flow-200"
          />
        </label>
      ))}
    </>
  );
}

function PasoPreguntas({
  codigos,
  tipo,
  valores,
  onCambiar,
}: {
  codigos: readonly string[];
  tipo: 'likert' | 'ninez';
  valores: RespuestasJson;
  onCambiar: (codigo: string, valor: string | number) => void;
}) {
  return (
    <>
      {codigos.map((codigo) => (
        <fieldset key={codigo} className="border-t border-flow-100 pt-4 first:border-0 first:pt-0">
          <legend className="mb-3 text-sm font-semibold text-flow-900">{textoPregunta(codigo)}</legend>
          {tipo === 'likert' ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-flow-800">Totalmente en desacuerdo</span>
              <div className="flex gap-2">
                {ESCALA_LIKERT.map((op) => (
                  <button
                    key={op.valor}
                    type="button"
                    title={op.etiqueta}
                    onClick={() => onCambiar(codigo, op.valor)}
                    className={`h-10 w-10 rounded-full text-sm font-bold transition ${
                      valores[codigo] === op.valor
                        ? 'bg-flow-600 text-white'
                        : 'bg-flow-100 text-flow-800 hover:bg-flow-200'
                    }`}
                  >
                    {op.valor}
                  </button>
                ))}
              </div>
              <span className="text-xs text-flow-800">Totalmente de acuerdo</span>
            </div>
          ) : (
            <div className="space-y-2">
              {opcionesPregunta(codigo).map((op) => (
                <label
                  key={op.letra}
                  className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                    valores[codigo] === op.letra
                      ? 'border-flow-600 bg-flow-50'
                      : 'border-flow-200 bg-white hover:border-flow-400'
                  }`}
                >
                  <input
                    type="radio"
                    name={codigo}
                    value={op.letra}
                    checked={valores[codigo] === op.letra}
                    onChange={() => onCambiar(codigo, op.letra)}
                    className="mt-0.5"
                  />
                  <span>{op.texto}</span>
                </label>
              ))}
            </div>
          )}
        </fieldset>
      ))}
    </>
  );
}
