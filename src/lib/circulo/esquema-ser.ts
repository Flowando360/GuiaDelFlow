import type Anthropic from '@anthropic-ai/sdk';
import { clienteClaude, extraerToolUse } from '@/lib/claude/cliente';
import { KNOWLEDGE_BASE } from '@/lib/kb/knowledgeBase';
import type { ResultadoAspecto, ResultadosCalculados } from '@/lib/calculo/tipos';

/**
 * ESQUEMA DEL SER que viaja a Espiral de Crecimiento.
 *
 * Principio (decisión de Diana, 2026-11-13): la empresa NUNCA recibe la Guía del Flow de la persona ni su carta. Recibe
 * un esquema: aspecto por aspecto, solo lo que tiene relevancia laboral, redactado para la empresa en tercera persona.
 * El texto original de la Guía (que está en segunda persona y es íntimo) se usa aquí únicamente como insumo para
 * redactar el esquema y NO se guarda en Espiral.
 *
 * Los aspectos íntimos (infancia, pasado, frustración, estabilidad emocional, felicidad, dependencia, pertenencia,
 * etapa del Flow, retos internos, sanación, balance, mente faro y los cierres) no se leen nunca aquí.
 */

export type Enfoque = 'aprovechar' | 'equilibrado' | 'acompanar';

/** Un aspecto con relevancia laboral, tal como lo calculó la Guía. `fuente` es solo insumo para redactar. */
export interface AspectoGuia {
  nombre: string;
  titulo: string | null;
  enfoque: Enfoque;
  fuente: { descripcion: string; recomendacion: string };
}

/**
 * Lenguaje neutro en género: no se sabe cómo se identifica la persona. El modelo a veces deja pronombres pegados al verbo
 * ("Involucrarla", "exigirle"); se convierten en "a la persona". No toca palabras que no sean infinitivos.
 */
export function neutralizarGenero(texto: string): string {
  return texto.replace(/(\p{L}{3,}(?:ar|er|ir))(la|le)(?!\p{L})/giu, (_m, verbo: string) => `${verbo} a la persona`);
}

/** Lo que se guarda en Espiral para cada aspecto. */
export interface AspectoEsquema {
  nombre: string;
  titulo: string | null;
  enfoque: Enfoque;
  descripcion: string | null;
  aprovechar: string | null;
  acompanar: string | null;
}

// Sin escala real (numerología / signo / fecha): son un tipo, no un grado. Son rasgos para aprovechar.
const ASPECTOS_TIPO_UNICO: { clave: keyof ResultadosCalculados; nombre: string }[] = [
  { clave: 'TALENTO_UNICO', nombre: 'Talento único' },
  { clave: 'CARACTER', nombre: 'Carácter' },
  { clave: 'TEMPERAMENTO', nombre: 'Temperamento' },
  { clave: 'Talento_Innato', nombre: 'Talentos innatos' },
  { clave: 'Talento_Potenciar', nombre: 'Talentos para potenciar' },
  { clave: 'Proposito_1', nombre: 'Propósito – Intuición' },
  { clave: 'Proposito_2', nombre: 'Propósito – Equilibrio' },
];

// suma_likert: hay grado real (bajo / medio / alto). El grado solo decide la lectura descriptiva, no una nota.
const ASPECTOS_ESCALA: { clave: keyof ResultadosCalculados; nombre: string; kb: keyof typeof KNOWLEDGE_BASE }[] = [
  { clave: 'Liderazgo_1', nombre: 'Liderazgo – Inspirar', kb: 'Liderazgo_1' },
  { clave: 'Liderazgo_2', nombre: 'Liderazgo – Transformacional', kb: 'Liderazgo_2' },
  { clave: 'Comunicación', nombre: 'Comunicación', kb: 'Comunicación' },
  { clave: 'TrabajoEnEquipo', nombre: 'Trabajo en equipo', kb: 'TrabajoEnEquipo' },
  { clave: 'Responsabilidad', nombre: 'Responsabilidad', kb: 'Responsabilidad' },
  { clave: 'Compromiso', nombre: 'Compromiso', kb: 'Compromiso' },
  { clave: 'Cambios', nombre: 'Adaptación al cambio', kb: 'Cambios' },
  { clave: 'Negociación', nombre: 'Negociación', kb: 'Negociación' },
  { clave: 'Recursividad', nombre: 'Recursividad', kb: 'Recursividad' },
];

/** Las 9 inteligencias, en el orden del knowledge_base (el mismo de la Guía: Inteligencia 1 a 9). */
export const NOMBRES_INTELIGENCIAS = [
  'Inteligencia verbal',
  'Inteligencia lógica',
  'Inteligencia visual',
  'Inteligencia musical',
  'Inteligencia corporal',
  'Inteligencia interpersonal',
  'Inteligencia intrapersonal',
  'Inteligencia naturalista',
  'Inteligencia existencial',
] as const;

