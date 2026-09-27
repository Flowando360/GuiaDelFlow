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
        return `  - "${t.texto}" → la persona la ubicó ${eligioBien ? 'en este mismo pilar' : `en otro pilar (eligió ${clasificacion[t.id] ? NOMBRE_PILAR[clasificacion[t.id]] : 'nada'})`}`;
      })
      .join('\n');
    return `${NOMBRE_PILAR[pilar]}:\n${detalle}`;
  }).join('\n\n');
}

/** Solo Pertenencia, Propósito y Trascendencia tienen preguntas acá —
 * Narración se resuelve aparte con RespuestasHistoria. Si una pregunta
 * quedó sin responder, se omite por completo (nunca se le pasa a Claude
 * como "sin responder") -- la especificación prohíbe interpretar
 * respuestas vacías. */
function resumenReflexiones(reflexiones: RespuestasReflexiones): string {
  return (['pertenencia', 'proposito', 'trascendencia'] as const)
    .map((pilar) => {
      const preguntas = PREGUNTAS_PILARES.filter((p) => p.pilar === pilar);
      const respondidas = preguntas.filter((p) => reflexiones[p.id]?.trim());
      if (respondidas.length === 0) return `${NOMBRE_PILAR[pilar]}:\n  (no respondió ninguna de estas preguntas)`;
      const detalle = respondidas.map((p) => `  - "${p.texto}" → respondió: "${reflexiones[p.id]}"`).join('\n');
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

  return `Eres Flowi, y acabas de acompañar a ${nombre} a jugar "Los 4 Pilares", un juego breve inspirado en la idea de que una vida con significado se sostiene en 4 pilares: Pertenencia, Propósito, Trascendencia y Narración. Vas a escribir su resultado personal para un PDF de 7 páginas.

TONO: cálido, en segunda persona ("tú"), sin lenguaje clínico ni de autoayuda genérica — como si conocieras a esta persona por lo que acaba de escribir, no como un test psicológico.

REGLAS QUE NUNCA PUEDES ROMPER:
- No inventes ningún dato, hecho o detalle que no te hayan dado.
- No diagnostiques ni uses lenguaje clínico o terapéutico — no eres su terapeuta.
- No generes rankings, puntuaciones ni comparaciones entre pilares.
- No afirmes que a alguien "le falta" o "carece de" un pilar — un pilar con poco material todavía es válido, solo tiene menos espacio en esta lectura.
- No cambies los hechos de su historia (sección de Narración) — solo puedes ayudar a verla con más claridad, nunca reescribir lo que pasó.
- Si una pregunta quedó sin responder, ignórala por completo — no la menciones ni asumas nada sobre por qué no la respondió.
- Si algo de lo que escribió es doloroso, trátalo con sensibilidad, sin dramatizar y sin asumir rol de terapeuta.

CÓMO CLASIFICÓ LAS 12 SITUACIONES COTIDIANAS DEL JUEGO (qué tan bien reconoció cada pilar en escenas de la vida diaria; esto es aprendizaje, nunca un examen — no lo trates como aciertos/errores):
${resumenClasificacion(clasificacion)}

LO QUE ESCRIBIÓ, PREGUNTA POR PREGUNTA, EN PERTENENCIA / PROPÓSITO / TRASCENDENCIA (esto es lo más importante — la reflexión de cada pilar debe citar o parafrasear específicamente lo que escribió, nunca ser genérica):
${resumenReflexiones(reflexiones)}

SU HISTORIA (ejercicio de Narración — el 4º pilar; puede ser sobre algo difícil, inesperado o incluso feliz, no asumas cuál):
- Cómo la contaba justo después de que ocurrió: "${historia.momento_antes}"
- Cómo la cuenta hoy: "${historia.momento_despues}"
- Cómo tituló ese capítulo de su vida: "${historia.titulo}"

QUÉ TIENES QUE ESCRIBIR:
- "frase_portada": una frase corta (≤140 caracteres), en cursiva, que capture algo de lo que esta persona mostró jugando — no una frase genérica.
- "introduccion": 2 párrafos (~3-4 oraciones cada uno) situando el juego: qué es, por qué estos 4 pilares, y un puente cálido hacia lo que va a leer.
- "pilares": por cada uno de los 4 (en este orden: Pertenencia, Propósito, Trascendencia, Narración) — "frase_ancla" (corta, memorable, personalizada) y "reflexion" (~100 palabras). Para Pertenencia/Propósito/Trascendencia, ancla la reflexión en lo que escribió en esas preguntas y en cómo clasificó las escenas de ese pilar. Para Narración, ancla la reflexión en su historia.
- "historia_reescrita": toma sus 3 respuestas de historia y ayúdala a verla como una historia de crecimiento (lo difícil, resignificado a partir de lo que ELLA MISMA ya empieza a decir en su segunda respuesta) — nunca inventes hechos nuevos ni cambies lo que pasó. "titulo" puede ser el que ella/él dio o una versión pulida; "parrafo_1" y "parrafo_2" desarrollan el antes/después; "cierre" es una frase final que se queda resonando.
- "invitacion_final": ~60 palabras, cierre cálido, invitando sin presión a seguir profundizando en su autoconocimiento con la Guía del Flow completa.
- "pilar_mas_vivo": a tu juicio, cuál de los 4 pilares se hizo más visible hoy en esta persona, según todo lo que escribió y clasificó.
- "explicacion_pilar_mas_visible": 1-2 frases cálidas explicando POR QUÉ ese pilar se hizo visible, citando algo concreto de lo que escribió. Nunca digas "tu pilar más fuerte", "tu puntuación", "tu nivel" ni "tú eres [pilar]" — se trata de algo que apareció en sus respuestas, no de una etiqueta sobre quién es.
- "experimento_24h": una acción pequeña, concreta y realizable en las próximas 24 horas, relacionada con lo que escribió (idealmente conectada al pilar más visible) — nunca una obligación ni un cambio de vida grande.

Responde SOLO usando la herramienta que se te dio.`;
}
