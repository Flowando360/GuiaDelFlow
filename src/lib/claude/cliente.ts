import Anthropic from '@anthropic-ai/sdk';

let cliente: Anthropic | null = null;

/** Cliente de Anthropic, con la API key propia de la app (no la suscripción de Claude Code). */
export function clienteClaude(): Anthropic {
  if (!cliente) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Falta configurar ANTHROPIC_API_KEY.');
    }
    cliente = new Anthropic({ apiKey });
  }
  return cliente;
}

/**
 * Extrae el input de un bloque tool_use — la forma preferida de pedirle
 * JSON estructurado a Claude: la API garantiza que sea JSON válido según
 * el schema (a diferencia de pedirle "responde solo con JSON" en texto
 * libre, que puede romperse por comillas sin escapar en el contenido).
 */
export function extraerToolUse<T>(respuesta: Anthropic.Message, nombreHerramienta: string): T {
  const bloque = respuesta.content.find((b) => b.type === 'tool_use' && b.name === nombreHerramienta);
  if (!bloque || bloque.type !== 'tool_use') {
    throw new Error(
      `Claude no devolvió el tool_use "${nombreHerramienta}". stop_reason=${respuesta.stop_reason}, tipos de contenido=${respuesta.content.map((b) => b.type).join(',')}`
    );
  }
  return bloque.input as T;
}

/** Extrae el bloque de texto de la respuesta y parsea el JSON (limpiando fences de markdown si Claude los agrega). */
export function parsearJsonDeRespuesta<T>(respuesta: Anthropic.Message): T {
  const bloqueTexto = respuesta.content.find((b) => b.type === 'text');
  if (!bloqueTexto || bloqueTexto.type !== 'text') {
    throw new Error(
      `Claude no devolvió un bloque de texto. stop_reason=${respuesta.stop_reason}, tipos de contenido=${respuesta.content.map((b) => b.type).join(',')}, respuesta=${JSON.stringify(respuesta).slice(0, 1500)}`
    );
  }

  let crudo = bloqueTexto.text.trim();
  if (crudo.startsWith('```')) {
    crudo = crudo.replace(/^```[a-z]*\n?/i, '').replace(/```\s*$/, '');
  }

  try {
    return JSON.parse(crudo) as T;
  } catch (error) {
    throw new Error(
      `No se pudo parsear el JSON de Claude: ${(error as Error).message}\nstop_reason=${respuesta.stop_reason}, largo del texto=${crudo.length} caracteres, usage=${JSON.stringify(respuesta.usage)}\n\nÚltimos 300 caracteres: ${crudo.slice(-300)}`
    );
  }
}