function texto(r: ResultadoAspecto | undefined, campo: string): string {
  const v = r?.[campo];
  return typeof v === 'string' ? v : '';
}

// Comunicación, Negociación y Liderazgo transformacional NO son escalas de menor a mayor: cada resultado es un ESTILO.
// Por eso la lectura no depende de la posición sino del estilo. Un estilo «para aprovechar» es el que más favorece el
// trabajo con otros; «en equilibrio» es válido según la situación; «para acompañar» es el que conviene conversar.
const ENFOQUE_POR_ESTILO: Record<string, Enfoque> = {
  'Comunicación Asertiva': 'aprovechar',
  'Comunicación Pasiva': 'acompanar',
  'Comunicación Pasivo-Agresiva': 'acompanar',
  'Comunicación Agresiva': 'acompanar',
  'Estilo Colaborativo': 'aprovechar',
  'Estilo Comprometedor': 'equilibrado',
  'Estilo Competitivo': 'equilibrado',
  'Estilo Evitativo': 'acompanar',
  'Liderazgo Transformacional': 'aprovechar',
  'Liderazgo Carismático': 'aprovechar',
  'Liderazgo Democrático': 'aprovechar',
  'Liderazgo Delegativo (Laissez-Faire)': 'equilibrado',
  'Liderazgo Autoritario': 'acompanar',
};

/**
 * Lectura descriptiva (no es una nota). Las escalas de tres niveles (bajo / medio / alto) se leen por su posición;
 * las de estilos, por el estilo. Si aparece un estilo desconocido se deja «en equilibrio» en vez de adivinar.
 */
function enfoqueEscala(resultado: ResultadoAspecto, todos: readonly ResultadoAspecto[]): Enfoque {
  if (todos.length === 3) {
    const ordenado = [...todos].sort((a, b) => Number(a.min) - Number(b.min));
    const idx = ordenado.findIndex((r) => Number(r.min) === Number(resultado.min) && Number(r.max) === Number(resultado.max));
    if (idx === 0) return 'acompanar';
    if (idx === 1) return 'equilibrado';
    return 'aprovechar';
  }
  return ENFOQUE_POR_ESTILO[texto(resultado, 'titulo')] ?? 'equilibrado';
}

/** Los aspectos con relevancia laboral de esta persona, en el orden del esquema. */
export function construirAspectos(resultados: ResultadosCalculados): AspectoGuia[] {
  const salida: AspectoGuia[] = [];

  for (const { clave, nombre } of ASPECTOS_TIPO_UNICO) {
    const r = resultados[clave] as ResultadoAspecto | undefined;
    if (!r) continue;
    salida.push({
      nombre,
      titulo: texto(r, 'titulo') || null,
      enfoque: 'aprovechar',
      fuente: { descripcion: texto(r, 'descripcion'), recomendacion: texto(r, 'recomendacion') },
    });
  }

  for (const { clave, nombre, kb } of ASPECTOS_ESCALA) {
    const r = resultados[clave] as ResultadoAspecto | undefined;
    if (!r) continue;
    const todos = KNOWLEDGE_BASE[kb].resultados as unknown as ResultadoAspecto[];
    salida.push({
      nombre,
      titulo: texto(r, 'titulo') || null,
      enfoque: enfoqueEscala(r, todos),
      fuente: { descripcion: texto(r, 'descripcion'), recomendacion: texto(r, 'recomendacion') },
    });
  }

  // Cada inteligencia activa va a SU aspecto (se identifica por su lugar en el knowledge_base, no por el orden en que salió).
  const todasInteligencias = KNOWLEDGE_BASE.Inteligencias.resultados as unknown as ResultadoAspecto[];
  for (const r of resultados.Inteligencias ?? []) {
    const idx = todasInteligencias.findIndex((x) => x.codigo === r.codigo);
    const nombre = NOMBRES_INTELIGENCIAS[idx];
    if (!nombre) continue;
    salida.push({
      nombre,
      titulo: texto(r, 'titulo') || null,
      enfoque: 'aprovechar',
      fuente: { descripcion: texto(r, 'descripcion'), recomendacion: texto(r, 'recomendacion') },
    });
  }

  return salida;
}

// ── Redacción del esquema para la empresa ────────────────────────────────────

