import type { ResultadoAspecto, ResultadosCalculados } from '../../calculo/tipos';

interface EntradaSeccion {
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
function agruparPorCategoria(r: ResultadosCalculados) {
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

export function construirPromptGuia(datos: {
  nombre: string;
  fecha: string;
  origen: string;
  resultados: ResultadosCalculados;
}): string {
  const { talentos, emociones, pertenencia, desafios } = agruparPorCategoria(datos.resultados);
  const integra = textoAspecto(datos.resultados.Integra);

  return `Eres el asistente de FlowAndo. Te doy los resultados YA CALCULADOS del cuestionario de ${datos.nombre} — cada aspecto con su título, descripción, recomendación y reflexión originales (salen de la base de conocimiento de FlowAndo, ya redactados por el equipo). Tu trabajo NO es inventar contenido nuevo: es CONDENSAR y darle voz humana y cálida a lo que ya está ahí, para armar la Guía del Flow.

REGLAS CRÍTICAS:
- No inventes datos ni resultados — solo condensa lo que te doy.
- Conserva la esencia emocional de cada texto: que llegue al corazón.
- Elimina repeticiones y frases de relleno.
- Cada "texto" condensado: 3-4 oraciones, fluido, humano, directo, en segunda persona ("tú").
- Los "recuerda_izq"/"recuerda_der": máximo 2 oraciones cada uno, en tono de recordatorio íntimo.
- El "subtitulo" de cada sección es una frase corta que resume su esencia (no repitas el nombre de la sección).
- Responde SOLO con el JSON, sin explicaciones ni markdown.

ESTRUCTURA JSON REQUERIDA:
{
  "nombre": "${datos.nombre}",
  "fecha": "${datos.fecha}",
  "origen": "${datos.origen}",
  "talento_unico": { "titulo_sello": "string (frase potente, ej: Eres el visionario que nunca se detiene)", "texto": "string (3-4 oraciones)" },
  "talentos": [ { "seccion": "string (usa EXACTAMENTE el nombre de sección que te doy abajo)", "subtitulo": "string", "texto": "string", "recuerda_izq": "string", "recuerda_der": "string" }, ... uno por cada sección de TALENTOS ],
  "emociones": [ ... uno por cada sección de EMOCIONES ],
  "pertenencia": [ ... uno por cada sección de PERTENENCIA ],
  "desafios": [ ... uno por cada sección de DESAFÍOS ],
  "frase_cierre": "string (frase motivacional final, cálida, que cierre el documento)"
}

--- TALENTO ÚNICO (va aparte, no en el array talentos) ---
${textoAspecto(datos.resultados.TALENTO_UNICO)}

--- TALENTOS ---
${bloque(talentos)}

--- EMOCIONES ---
${bloque(emociones)}

--- PERTENENCIA ---
${bloque(pertenencia)}

--- DESAFÍOS ---
${bloque(desafios)}

--- INTEGRA (contexto adicional, no necesita su propia sección, pero puedes usarlo para inspirar la frase_cierre) ---
${integra}
`;
}
