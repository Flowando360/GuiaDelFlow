import { clienteClaude, extraerToolUse } from '../../claude/cliente';
import { construirPromptCarta } from './prompt';
import { construirPaginasCarta } from './plantilla';
import { cargarImagenes } from '../guia/imagenes';
import { htmlsAPdfUnido } from '../navegador';
import { ESQUEMA_CARTA } from './esquema';
import type { CartaCondensada } from './tipos';
import type { GuiaCondensada } from '../guia/tipos';

const MODELO = 'claude-sonnet-5';

export async function generarCartaCondensada(datos: {
  nombre: string;
  fecha: string;
  razon: string;
  cuestionamiento1: string;
  cuestionamiento2: string;
  cuestionamiento3: string;
  guia: GuiaCondensada;
}): Promise<CartaCondensada> {
  const prompt = construirPromptCarta(datos);

  const respuesta = await clienteClaude().messages.create({
    model: MODELO,
    max_tokens: 4000,
    tools: [ESQUEMA_CARTA],
    tool_choice: { type: 'tool', name: ESQUEMA_CARTA.name },
    messages: [{ role: 'user', content: prompt }],
  });

  const extraido = extraerToolUse<Omit<CartaCondensada, 'nombre' | 'fecha'>>(respuesta, ESQUEMA_CARTA.name);
  return { nombre: datos.nombre, fecha: datos.fecha, ...extraido };
}

/** Renderiza las 5 páginas de la Carta y las une en un solo PDF. */
export async function generarPdfCarta(carta: CartaCondensada): Promise<Buffer> {
  const imagenes = await cargarImagenes();
  const paginas = construirPaginasCarta(carta, imagenes);
  return htmlsAPdfUnido(paginas, { anchoPulgadas: 8.5, altoPulgadas: 11 });
}
