import { clienteClaude, extraerToolUse } from '../../claude/cliente';
import { construirPromptCarta } from './prompt';
import { construirPaginasCarta } from './plantilla';
import { cargarImagenes } from '../guia/imagenes';
import { htmlsAPdfUnido } from '../navegador';
import { ESQUEMA_CARTA } from './esquema';
import type { CartaCondensada } from './tipos';
import type { GuiaCondensada } from '../guia/tipos';

const MODELO = 'claude-sonnet-5';
// Iba en 4000: insuficiente para una Carta completa (portada + intro + 3
// cuestionamientos con 3 párrafos de respuesta cada uno) y sin margen de
// sobra -- se comprobó real con Valentina Solarte Bolaños (2026-09-03):
// Claude se quedó sin tokens a mitad del tool_use, "cuestionamiento_3"
// llegó sin "cierre_2", y eso reventó varios pasos después, en
// plantilla.ts, como "Cannot read properties of undefined (reading
// 'replace')" -- ver MAX_TOKENS en ../guia/generar.ts, mismo problema ya
// resuelto ahí antes.
const MAX_TOKENS = 8000;

/** Recorre CartaCondensada campo por campo y revienta con un mensaje claro
 * (qué campo, de qué sección) si algo llegó vacío/undefined -- sin esto,
 * un campo faltante (por corte de tokens o por una respuesta simplemente
 * incompleta de Claude) se cuela como un objeto "válido" y explota mucho
 * después, dentro de plantilla.ts, con un error genérico que no dice nada
 * de dónde vino. */
function exigirCartaCompleta(c: Partial<CartaCondensada>): asserts c is CartaCondensada {
  const faltante = (valor: unknown) => typeof valor !== 'string' || valor.trim() === '';

  if (faltante(c.frase_portada)) throw new Error('Claude no devolvió "frase_portada" (respuesta incompleta).');
  if (!c.intro || faltante(c.intro.parrafo_1) || faltante(c.intro.parrafo_2) || faltante(c.intro.parrafo_3)) {
    throw new Error('Claude no devolvió completo "intro" (respuesta incompleta).');
  }

  const revisarCuestionamiento = (clave: 'cuestionamiento_1' | 'cuestionamiento_2' | 'cuestionamiento_3', extras: string[]) => {
    const q = c[clave] as Record<string, unknown> | undefined;
    if (!q || faltante(q.pregunta) || !Array.isArray(q.respuesta) || q.respuesta.length !== 3 || q.respuesta.some(faltante)) {
      throw new Error(`Claude no devolvió completo "${clave}" (respuesta incompleta).`);
    }
    for (const extra of extras) {
      if (faltante(q[extra])) throw new Error(`Claude no devolvió "${clave}.${extra}" (respuesta incompleta).`);
    }
  };
  revisarCuestionamiento('cuestionamiento_1', ['cierre']);
  revisarCuestionamiento('cuestionamiento_2', ['pie_foto']);
  revisarCuestionamiento('cuestionamiento_3', ['cierre_1', 'cierre_2']);
}

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
    max_tokens: MAX_TOKENS,
    tools: [ESQUEMA_CARTA],
    tool_choice: { type: 'tool', name: ESQUEMA_CARTA.name },
    messages: [{ role: 'user', content: prompt }],
  });

  if (respuesta.stop_reason === 'max_tokens') {
    throw new Error(`Claude cortó la respuesta de la Carta por límite de tokens (max_tokens=${MAX_TOKENS}) -- quedó incompleta.`);
  }

  const extraido = extraerToolUse<Omit<CartaCondensada, 'nombre' | 'fecha'>>(respuesta, ESQUEMA_CARTA.name);
  const carta = { nombre: datos.nombre, fecha: datos.fecha, ...extraido };
  exigirCartaCompleta(carta);
  return carta;
}

/** Renderiza las 5 páginas de la Carta y las une en un solo PDF. */
export async function generarPdfCarta(carta: CartaCondensada): Promise<Buffer> {
  const imagenes = await cargarImagenes();
  const paginas = construirPaginasCarta(carta, imagenes);
  return htmlsAPdfUnido(paginas, { anchoPulgadas: 8.5, altoPulgadas: 11 });
}
