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

/**
 * Un bloque = un aspecto (los mismos 5 códigos de siempre, sin tocar).
 * Varios bloques pueden convivir en una sola pantalla (ver PasoLikert) —
 * eso es lo único que cambia: la cantidad de pantallas, no las preguntas
 * ni el cálculo.
 */
export interface BloqueLikert {
  id: string; // nombre del aspecto, igual al que usa el motor de cálculo
  titulo: string;
  codigos: string[];
}

export interface PasoLikert {
  tipo: 'likert';
  id: string; // slug de la pantalla (puede agrupar 1 o más aspectos)
  titulo: string;
  subtitulo: string;
  bloques: BloqueLikert[];
}

export interface PasoNinez {
  tipo: 'ninez';
  id: 'ninez';
  titulo: string;
  subtitulo: string;
  codigos: readonly string[];
}

export type Paso = PasoDemografico | PasoCuestionamientos | PasoLikert | PasoNinez;

/** Todos los códigos Likert de un paso (sea de 1 o varios bloques). */
export function codigosDelPaso(paso: PasoLikert): string[] {
  return paso.bloques.flatMap((b) => b.codigos);
}

// ── El cuestionario completo, paso a paso ──────────────────────────────
// El nombre/email ya se capturan en el registro (cuenta), no se repiten
// acá. Los 15 aspectos Likert siguen siendo exactamente los mismos que
// calcula el motor (flowando_kb/calculation_order.json) — lo único que
// cambió acá es cómo se agrupan en pantallas, para acortar el
// cuestionario sin tocar ni una pregunta ni un resultado (pedido del
// usuario 2026-08-04, después de terminar de responderlo una vez).

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
    id: 'pasado-felicidad',
    titulo: 'En cuanto a tu bienestar y tu relación con el pasado',
    subtitulo: 'Responde de acuerdo a tus comportamientos habituales.',
    bloques: [
      { id: 'Pasado', titulo: 'Tu relación con el pasado', codigos: [...CODIGOS_SUMA_LIKERT.Pasado] },
      { id: 'Felicidad', titulo: 'Tu bienestar y satisfacción', codigos: [...CODIGOS_SUMA_LIKERT.Felicidad] },
    ],
  },
  {
    tipo: 'likert',
    id: 'dependencia-pertenencia',
    titulo: 'En cuanto a la atención de los demás y tu sentido de pertenencia',
    subtitulo: 'Responde de acuerdo a tus comportamientos habituales.',
    bloques: [
      { id: 'Dependencia', titulo: 'La atención de los demás', codigos: [...CODIGOS_SUMA_LIKERT.Dependencia] },
      { id: 'Pertenencia', titulo: 'Tu sentido de pertenencia', codigos: [...CODIGOS_SUMA_LIKERT.Pertenencia] },
    ],
  },
  {
    tipo: 'likert',
    id: 'compromiso-responsabilidad',
    titulo: 'En cuanto a tus compromisos y tu responsabilidad',
    subtitulo: 'Responde de acuerdo a tus comportamientos habituales.',
    bloques: [
      { id: 'Compromiso', titulo: 'Cómo sostienes tus compromisos', codigos: [...CODIGOS_SUMA_LIKERT.Compromiso] },
      {
        id: 'Responsabilidad',
        titulo: 'Cómo asumes tu responsabilidad',
        codigos: [...CODIGOS_SUMA_LIKERT.Responsabilidad],
      },
    ],
  },
  {
    tipo: 'likert',
    id: 'cambios-recursividad',
    titulo: 'En cuanto a cómo te adaptas y resuelves',
    subtitulo: 'Responde de acuerdo a tus comportamientos habituales.',
    bloques: [
      { id: 'Cambios', titulo: 'Cómo vives los cambios', codigos: [...CODIGOS_SUMA_LIKERT.Cambios] },
      {
        id: 'Recursividad',
        titulo: 'Tu creatividad para resolver',
        codigos: [...CODIGOS_SUMA_LIKERT.Recursividad],
      },
    ],
  },
  {
    tipo: 'likert',
    id: 'equipo-comunicacion',
    titulo: 'En cuanto a cómo trabajas y te comunicas con otros',
    subtitulo: 'Responde de acuerdo a tus comportamientos habituales.',
    bloques: [
      {
        id: 'TrabajoEnEquipo',
        titulo: 'Cómo trabajas con otros',
        codigos: [...CODIGOS_SUMA_LIKERT.TrabajoEnEquipo],
      },
      { id: 'Comunicación', titulo: 'Cómo te comunicas', codigos: [...CODIGOS_SUMA_LIKERT.Comunicación] },
    ],
  },
  {
    tipo: 'likert',
    id: 'liderazgo',
    titulo: 'En cuanto a tu forma de liderar e inspirar',
    subtitulo: 'Responde de acuerdo a tus comportamientos habituales.',
    bloques: [
      { id: 'Liderazgo_1', titulo: 'Tu forma de liderar', codigos: [...CODIGOS_SUMA_LIKERT.Liderazgo_1] },
      { id: 'Liderazgo_2', titulo: 'Cómo inspiras a otros', codigos: [...CODIGOS_SUMA_LIKERT.Liderazgo_2] },
    ],
  },
  {
    tipo: 'likert',
    id: 'negociacion-frustracion',
    titulo: 'En cuanto a cómo resuelves desacuerdos y frustraciones',
    subtitulo: 'Responde de acuerdo a tus comportamientos habituales.',
    bloques: [
      { id: 'Negociación', titulo: 'Cómo resuelves desacuerdos', codigos: [...CODIGOS_SUMA_LIKERT.Negociación] },
      {
        id: 'Frustración',
        titulo: 'Cómo enfrentas la frustración',
        codigos: [...CODIGOS_SUMA_LIKERT.Frustración],
      },
    ],
  },
  {
    tipo: 'likert',
    id: 'estabilidad',
    titulo: 'En cuanto a tu equilibrio emocional',
    subtitulo: 'Responde de acuerdo a tus comportamientos habituales.',
    bloques: [
      {
        id: 'Estabilidad_Emocional',
        titulo: 'Tu equilibrio emocional',
        codigos: [...CODIGOS_SUMA_LIKERT.Estabilidad_Emocional],
      },
    ],
  },
  {
    tipo: 'likert',
    id: 'inteligencias',
    titulo: 'Tu lugar de brillo',
    subtitulo: 'Nueve formas distintas de ser inteligente — marca qué tan de acuerdo estás con cada una.',
    bloques: [{ id: 'Inteligencias', titulo: 'Tu lugar de brillo', codigos: [...CODIGOS_INTELIGENCIAS] }],
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
  'pasado-felicidad': 'medita',
  'dependencia-pertenencia': 'pmundo',
  'compromiso-responsabilidad': 'compu',
  'cambios-recursividad': 'puente',
  'equipo-comunicacion': 'escena3',
  liderazgo: 'p3',
  'negociacion-frustracion': 'triste',
  estabilidad: 'ilumina',
  inteligencias: 'eureka',
  ninez: 'eureka',
};
