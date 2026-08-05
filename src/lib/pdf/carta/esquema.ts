import type Anthropic from '@anthropic-ai/sdk';

const cuestionamientoBase = {
  pregunta: { type: 'string' },
  respuesta: {
    type: 'array',
    items: { type: 'string' },
    minItems: 3,
    maxItems: 3,
    description: 'Exactamente 3 párrafos de respuesta, conectados con la Guía real de la persona.',
  },
};

export const ESQUEMA_CARTA: Anthropic.Tool = {
  name: 'entregar_carta',
  description: 'Entrega la Carta personal ya redactada, lista para convertir en PDF de 5 páginas.',
  input_schema: {
    type: 'object',
    properties: {
      frase_portada: { type: 'string', description: 'Frase corta (máx ~140 caracteres) para la portada, en cursiva.' },
      intro: {
        type: 'object',
        properties: {
          parrafo_1: { type: 'string' },
          parrafo_2: { type: 'string' },
          parrafo_3: { type: 'string' },
        },
        required: ['parrafo_1', 'parrafo_2', 'parrafo_3'],
      },
      cuestionamiento_1: {
        type: 'object',
        properties: { ...cuestionamientoBase, cierre: { type: 'string' } },
        required: ['pregunta', 'respuesta', 'cierre'],
      },
      cuestionamiento_2: {
        type: 'object',
        properties: { ...cuestionamientoBase, pie_foto: { type: 'string' } },
        required: ['pregunta', 'respuesta', 'pie_foto'],
      },
      cuestionamiento_3: {
        type: 'object',
        properties: { ...cuestionamientoBase, cierre_1: { type: 'string' }, cierre_2: { type: 'string' } },
        required: ['pregunta', 'respuesta', 'cierre_1', 'cierre_2'],
      },
    },
    required: ['frase_portada', 'intro', 'cuestionamiento_1', 'cuestionamiento_2', 'cuestionamiento_3'],
  },
};
