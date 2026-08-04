import { questionnaire } from '../kb/questionnaire';
import { CODIGOS_SUMA_LIKERT, CODIGOS_INTELIGENCIAS } from '../calculo/codigos';
import type { ClaveImagenWeb } from '../imagenesWeb';

type PreguntaLikertRaw = (typeof questionnaire.preguntas_likert_codificadas)[number];

const PREGUNTAS_POR_CODIGO = new Map<string, PreguntaLikertRaw>(
  questionnaire.preguntas_likert_codificadas.map((p) => [p.codigo, p])
);

export function textoPregunta(codigo: string): string {
  return PREGUNTAS_POR_CODIGO.get(codigo)?.pregunta ?? codigo;
}

export function opcionesPregunta(codigo: string): { letra: string; texto: string }[] {
  return PREGUNTAS_POR_CODIGO.get(codigo)?.opciones ?? [];
}

// ── Tipos de paso ────────────────────────────────────────────────────

export interface CampoDemografico {
  id: string; // clave dentro de respuestas.demograficos
  etiqueta: string;
  tipo: 'texto' | 'fecha' | 'seleccion' | 'parrafo';
  opciones?: string[];
  requerido?: boolean;
}

export interface PasoDemografico {
  tipo: 'demografico';
  id: 'sobre-ti';
  titulo: string;
  subtitulo: string;
  campos: CampoDemografico[];
}

export interface PasoCuestionamientos {
  tipo: 'cuestionamientos';
  id: 'cuestionamientos';
  titulo: string;
  subtitulo: string;
}

export interface PasoLikert {
  tipo: 'likert';
  id: string; // nombre del aspecto (Dependencia, Pasado, ...)
  titulo: string;
  subtitulo: string;
  codigos: string[];
}

export interface PasoNinez {
  tipo: 'ninez';
  id: 'ninez';
  titulo: string;
  subtitulo: string;
  codigos: readonly string[];
}

export type Paso = PasoDemografico | PasoCuestionamientos | PasoLikert | PasoNinez;

// ── El cuestionario completo, paso a paso ──────────────────────────────
// El nombre/email ya se capturan en el registro (cuenta), no se repiten
// acá. El orden temático de los bloques Likert sigue el mismo que
// flowando_kb/calculation_order.json.

