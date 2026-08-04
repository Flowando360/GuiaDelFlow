import type { DatosNacimiento } from './fechas';

export type { DatosNacimiento };

/**
 * Respuestas del cuestionario, indexadas por código (C9..C97).
 * - C9-C92: número 1-5 (escala Likert).
 * - C93-C97: letra 'A'-'E'.
 */
export type RespuestasCuestionario = Record<string, number | string>;

/**
 * Resultado de un aspecto ya calculado y con su contenido (título,
 * descripción, etc.) ya resuelto desde knowledge_base. Es deliberadamente
 * flexible en su forma (`Record<string, unknown>`) porque cada tipo_calculo
 * usa distintos campos (min/max, valor, residuo+elemento, etc.) — el
 * consumidor (prompt a Claude, plantilla del PDF) lee los campos que
 * necesita por nombre.
 */
export type ResultadoAspecto = Record<string, unknown>;

/**
 * Inteligencias es el único aspecto "multi-resultado": cada una de las 9
 * preguntas (C64-C72) activa o no su propia inteligencia de forma
 * independiente (ver README: "se activa si respuesta >= 3").
 */
export type ResultadoInteligencias = ResultadoAspecto[];

export interface ResultadosCalculados {
  TALENTO_UNICO: ResultadoAspecto;
  TEMPERAMENTO: ResultadoAspecto;
  CARACTER: ResultadoAspecto;
  ETAPA_FLOW: ResultadoAspecto;
  Talento_Innato: ResultadoAspecto;
  Talento_Potenciar: ResultadoAspecto;
  Proposito_1: ResultadoAspecto;
  DesafioInterior: ResultadoAspecto;
  Desafio_Sanacion: ResultadoAspecto;
  Niñez: ResultadoAspecto;
  Dependencia: ResultadoAspecto;
  Pasado: ResultadoAspecto;
  Compromiso: ResultadoAspecto;
  Responsabilidad: ResultadoAspecto;
  Felicidad: ResultadoAspecto;
  Cambios: ResultadoAspecto;
  TrabajoEnEquipo: ResultadoAspecto;
  Liderazgo_1: ResultadoAspecto;
  Liderazgo_2: ResultadoAspecto;
  Comunicación: ResultadoAspecto;
  Negociación: ResultadoAspecto;
  Frustración: ResultadoAspecto;
  Recursividad: ResultadoAspecto;
  Estabilidad_Emocional: ResultadoAspecto;
  Pertenencia: ResultadoAspecto;
  Inteligencias: ResultadoInteligencias;
  Proposito_2: ResultadoAspecto;
  Desafio_Libera: ResultadoAspecto;
  CualidadesPotencia: ResultadoAspecto;
  Integra: ResultadoAspecto;
}