const SYSTEM_ESQUEMA = `Eres un especialista en Talento Humano. Recibes, por cada aspecto, el resultado de una persona en un ejercicio de autoconocimiento (escrito en segunda persona y de tono íntimo). Tu trabajo es redactar un ESQUEMA para la empresa donde trabaja, que solo recoge lo que tiene relevancia laboral.

Para cada aspecto devuelve:
- titulo: un título breve y neutro (máximo 8 palabras), sin segunda persona ("Eres…", "Tu…").
- descripcion: 1 o 2 frases (máximo 45 palabras), en tercera persona neutra ("La persona…"), tono formal y cálido, sobre cómo se manifiesta este rasgo en el trabajo.
- aprovechar: 1 frase (máximo 25 palabras) sobre cómo la empresa puede aprovechar este rasgo.
- acompanar: 1 frase (máximo 25 palabras) sobre cómo el líder puede acompañar a la persona en este rasgo.

Reglas obligatorias:
- Habla solo de comportamiento y desempeño laboral. NO menciones vida personal, familia, infancia, pareja, salud física o mental, sanación, religión o espiritualidad, ni sexualidad, ni emociones íntimas. Si el resultado trata de eso, tradúcelo a su efecto en el trabajo (por ejemplo, "busca sentido en lo que hace") o deja la descripción sobria.
- Lenguaje neutro en género: no sabes cómo se identifica la persona. Evita "ella", "él", "la", "lo", "le" referidos a ella ("Integrarla", "Reconocerlo"); usa "la persona", "a esta persona" o construcciones impersonales ("Incluir a la persona en…", "Dar espacio para que comparta…").
- No copies frases del texto original: redáctalo con tus palabras.
- No califiques ni pongas notas, y no compares con otras personas.
- No uses diagnósticos ni etiquetas psicológicas.
- Devuelve un elemento por cada aspecto recibido, con el mismo nombre en "aspecto".`;

const HERRAMIENTA_ESQUEMA: Anthropic.Tool = {
  name: 'esquema_ser',
  description: 'Esquema laboral de los aspectos del Ser de una persona, para su empresa.',
  input_schema: {
    type: 'object',
    properties: {
      aspectos: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            aspecto: { type: 'string' },
            titulo: { type: 'string' },
            descripcion: { type: 'string' },
            aprovechar: { type: 'string' },
            acompanar: { type: 'string' },
          },
          required: ['aspecto', 'titulo', 'descripcion', 'aprovechar', 'acompanar'],
        },
      },
    },
    required: ['aspectos'],
  },
};

type FilaRedactada = { aspecto: string; titulo: string; descripcion: string; aprovechar: string; acompanar: string };

async function redactarLote(lote: AspectoGuia[]): Promise<FilaRedactada[]> {
  const entrada = lote
    .map((a) => `### ${a.nombre}\nTítulo original: ${a.titulo ?? '—'}\nTexto: ${a.fuente.descripcion}\nRecomendación: ${a.fuente.recomendacion}`)
    .join('\n\n');

  const respuesta = await clienteClaude().messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 3000,
    system: SYSTEM_ESQUEMA,
    tools: [HERRAMIENTA_ESQUEMA],
    tool_choice: { type: 'tool', name: HERRAMIENTA_ESQUEMA.name },
    messages: [{ role: 'user', content: entrada }],
  });
  if (respuesta.stop_reason === 'max_tokens') throw new Error('La redacción del esquema se cortó por límite de tokens.');
  return extraerToolUse<{ aspectos: FilaRedactada[] }>(respuesta, HERRAMIENTA_ESQUEMA.name).aspectos ?? [];
}

/**
 * Redacta el esquema en 3 lotes en paralelo (para caber en los 60 s de la función). Si un lote falla, sus aspectos quedan
 * solo con título y lectura —nunca con el texto de la Guía— y Talento Humano puede completarlos o se puede reintentar.
 */
export async function redactarEsquema(aspectos: AspectoGuia[]): Promise<AspectoEsquema[]> {
  const lotes: AspectoGuia[][] = [[], [], []];
  aspectos.forEach((a, i) => lotes[i % 3].push(a));

  const resultados = await Promise.all(
    lotes.map(async (lote) => {
      if (lote.length === 0) return [] as FilaRedactada[];
      try {
        return await redactarLote(lote);
      } catch (error) {
        console.error('No se pudo redactar un lote del esquema del Ser:', error);
        return [] as FilaRedactada[];
      }
    })
  );
  const porNombre = new Map(resultados.flat().map((f) => [f.aspecto, f]));

  return aspectos.map((a) => {
    const f = porNombre.get(a.nombre);
    const limpio = (v: string | undefined) => (v && v.trim() ? neutralizarGenero(v.trim()) : null);
    return {
      nombre: a.nombre,
      // Si no se pudo redactar, el título original (corto y sin contenido íntimo) es lo único que se conserva.
      titulo: limpio(f?.titulo) ?? a.titulo,
      enfoque: a.enfoque,
      descripcion: limpio(f?.descripcion),
      aprovechar: limpio(f?.aprovechar),
      acompanar: limpio(f?.acompanar),
    };
  });
}