export const PASOS: Paso[] = [
  {
    tipo: 'demografico',
    id: 'sobre-ti',
    titulo: 'Sobre ti',
    subtitulo: 'Antes de empezar, cuéntanos un poco de ti.',
    campos: [
      { id: 'apodo', etiqueta: '¿Cómo te gusta que te llamen? (un nombre, diminutivo o apodo)', tipo: 'texto', requerido: true },
      {
        id: 'genero',
        etiqueta: 'Con cuál género te identificas',
        tipo: 'seleccion',
        opciones: ['Femenino', 'Masculino', 'No binario', 'Prefiero no decirlo'],
        requerido: true,
      },
      { id: 'fecha_nacimiento', etiqueta: 'Fecha exacta de nacimiento', tipo: 'fecha', requerido: true },
      { id: 'pais_ciudad', etiqueta: 'País y ciudad de nacimiento', tipo: 'texto', requerido: true },
      { id: 'telefono', etiqueta: 'Teléfono de contacto', tipo: 'texto', requerido: false },
      { id: 'soy', etiqueta: 'Soy', tipo: 'texto', requerido: false },
    ],
  },
  {
    tipo: 'cuestionamientos',
    id: 'cuestionamientos',
    titulo: 'Tu razón y tus preguntas',
    subtitulo:
      'Esto es lo que después va a usar Flowi para escribirte tu Carta personal, así que responde con calma y honestidad.',
  },
  {
    tipo: 'likert',
    id: 'Dependencia',
    titulo: 'Reconocimiento',
    subtitulo: 'Cómo te afecta lo que piensan y reconocen los demás.',
    codigos: [...CODIGOS_SUMA_LIKERT.Dependencia],
  },
  {
    tipo: 'likert',
    id: 'Pasado',
    titulo: 'El pasado',
    subtitulo: 'Tu relación con lo que ya viviste.',
    codigos: [...CODIGOS_SUMA_LIKERT.Pasado],
  },
  {
    tipo: 'likert',
    id: 'Compromiso',
    titulo: 'Compromiso',
    subtitulo: 'Cómo sostienes lo que empiezas.',
    codigos: [...CODIGOS_SUMA_LIKERT.Compromiso],
  },
  {
    tipo: 'likert',
    id: 'Responsabilidad',
    titulo: 'Responsabilidad',
    subtitulo: 'Cómo te relacionás con tus resultados.',
    codigos: [...CODIGOS_SUMA_LIKERT.Responsabilidad],
  },
  {
    tipo: 'likert',
    id: 'Felicidad',
    titulo: 'Felicidad',
    subtitulo: 'Tu satisfacción con la vida en general.',
    codigos: [...CODIGOS_SUMA_LIKERT.Felicidad],
  },
  {
    tipo: 'likert',
    id: 'Cambios',
    titulo: 'Adaptación al cambio',
    subtitulo: 'Cómo respondés cuando las cosas cambian.',
    codigos: [...CODIGOS_SUMA_LIKERT.Cambios],
  },
  {
    tipo: 'likert',
    id: 'TrabajoEnEquipo',
    titulo: 'Trabajo en equipo',
    subtitulo: 'Cómo te llevás con depender de otros y delegar.',
    codigos: [...CODIGOS_SUMA_LIKERT.TrabajoEnEquipo],
  },
  {
    tipo: 'likert',
    id: 'Liderazgo_1',
    titulo: 'Liderazgo (parte 1)',
    subtitulo: 'Tu forma de tomar decisiones y guiar.',
    codigos: [...CODIGOS_SUMA_LIKERT.Liderazgo_1],
  },
  {
    tipo: 'likert',
    id: 'Liderazgo_2',
    titulo: 'Liderazgo (parte 2)',
    subtitulo: 'Cómo influís e inspirás a otros.',
    codigos: [...CODIGOS_SUMA_LIKERT.Liderazgo_2],
  },
  {
    tipo: 'likert',
    id: 'Comunicación',
    titulo: 'Comunicación',
    subtitulo: 'Cómo te expresás con los demás.',
    codigos: [...CODIGOS_SUMA_LIKERT.Comunicación],
  },
  {
    tipo: 'likert',
    id: 'Negociación',
    titulo: 'Negociación',
    subtitulo: 'Cómo resolvés desacuerdos.',
    codigos: [...CODIGOS_SUMA_LIKERT.Negociación],
  },
  {
    tipo: 'likert',
    id: 'Inteligencias',
    titulo: 'Tu lugar de brillo',
    subtitulo: 'Nueve formas distintas de ser inteligente — marcá qué tan de acuerdo estás con cada una.',
    codigos: [...CODIGOS_INTELIGENCIAS],
  },
  {
    tipo: 'likert',
    id: 'Frustración',
    titulo: 'Tolerancia a la frustración',
    subtitulo: 'Cómo reaccionás cuando algo no sale como esperabas.',
    codigos: [...CODIGOS_SUMA_LIKERT.Frustración],
  },
  {
    tipo: 'likert',
    id: 'Recursividad',
    titulo: 'Recursividad',
    subtitulo: 'Tu creatividad para resolver problemas.',
    codigos: [...CODIGOS_SUMA_LIKERT.Recursividad],
  },
  {
    tipo: 'likert',
    id: 'Estabilidad_Emocional',
    titulo: 'Estabilidad emocional',
    subtitulo: 'Tu equilibrio interno frente a la presión.',
    codigos: [...CODIGOS_SUMA_LIKERT.Estabilidad_Emocional],
  },
  {
    tipo: 'likert',
    id: 'Pertenencia',
    titulo: 'Pertenencia',
    subtitulo: 'Tu sentido de comunidad y aceptación.',
    codigos: [...CODIGOS_SUMA_LIKERT.Pertenencia],
  },
  {
    tipo: 'ninez',
    id: 'ninez',
    titulo: 'Ecos de tu niñez',
    subtitulo: 'Cinco preguntas cortas sobre cómo eras de niño/a.',
    codigos: ['C93', 'C94', 'C95', 'C96', 'C97'],
  },
];

export const TOTAL_PASOS = PASOS.length;

/** Ilustración que acompaña a cada paso, para darle vida a la pantalla. */
export const IMAGEN_POR_PASO: Record<string, ClaveImagenWeb> = {
  'sobre-ti': 'eureka',
  cuestionamientos: 'escribe',
  Dependencia: 'triste',
  Pasado: 'medita',
  Compromiso: 'p5',
  Responsabilidad: 'compu',
  Felicidad: 'eureka',
  Cambios: 'puente',
  TrabajoEnEquipo: 'pmundo',
  Liderazgo_1: 'p3',
  Liderazgo_2: 'p6',
  Comunicación: 'escribe',
  Negociación: 'p2',
  Inteligencias: 'eureka',
  Frustración: 'triste',
  Recursividad: 'ilumina',
  Estabilidad_Emocional: 'medita',
  Pertenencia: 'pmundo',
  ninez: 'eureka',
};
