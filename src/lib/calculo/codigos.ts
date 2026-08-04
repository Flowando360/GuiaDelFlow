/**
 * Qué códigos de pregunta (C9-C97) alimentan cada aspecto suma_likert.
 * Fuente única de verdad — la usa tanto el motor de cálculo
 * (src/lib/calculo/motor.ts) como la UI del cuestionario (para agrupar
 * las preguntas en pasos temáticos). Ver flowando_kb/knowledge_base/*.json
 * → preambulo ("Suma C9-C13", etc.) de donde salen estos rangos.
 */
function rangoCodigos(desde: number, hasta: number): string[] {
  const out: string[] = [];
  for (let i = desde; i <= hasta; i++) out.push(`C${i}`);
  return out;
}

export const CODIGOS_SUMA_LIKERT = {
  Dependencia: rangoCodigos(9, 13),
  Pasado: rangoCodigos(14, 18),
  Compromiso: rangoCodigos(19, 23),
  Responsabilidad: rangoCodigos(24, 28),
  Felicidad: rangoCodigos(29, 33),
  Cambios: rangoCodigos(34, 38),
  TrabajoEnEquipo: rangoCodigos(39, 43),
  Liderazgo_1: rangoCodigos(44, 48),
  Liderazgo_2: rangoCodigos(49, 53),
  Comunicación: rangoCodigos(54, 58),
  Negociación: rangoCodigos(59, 63),
  Frustración: rangoCodigos(73, 77),
  Recursividad: rangoCodigos(78, 82),
  Estabilidad_Emocional: rangoCodigos(83, 87),
  Pertenencia: rangoCodigos(88, 92),
} as const;

/** C64-C72: cada código activa su propia inteligencia si la respuesta >= 3. */
export const CODIGOS_INTELIGENCIAS = rangoCodigos(64, 72);

/** C93-C97: opción múltiple A-E, letra más frecuente gana (ver Niñez). */
export const CODIGOS_NINEZ = ['C93', 'C94', 'C95', 'C96', 'C97'] as const;

/** Todos los códigos Likert numéricos (C9-C92, sin contar C93-C97). */
export const CODIGOS_LIKERT_NUMERICOS = rangoCodigos(9, 92);
