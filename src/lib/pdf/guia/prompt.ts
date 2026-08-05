import type { ResultadoAspecto, ResultadosCalculados } from '../../calculo/tipos';

export interface EntradaSeccion {
  seccion: string;
  aspecto: ResultadoAspecto;
}

function textoAspecto(aspecto: ResultadoAspecto): string {
  const partes = ['titulo', 'descripcion', 'recomendacion', 'reflexion', 'introduccion']
    .map((campo) => aspecto[campo])
    .filter((v): v is string => typeof v === 'string' && v.length > 0);
  return partes.join('\n');
}

function bloque(entradas: EntradaSeccion[]): string {
  return entradas
    .map(
      ({ seccion, aspecto }) => `### ${seccion}
${textoAspecto(aspecto)}`
    )
    .join('\n\n');
}

/**
 * Arma las 4 categorías (talentos/emociones/pertenencia/desafíos) a
 * partir de los 30 aspectos ya calculados. Los nombres de "seccion" acá
 * deben coincidir con SECTION_IMAGES en plantilla.ts para que cada
 * sección tenga imagen — los que no coincidan (ej. inteligencias
 * dinámicas) caen en la imagen por defecto, sin romper nada.
 */
export function agruparPorCategoria(r: ResultadosCalculados) {
  const talentos: EntradaSeccion[] = [
    { seccion: 'Carácter', aspecto: r.CARACTER },
    { seccion: 'Temperamento', aspecto: r.TEMPERAMENTO },
    { seccion: 'Talentos innatos', aspecto: r.Talento_Innato },
    { seccion: 'Talentos para potenciar', aspecto: r.Talento_Potenciar },
    { seccion: 'Propósito-Intuición', aspecto: r.Proposito_1 },
    { seccion: 'Propósito-Equilibrio', aspecto: r.Proposito_2 },
    { seccion: 'Liderazgo-Inspirar', aspecto: r.Liderazgo_1 },
    { seccion: 'Liderazgo-Transformacional', aspecto: r.Liderazgo_2 },
    { seccion: 'Comunicación', aspecto: r.Comunicación },
    { seccion: 'Ecos infancia', aspecto: r.Niñez },
    // Las inteligencias predominantes son dinámicas: solo se listan las
    // que de verdad cruzaron el umbral (>=3), con su propio título real
    // en vez de forzar 3 categorías fijas que quizás no apliquen.
    ...r.Inteligencias.map((aspecto, i) => ({
      seccion: `Inteligencia ${i + 1}`,
      aspecto,
    })),
  ];

  const emociones: EntradaSeccion[] = [
    { seccion: 'El pasado', aspecto: r.Pasado },
    { seccion: 'Tolerancia frustración', aspecto: r.Frustración },
    { seccion: 'Estabilidad emocional', aspecto: r.Estabilidad_Emocional },
    { seccion: 'Felicidad', aspecto: r.Felicidad },
  ];

  const pertenencia: EntradaSeccion[] = [
    { seccion: 'Dependencia', aspecto: r.Dependencia },
    { seccion: 'Pertenencia', aspecto: r.Pertenencia },
    { seccion: 'Trabajo en equipo', aspecto: r.TrabajoEnEquipo },
    { seccion: 'Responsabilidad', aspecto: r.Responsabilidad },
  ];

  const desafios: EntradaSeccion[] = [
    { seccion: 'Etapa del Flow', aspecto: r.ETAPA_FLOW },
    { seccion: 'Retos internos', aspecto: r.DesafioInterior },
    { seccion: 'Desafíos sanación', aspecto: r.Desafio_Sanacion },
    { seccion: 'Balance', aspecto: r.Desafio_Libera },
    { seccion: 'Tu mente faro', aspecto: r.CualidadesPotencia },
    { seccion: 'Compromiso', aspecto: r.Compromiso },
    { seccion: 'Adaptación al cambio', aspecto: r.Cambios },
    { seccion: 'Negociación', aspecto: r.Negociación },
    { seccion: 'Recursividad', aspecto: r.Recursividad },
  ];

  return { talentos, emociones, pertenencia, desafios };
}

