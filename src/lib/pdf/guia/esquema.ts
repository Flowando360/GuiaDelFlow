/**
 * JSON Schemas para las 4 llamadas paralelas que arman la Guía (ver
 * prompt.ts). Cada una fuerza tool-use — la API garantiza JSON válido
 * según el schema, a diferencia de pedirle "responde solo con JSON" en
 * texto libre (que se rompía ocasionalmente por comillas sin escapar en
 * el contenido que redacta el modelo).
 */
import type Anthropic from '@anthropic-ai/sdk';

const seccionGuia = {
  type: 'object',
  properties: {
    seccion: { type: 'string', description: 'Nombre exacto de la sección, tal cual se lo dieron.' },
    subtitulo: { type: 'string', description: 'Frase corta que resume la esencia de la sección.' },
    texto: { type: 'string', description: '3-4 oraciones condensadas, en segunda persona.' },
    recuerda_izq: { type: 'string', description: 'Recordatorio corto, máximo 2 oraciones.' },
    recuerda_der: { type: 'string', description: 'Recordatorio corto, máximo 2 oraciones.' },
  },
  required: ['seccion', 'subtitulo', 'texto', 'recuerda_izq', 'recuerda_der'],
};

export const ESQUEMA_TALENTOS: Anthropic.Tool = {
  name: 'entregar_talentos',
  description: 'Entrega el Talento Único y los Talentos Poderosos ya condensados, más la frase de cierre de toda la Guía.',
  input_schema: {
    type: 'object',
    properties: {
      talento_unico: {
        type: 'object',
        properties: {
          titulo_sello: { type: 'string', description: 'Frase potente, ej: Eres el visionario que nunca se detiene' },
          texto: { type: 'string', description: '3-4 oraciones' },
        },
        required: ['titulo_sello', 'texto'],
      },
      talentos: { type: 'array', items: seccionGuia },
      frase_cierre: {
        type: 'string',
        description:
          'UNA sola oración breve de cierre (máximo ~120 caracteres), no un párrafo — tiene que caber cómoda en una tarjeta de cierre.',
      },
    },
    required: ['talento_unico', 'talentos', 'frase_cierre'],
  },
};

function esquemaLista(name: string, campo: string, descripcion: string): Anthropic.Tool {
  return {
    name,
    description: descripcion,
    input_schema: {
      type: 'object',
      properties: { [campo]: { type: 'array', items: seccionGuia } },
      required: [campo],
    },
  };
}

export const ESQUEMA_EMOCIONES = esquemaLista('entregar_emociones', 'emociones', 'Entrega la sección Emociones ya condensada.');
export const ESQUEMA_PERTENENCIA = esquemaLista(
  'entregar_pertenencia',
  'pertenencia',
  'Entrega la sección Pertenencia y Compromiso ya condensada.'
);
export const ESQUEMA_DESAFIOS = esquemaLista('entregar_desafios', 'desafios', 'Entrega la sección Desafíos ya condensada.');
