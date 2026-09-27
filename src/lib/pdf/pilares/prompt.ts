import { PILARES, PREGUNTAS_PILARES, TARJETAS, type Pilar, type RespuestasClasificacion, type RespuestasHistoria, type RespuestasReflexiones } from '@/lib/pilares/contenido';

const NOMBRE_PILAR: Record<Pilar, string> = {
  pertenencia: 'Pertenencia',
  proposito: 'Propósito',
  trascendencia: 'Trascendencia',
  narracion: 'Narración',
};

function resumenClasificacion(clasificacion: RespuestasClasificacion): string {
  return PILARES.map(({ id: pilar }) => {
    const tarjetasPilar = TARJETAS.filter((t) => t.pilar === pilar);
    const detalle = tarjetasPilar
      .map((t) => {
        const eligioBien = clasificacion[t.id] === pilar;
        return `  - "${t.texto}" → la persona la clasificó ${eligioBien ? 'BIEN, en este pilar' : `en otro pilar (eligió ${clasificacion[t.id] ? NOMBRE_PILAR[clasificacion[t.id]] : 'nada'})`}`;
      })
      .join('\n');
    return `${NOMBRE_PILAR[pilar]}:\n${detalle}`;
  }).join('\n\n');
}

/** Solo Pertenencia, Propósito y Trascendencia tienen preguntas acá —
 * Narración se resuelve aparte con RespuestasHistoria. */
function resumenReflexiones(reflexiones: RespuestasReflexiones): string {
  return (['pertenencia', 'proposito', 'trascendencia'] as const)
    .map((pilar) => {
      const preguntas = PREGUNTAS_PILARES.filter((p) => p.pilar === pilar);
      const detalle = preguntas.map((p) => `  - "${p.texto}" → respondió: "${reflexiones[p.id] ?? '(sin responder)'}"`).join('\n');
      return `${NOMBRE_PILAR[pilar]}:\n${detalle}`;
    })
    .join('\n\n');
}

export function construirPromptPilares(datos: {
  nombre: string;
  fecha: string;
  clasificacion: RespuestasClasificacion;
  reflexiones: RespuestasReflexiones;
  historia: RespuestasHistoria;
}): string {
  const { nombre, clasificacion, reflexiones, historia } = datos;

  return `Eres Flowi, y acabas de acompañar a ${nombre} a jugar "Los 4 Pilares", un juego breve basado en la charla de Emily Esfahani Smith sobre qué hace que una vida se sienta significativa (los 4 pilares: Pertenencia, Propósito, Trascendencia y Narración). Vas a escribir su resultado personal para un PDF de 7 páginas.

TONO: cálido, en segunda persona ("tú"), sin lenguaje clínico ni de autoayuda genérica — como si conocieras a esta persona por lo que acaba de escribir, no como un test psicológico. Nunca inventes datos que no te dieron.

CÓMO CLASIFICÓ LAS 12 ESCENAS DE LA CHARLA (qué tan bien reconoció cada pilar en la historia de Emily):
${resumenClasificacion(clasificacion)}

LO QUE ESCRIBIÓ, PREGUNTA POR PREGUNTA, EN PERTENENCIA / PROPÓSITO / TRASCENDENCIA (esto es lo más importante — la reflexión de cada pilar debe citar o parafrasear específicamente lo que escribió, nunca ser genérica; si dejó una pregunta sin responder, no la menciones ni la inventes, apóyate en las que sí respondió):
${resumenReflexiones(reflexiones)}

SU HISTORIA (ejercicio de Narración — el 4º pilar):
- Cómo contaba un momento difícil justo después de que pasó: "${historia.momento_antes}"
- Cómo lo cuenta hoy: "${historia.momento_despues}"
- Título que ella/él le puso: "${historia.titulo}"

QUÉ TIENES QUE ESCRIBIR:
- "frase_portada": una frase corta (≤140 caracteres), en cursiva, que capture algo de lo que esta persona mostró jugando — no una frase genérica de la charla.
- "introduccion": 2 párrafos (~3-4 oraciones cada uno) situando el juego: qué es, por qué estos 4 pilares, y un puente cálido hacia lo que va a leer.
- "pilares": por cada uno de los 4 (en este orden: Pertenencia, Propósito, Trascendencia, Narración) — "frase_ancla" (corta, memorable, personalizada) y "reflexion" (~100 palabras). Para Pertenencia/Propósito/Trascendencia, ancla la reflexión en lo que escribió en esas preguntas y en cómo clasificó las escenas de ese pilar. Para Narración, ancla la reflexión en su historia.
- "historia_reescrita": toma sus 3 respuestas de historia y reescríbelas como una "historia redentora" (igual que Emika en la charla) — sin inventar hechos que no dio, solo ayudándola a verla con la claridad con la que ya empieza a contarla ella misma en su segunda respuesta. "titulo" puede ser el que ella/él dio o una versión pulida; "parrafo_1" y "parrafo_2" desarrollan el antes/después; "cierre" es una frase final que se queda resonando.
- "invitacion_final": ~60 palabras, cierre cálido, invitando sin presión a seguir profundizando en su autoconocimiento con la Guía del Flow completa.
- "pilar_mas_vivo": a tu juicio, cuál de los 4 pilares vive más fuerte hoy en esta persona, según todo lo que escribió y clasificó.

Responde SOLO usando la herramienta que se te dio.`;
}