const REGLAS_COMUNES = `REGLAS CRÍTICAS:
- No inventes datos ni resultados — solo condensa lo que te doy.
- Conserva la esencia emocional de cada texto: que llegue al corazón.
- Elimina repeticiones y frases de relleno.
- Cada "texto" condensado: 3-4 oraciones, fluido, humano, directo, en segunda persona ("tú").
- Los "recuerda_izq"/"recuerda_der": máximo 2 oraciones cada uno, en tono de recordatorio íntimo.
- El "subtitulo" de cada sección es una frase corta que resume su esencia (no repitas el nombre de la sección).
- Responde SOLO usando la herramienta que se te dio, sin explicaciones ni markdown.`;

/**
 * La Guía se genera en 4 llamadas a Claude EN PARALELO (una por
 * capítulo) en vez de una sola llamada gigante — la versión de un solo
 * llamado tardaba 80-100s, más que el límite de 60s de las funciones de
 * Vercel en el plan Hobby. Dividido así, cada llamada es más chica y
 * rápida, y el tiempo total es el de la más lenta, no la suma de las 4.
 */

export function promptTalentos(nombre: string, resultados: ResultadosCalculados): string {
  const { talentos } = agruparPorCategoria(resultados);
  return `Eres el asistente de FlowAndo. Te doy los resultados YA CALCULADOS del cuestionario de ${nombre} — cada aspecto con su título, descripción, recomendación y reflexión originales (de la base de conocimiento de FlowAndo). Tu trabajo es CONDENSAR y darle voz humana y cálida a lo que ya está ahí, para la sección "Talentos Poderosos" y el "Talento Único" de su Guía del Flow.

${REGLAS_COMUNES}
- "frase_cierre": UNA sola oración breve (máximo ~120 caracteres) que cierre TODA la Guía con calidez — no un párrafo. Ejemplo de longitud correcta: "El verdadero crecimiento no es un destino, sino una aventura en constante evolución."

--- TALENTO ÚNICO ---
${textoAspecto(resultados.TALENTO_UNICO)}

--- TALENTOS (usa EXACTAMENTE estos nombres de "seccion") ---
${bloque(talentos)}

--- INTEGRA (contexto adicional, úsalo para inspirar la frase_cierre) ---
${textoAspecto(resultados.Integra)}
`;
}

export function promptEmociones(nombre: string, resultados: ResultadosCalculados): string {
  const { emociones } = agruparPorCategoria(resultados);
  return `Eres el asistente de FlowAndo. Te doy los resultados YA CALCULADOS del cuestionario de ${nombre} para la sección "Emociones" de su Guía del Flow.

${REGLAS_COMUNES}

--- EMOCIONES (usa EXACTAMENTE estos nombres de "seccion") ---
${bloque(emociones)}
`;
}

export function promptPertenencia(nombre: string, resultados: ResultadosCalculados): string {
  const { pertenencia } = agruparPorCategoria(resultados);
  return `Eres el asistente de FlowAndo. Te doy los resultados YA CALCULADOS del cuestionario de ${nombre} para la sección "Pertenencia y Compromiso" de su Guía del Flow.

${REGLAS_COMUNES}

--- PERTENENCIA (usa EXACTAMENTE estos nombres de "seccion") ---
${bloque(pertenencia)}
`;
}

export function promptDesafios(nombre: string, resultados: ResultadosCalculados): string {
  const { desafios } = agruparPorCategoria(resultados);
  return `Eres el asistente de FlowAndo. Te doy los resultados YA CALCULADOS del cuestionario de ${nombre} para la sección "Desafíos" de su Guía del Flow.

${REGLAS_COMUNES}

--- DESAFÍOS (usa EXACTAMENTE estos nombres de "seccion") ---
${bloque(desafios)}
`;
}
