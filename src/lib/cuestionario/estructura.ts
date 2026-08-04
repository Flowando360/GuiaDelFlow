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
        opciones: ['Femenino', 'Masculino', 'Otro'],
        requerido: true,
      },
      { id: 'fecha_nacimiento', etiqueta: 'Fecha exacta de nacimiento', tipo: 'fecha', requerido: true },
      { id: 'pais_ciudad', etiqueta: 'País y ciudad de nacimiento', tipo: 'texto', requerido: true },
      { id: 'telefono', etiqueta: 'Teléfono de contacto', tipo: 'texto', requerido: false },
      {
        id: 'soy',
        etiqueta: 'Soy',
        tipo: 'seleccion',
        opciones: [
          'Estudiante',
          'Emprendedor',
          'Empleado',
          'Propietario de una empresa con trayectoria',
          'Empleado con deseos de emprender',
          'Trabajo de manera independiente sin empresa ni emprendimiento',
        ],
        requerido: true,
      },
    ],
  },
  {
    tipo: 'cuestionamientos',
    id: 'cuestionamientos',
    titulo: 'Un momento para escucharte',
    subtitulo:
      'Estás a punto de iniciar un proceso de autoconocimiento profundo. La Guía del Flow te ayudará a comprender tu esencia, reconocer tus talentos y dar claridad a tu propósito. Antes de avanzar, tómate un instante para mirar hacia adentro: no respondas desde lo que "deberías" sentir, sino desde lo que realmente está vivo en ti hoy. Estas preguntas no buscan respuestas perfectas, sino honestas — son un punto de partida, no un diagnóstico. Respóndelas con apertura y sin juicio.',
  },
  {
    tipo: 'likert',
    id: 'Dependencia',
    titulo: 'En cuanto a la atención de los demás',
    subtitulo: 'Responde de acuerdo a tus comportamientos habituales.',
    codigos: [...CODIGOS_SUMA_LIKERT.Dependencia],
  },
  {
    tipo: 'likert',
    id: 'Pasado',
    titulo: 'En cuanto a tu relación con el pasado',
    subtitulo: 'Responde de acuerdo a tus comportamientos habituales.',
    codigos: [...CODIGOS_SUMA_LIKERT.Pasado],
  },
  {
    tipo: 'likert',
    id: 'Compromiso',
    titulo: 'En cuanto a cómo sostienes tus compromisos',
    subtitulo: 'Responde de acuerdo a tus comportamientos habituales.',
    codigos: [...CODIGOS_SUMA_LIKERT.Compromiso],
  },
  {
    tipo: 'likert',
    id: 'Responsabilidad',
    titulo: 'En cuanto a cómo asumes tu responsabilidad',
    subtitulo: 'Responde de acuerdo a tus comportamientos habituales.',
    codigos: [...CODIGOS_SUMA_LIKERT.Responsabilidad],
  },
  {
    tipo: 'likert',
    id: 'Felicidad',
    titulo: 'En cuanto a tu bienestar y satisfacción',
    subtitulo: 'Responde de acuerdo a tus comportamientos habituales.',
    codigos: [...CODIGOS_SUMA_LIKERT.Felicidad],
  },
  {
    tipo: 'likert',
    id: 'Cambios',
    titulo: 'En cuanto a cómo vives los cambios',
    subtitulo: 'Responde de acuerdo a tus comportamientos habituales.',
    codigos: [...CODIGOS_SUMA_LIKERT.Cambios],
  },
  {
    tipo: 'likert',
    id: 'TrabajoEnEquipo',
    titulo: 'En cuanto a cómo trabajas con otros',
    subtitulo: 'Responde de acuerdo a tus comportamientos habituales.',
    codigos: [...CODIGOS_SUMA_LIKERT.TrabajoEnEquipo],
  },
  {
    tipo: 'likert',
    id: 'Liderazgo_1',
    titulo: 'En cuanto a tu forma de liderar',
    subtitulo: 'Responde de acuerdo a tus comportamientos habituales.',
    codigos: [...CODIGOS_SUMA_LIKERT.Liderazgo_1],
  },
  {
    tipo: 'likert',
    id: 'Liderazgo_2',
    titulo: 'En cuanto a cómo inspiras a otros',
    subtitulo: 'Responde de acuerdo a tus comportamientos habituales.',
    codigos: [...CODIGOS_SUMA_LIKERT.Liderazgo_2],
  },
  {
    tipo: 'likert',
    id: 'Comunicación',
    titulo: 'En cuanto a cómo te comunicas',
    subtitulo: 'Responde de acuerdo a tus comportamientos habituales.',
    codigos: [...CODIGOS_SUMA_LIKERT.Comunicación],
  },
  {
    tipo: 'likert',
    id: 'Negociación',
    titulo: 'En cuanto a cómo resuelves desacuerdos',
    subtitulo: 'Responde de acuerdo a tus comportamientos habituales.',
    codigos: [...CODIGOS_SUMA_LIKERT.Negociación],
  },
  {
    tipo: 'likert',
    id: 'Inteligencias',
    titulo: 'Tu lugar de brillo',
    subtitulo: 'Nueve formas distintas de ser inteligente — marca qué tan de acuerdo estás con cada una.',
    codigos: [...CODIGOS_INTELIGENCIAS],
  },
  {
    tipo: 'likert',
    id: 'Frustración',
    titulo: 'En cuanto a cómo enfrentas la frustración',
    subtitulo: 'Responde de acuerdo a tus comportamientos habituales.',
    codigos: [...CODIGOS_SUMA_LIKERT.Frustración],
  },
  {
    tipo: 'likert',
    id: 'Recursividad',
    titulo: 'En cuanto a tu creatividad para resolver',
    subtitulo: 'Responde de acuerdo a tus comportamientos habituales.',
    codigos: [...CODIGOS_SUMA_LIKERT.Recursividad],
  },
  {
    tipo: 'likert',
    id: 'Estabilidad_Emocional',
    titulo: 'En cuanto a tu equilibrio emocional',
    subtitulo: 'Responde de acuerdo a tus comportamientos habituales.',
    codigos: [...CODIGOS_SUMA_LIKERT.Estabilidad_Emocional],
  },
  {
    tipo: 'likert',
    id: 'Pertenencia',
    titulo: 'En cuanto a tu sentido de pertenencia',
    subtitulo: 'Responde de acuerdo a tus comportamientos habituales.',
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
