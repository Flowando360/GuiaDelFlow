import type Anthropic from '@anthropic-ai/sdk';
import { clienteClaude, extraerToolUse } from '../../claude/cliente';
import { promptTalentos, promptEmociones, promptPertenencia, promptDesafios } from './prompt';
import { construirHtmlGuia } from './plantilla';
import { cargarImagenes } from './imagenes';
import { htmlAPdf } from '../navegador';
import { ESQUEMA_TALENTOS, ESQUEMA_EMOCIONES, ESQUEMA_PERTENENCIA, ESQUEMA_DESAFIOS } from './esquema';
import type { GuiaCondensada, SeccionGuia } from './tipos';
import type { ResultadosCalculados } from '../../calculo/tipos';

const MODELO = 'claude-sonnet-5';
const MAX_TOKENS = 8000; // cada llamada ahora es un capítulo, no la Guía entera

async function llamarClaude<T>(prompt: string, tool: Anthropic.Tool): Promise<T> {
  const respuesta = await clienteClaude().messages.create({
    model: MODELO,
    max_tokens: MAX_TOKENS,
    tools: [tool],
    tool_choice: { type: 'tool', name: tool.name },
    messages: [{ role: 'user', content: prompt }],
  });

  // Si Claude se quedó sin tokens a mitad del tool_use (capítulo largo,
  // ej. Talentos con muchos ítems), el JSON queda incompleto — algunos
  // campos requeridos del schema (típicamente el array, que va al final)
  // simplemente no llegan. Sin este chequeo, eso se cuela como un objeto
  // "válido" con campos undefined y explota después, más abajo, con un
  // error genérico tipo "Cannot read properties of undefined (reading
  // 'length')" en plantilla.ts — ya con la llamada (y su costo) hecha y
  // sin pista de qué pasó. Fallar acá, con el motivo claro, deja el mismo
  // costo ya gastado pero al menos identificable en error_detalle.
  if (respuesta.stop_reason === 'max_tokens') {
    throw new Error(
      `Claude cortó la respuesta de "${tool.name}" por límite de tokens (max_tokens=${MAX_TOKENS}) — el capítulo quedó incompleto.`
    );
  }

  return corregirCamposStringificados(extraerToolUse<Record<string, unknown>>(respuesta, tool.name)) as T;
}

/** Revienta con un mensaje claro (campo + capítulo) si el array esperado no llegó completo. */
function exigirArrayNoVacio(valor: unknown, campo: string, capitulo: string): asserts valor is SeccionGuia[] {
  if (!Array.isArray(valor) || valor.length === 0) {
    throw new Error(`Claude no devolvió "${campo}" en "${capitulo}" (respuesta incompleta o malformada).`);
  }
}

/**
 * A veces, con arrays grandes, Claude devuelve un campo del tool_use como
 * texto JSON en vez de la estructura nativa que pide el schema (ej.
 * `desafios: "{\"desafios\": [...]}"` en vez de `desafios: [...]`). Esto
 * repara ambos casos: campo = JSON de un array, o campo = JSON de un
 * objeto que a su vez tiene ese mismo campo adentro.
 */
function corregirCamposStringificados(obj: Record<string, unknown>): Record<string, unknown> {
  const resultado: Record<string, unknown> = { ...obj };
  for (const [clave, valor] of Object.entries(resultado)) {
    if (typeof valor !== 'string') continue;
    try {
      const parseado = JSON.parse(valor);
      resultado[clave] = Array.isArray(parseado) ? parseado : (parseado?.[clave] ?? parseado);
    } catch {
      // era un string de verdad (ej. frase_cierre), se deja como está
    }
  }
  return resultado;
}

/**
 * Le pide a Claude que condense los aspectos ya calculados en la Guía.
 * Se hace en 4 llamadas EN PARALELO (una por capítulo) en vez de una
 * sola — la versión de una sola llamada tardaba 80-100s, más que el
 * límite de 60s de las funciones de Vercel en el plan Hobby. Así, el
 * tiempo total es el de la llamada más lenta (normalmente Talentos, el
 * capítulo más grande), no la suma de las 4.
 */
export async function generarGuiaCondensada(datos: {
  nombre: string;
  fecha: string;
  origen: string;
  resultados: ResultadosCalculados;
}): Promise<GuiaCondensada> {
  const { nombre, fecha, origen, resultados } = datos;

  const [talentos, emociones, pertenencia, desafios] = await Promise.all([
    llamarClaude<{ talento_unico: GuiaCondensada['talento_unico']; talentos: SeccionGuia[]; frase_cierre: string }>(
      promptTalentos(nombre, resultados),
      ESQUEMA_TALENTOS
    ),
    llamarClaude<{ emociones: SeccionGuia[] }>(promptEmociones(nombre, resultados), ESQUEMA_EMOCIONES),
    llamarClaude<{ pertenencia: SeccionGuia[] }>(promptPertenencia(nombre, resultados), ESQUEMA_PERTENENCIA),
    llamarClaude<{ desafios: SeccionGuia[] }>(promptDesafios(nombre, resultados), ESQUEMA_DESAFIOS),
  ]);

  // Las 4 llamadas ya se hicieron (y ya se cobraron) — validar acá, antes
  // de construir el PDF, para que si algo vino incompleto el error diga
  // exactamente cuál capítulo y campo falló, en vez de un genérico
  // "Cannot read properties of undefined (reading 'length')" varios pasos
  // después en plantilla.ts.
  exigirArrayNoVacio(talentos.talentos, 'talentos', 'Talentos');
  exigirArrayNoVacio(emociones.emociones, 'emociones', 'Emociones');
  exigirArrayNoVacio(pertenencia.pertenencia, 'pertenencia', 'Pertenencia');
  exigirArrayNoVacio(desafios.desafios, 'desafios', 'Desafíos');

  return {
    nombre,
    fecha,
    origen,
    talento_unico: talentos.talento_unico,
    talentos: talentos.talentos,
    frase_cierre: talentos.frase_cierre,
    emociones: emociones.emociones,
    pertenencia: pertenencia.pertenencia,
    desafios: desafios.desafios,
  };
}

/** Renderiza el PDF de la Guía a partir del JSON ya condensado. */
export async function generarPdfGuia(guia: GuiaCondensada): Promise<Buffer> {
  const imagenes = await cargarImagenes();
  const html = construirHtmlGuia(guia, imagenes);
  return htmlAPdf(html, { anchoPulgadas: 5.5, altoPulgadas: 8.5 });
}
