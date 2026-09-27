import { clienteClaude, extraerToolUse } from '../../claude/cliente';
import { construirPromptPilares } from './prompt';
import { construirPaginasPilares } from './plantilla';
import { cargarImagenes } from '../guia/imagenes';
import { htmlsAPdfUnido } from '../navegador';
import { ESQUEMA_PILARES } from './esquema';
import type { PilaresCondensado, PilarEscrito } from './tipos';
import type { RespuestasClasificacion, RespuestasReflexiones, RespuestasHistoria } from '@/lib/pilares/contenido';

const MODELO = 'claude-sonnet-5';
// Mismo límite y misma razón que la Carta (ver src/lib/pdf/carta/generar.ts):
// 7 páginas con contenido similar en volumen a la Carta (5 páginas), con
// margen de sobra para no cortarse a mitad del tool_use.
const MAX_TOKENS = 8000;

/** Igual que exigirCartaCompleta en carta/generar.ts: revienta con un
 * mensaje claro de qué campo faltó, en vez de dejar pasar un objeto
 * incompleto que explota después, sin contexto, dentro de plantilla.ts. */
function exigirPilaresCompleto(c: Partial<PilaresCondensado>): asserts c is PilaresCondensado {
  const faltante = (valor: unknown) => typeof valor !== 'string' || valor.trim() === '';

  if (faltante(c.frase_portada)) throw new Error('Claude no devolvió "frase_portada" (respuesta incompleta).');
  if (!c.introduccion || faltante(c.introduccion.parrafo_1) || faltante(c.introduccion.parrafo_2)) {
    throw new Error('Claude no devolvió completo "introduccion" (respuesta incompleta).');
  }
  if (!Array.isArray(c.pilares) || c.pilares.length !== 4) {
    throw new Error('Claude no devolvió los 4 "pilares" (respuesta incompleta).');
  }
  c.pilares.forEach((p: Partial<PilarEscrito>, i: number) => {
    if (faltante(p.nombre_pilar) || faltante(p.frase_ancla) || faltante(p.reflexion)) {
      throw new Error(`Claude no devolvió completo el pilar #${i + 1} (respuesta incompleta).`);
    }
  });
  const h = c.historia_reescrita;
  if (!h || faltante(h.titulo) || faltante(h.parrafo_1) || faltante(h.parrafo_2) || faltante(h.cierre)) {
    throw new Error('Claude no devolvió completo "historia_reescrita" (respuesta incompleta).');
  }
  if (faltante(c.invitacion_final)) throw new Error('Claude no devolvió "invitacion_final" (respuesta incompleta).');
  if (faltante(c.pilar_mas_vivo)) throw new Error('Claude no devolvió "pilar_mas_vivo" (respuesta incompleta).');
  if (faltante(c.explicacion_pilar_mas_visible)) {
    throw new Error('Claude no devolvió "explicacion_pilar_mas_visible" (respuesta incompleta).');
  }
  if (faltante(c.experimento_24h)) throw new Error('Claude no devolvió "experimento_24h" (respuesta incompleta).');
}

export async function generarPilaresCondensado(datos: {
  nombre: string;
  fecha: string;
  clasificacion: RespuestasClasificacion;
  reflexiones: RespuestasReflexiones;
  historia: RespuestasHistoria;
}): Promise<PilaresCondensado> {
  const prompt = construirPromptPilares(datos);

  const respuesta = await clienteClaude().messages.create({
    model: MODELO,
    max_tokens: MAX_TOKENS,
    tools: [ESQUEMA_PILARES],
    tool_choice: { type: 'tool', name: ESQUEMA_PILARES.name },
    messages: [{ role: 'user', content: prompt }],
  });

  if (respuesta.stop_reason === 'max_tokens') {
    throw new Error(`Claude cortó la respuesta de "Los 4 Pilares" por límite de tokens (max_tokens=${MAX_TOKENS}) -- quedó incompleta.`);
  }

  const extraido = extraerToolUse<Omit<PilaresCondensado, 'nombre' | 'fecha'>>(respuesta, ESQUEMA_PILARES.name);
  const pilares = { nombre: datos.nombre, fecha: datos.fecha, ...extraido };
  exigirPilaresCompleto(pilares);
  return pilares;
}

/** Renderiza las 7 páginas y las une en un solo PDF. */
export async function generarPdfPilares(condensado: PilaresCondensado): Promise<Buffer> {
  const imagenes = await cargarImagenes();
  const paginas = construirPaginasPilares(condensado, imagenes);
  return htmlsAPdfUnido(paginas, { anchoPulgadas: 8.5, altoPulgadas: 11 });
}
