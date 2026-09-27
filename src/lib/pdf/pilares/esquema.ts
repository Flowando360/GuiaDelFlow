import type Anthropic from '@anthropic-ai/sdk';

const pilarEscritoSchema = {
  type: 'object',
  properties: {
    nombre_pilar: { type: 'string', enum: ['Pertenencia', 'Propósito', 'Trascendencia', 'Narración'] },
    frase_ancla: { type: 'string', description: 'Frase corta, memorable y personalizada para este pilar (≤120 caracteres).' },
    reflexion: { type: 'string', description: 'Segunda persona, cálido, ~100 palabras, específico a sus respuestas.' },
  },
  required: ['nombre_pilar', 'frase_ancla', 'reflexion'],
};

export const ESQUEMA_PILARES: Anthropic.Tool = {
  name: 'entregar_pilares',
  description: 'Entrega el resultado de "Los 4 Pilares" ya redactado, listo para convertir en PDF de 7 páginas.',
  input_schema: {
    type: 'object',
    properties: {
      frase_portada: { type: 'string', description: 'Frase corta (≤140 caracteres), en cursiva, para la portada.' },
      introduccion: {
        type: 'object',
        properties: { parrafo_1: { type: 'string' }, parrafo_2: { type: 'string' } },
        required: ['parrafo_1', 'parrafo_2'],
      },
      pilares: {
        type: 'array',
        items: pilarEscritoSchema,
        minItems: 4,
        maxItems: 4,
        description: 'Exactamente 4, en este orden fijo: Pertenencia, Propósito, Trascendencia, Narración.',
      },
      historia_reescrita: {
        type: 'object',
        properties: {
          titulo: { type: 'string' },
          parrafo_1: { type: 'string' },
          parrafo_2: { type: 'string' },
          cierre: { type: 'string' },
        },
        required: ['titulo', 'parrafo_1', 'parrafo_2', 'cierre'],
      },
      invitacion_final: { type: 'string', description: '~60 palabras, cierre cálido, invitación suave sin presión.' },
      pilar_mas_vivo: {
        type: 'string',
        enum: ['Pertenencia', 'Propósito', 'Trascendencia', 'Narración'],
        description: 'El pilar que más viva esta persona hoy, a tu juicio como Flowi, según lo que escribió.',
      },
      explicacion_pilar_mas_visible: {
        type: 'string',
        description: '1-2 frases, cálidas, explicando por qué ese pilar se hizo visible en SUS respuestas concretas. Nunca digas "tu pilar más fuerte" ni "tu puntuación" ni "tú eres [pilar]".',
      },
      experimento_24h: {
        type: 'string',
        description: 'Una acción pequeña y realizable para las próximas 24 horas, personalizada con lo que escribió -- nunca una obligación ni un cambio de vida grande.',
      },
    },
    required: [
      'frase_portada',
      'introduccion',
      'pilares',
      'historia_reescrita',
      'invitacion_final',
      'pilar_mas_vivo',
      'explicacion_pilar_mas_visible',
      'experimento_24h',
    ],
  },
};
