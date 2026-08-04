import { clienteClaude, parsearJsonDeRespuesta } from '../../claude/cliente';
import { construirPromptGuia } from './prompt';
import { construirHtmlGuia } from './plantilla';
import { cargarImagenes } from './imagenes';
import { htmlAPdf } from '../navegador';
import type { GuiaCondensada } from './tipos';
import type { ResultadosCalculados } from '../../calculo/tipos';

const MODELO = 'claude-sonnet-5';

/** Le pide a Claude que condense los aspectos ya calculados en el JSON que arma la Guía. */
export async function generarGuiaCondensada(datos: {
  nombre: string;
  fecha: string;
  origen: string;
  resultados: ResultadosCalculados;
}): Promise<GuiaCondensada> {
  const prompt = construirPromptGuia(datos);

  const respuesta = await clienteClaude().messages.create({
    model: MODELO,
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  });

  return parsearJsonDeRespuesta<GuiaCondensada>(respuesta);
}

/** Renderiza el PDF de la Guía a partir del JSON ya condensado. */
export async function generarPdfGuia(guia: GuiaCondensada): Promise<Buffer> {
  const imagenes = await cargarImagenes();
  const html = construirHtmlGuia(guia, imagenes);
  return htmlAPdf(html, { anchoPulgadas: 5.5, altoPulgadas: 8.5 });
}
