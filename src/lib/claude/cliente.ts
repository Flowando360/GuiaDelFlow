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

/** Extrae el bloque de texto de la respuesta y parsea el JSON (limpiando fences de markdown si Claude los agrega). */
export function parsearJsonDeRespuesta<T>(respuesta: Anthropic.Message): T {
  const bloqueTexto = respuesta.content.find((b) => b.type === 'text');
  if (!bloqueTexto || bloqueTexto.type !== 'text') {
    throw new Error('Claude no devolvió un bloque de texto.');
  }

  let crudo = bloqueTexto.text.trim();
  if (crudo.startsWith('```')) {
    crudo = crudo.replace(/^```[a-z]*\n?/i, '').replace(/```\s*$/, '');
  }

  try {
    return JSON.parse(crudo) as T;
  } catch (error) {
    throw new Error(`No se pudo parsear el JSON de Claude: ${(error as Error).message}\n\n${crudo.slice(0, 500)}`);
  }
}
