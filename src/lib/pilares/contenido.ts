/**
 * Contenido fijo de "Los 4 Pilares" — el marco de los 4 pilares (Pertenencia,
 * Propósito, Trascendencia, Narración) está inspirado en la charla TEDx de
 * Emily Esfahani Smith, "Los cuatro pilares de una vida con significado".
 * Las 12 escenas de clasificación son escenarios cotidianos INVENTADOS para
 * este juego -- ninguno reproduce ni parafrasea las anécdotas puntuales que
 * ella cuenta en su charla (a propósito, para no rayar en derechos de
 * autor sobre su expresión concreta; el marco conceptual de los 4 pilares
 * no es lo mismo que sus historias). Ver Diseno-Juego-4-Pilares.md (repo
 * espiralcrecimiento360) para el diseño original, y
 * Especificacion_Juego_4_Pilares_FlowAndo.docx (mismo repo) para la
 * especificación v1.0 (27/09/2026) con la que se reescribió el flujo:
 * correo solo al final, feedback sin correcto/incorrecto, ronda 2 dividida
 * en una mini-experiencia por pilar, y experimento de 24h al cierre.
 */

export type Pilar = 'pertenencia' | 'proposito' | 'trascendencia' | 'narracion';

export const PILARES: { id: Pilar; nombre: string; icono: string; pregunta_esencial: string }[] = [
  { id: 'pertenencia', nombre: 'Pertenencia', icono: '🫂', pregunta_esencial: '¿Con quién y dónde siento que pertenezco de verdad?' },
  { id: 'proposito', nombre: 'Propósito', icono: '🎯', pregunta_esencial: '¿Para quién o para qué estoy usando lo que tengo?' },
  { id: 'trascendencia', nombre: 'Trascendencia', icono: '✨', pregunta_esencial: '¿Qué me conecta con algo más grande que yo?' },
  { id: 'narracion', nombre: 'Narración', icono: '📖', pregunta_esencial: '¿Qué historia estoy construyendo con lo que me ha pasado?' },
];

export interface Tarjeta {
  id: string;
  texto: string;
  pilar: Pilar;
  feedback: string;
}

/** Ejercicio 1 — clasificación. 3 tarjetas por pilar, orden mezclado a propósito. */
export const TARJETAS: Tarjeta[] = [
  {
    id: 't1',
    texto: 'Cada mañana antes de llegar a la oficina, Juan desayuna en el puesto de arepas de la esquina. No es solo comprar algo rápido: se detiene a preguntarle a doña Marta cómo amaneció, y ella ya sabe cómo le gusta el tinto.',
    pilar: 'pertenencia',
    feedback: 'La pertenencia vive en esos momentos pequeños entre personas — es una elección, no una casualidad.',
  },
  {
    id: 't2',
    texto: 'Una enfermera de turno de noche dice que su trabajo no es solo aplicar medicamentos a tiempo, sino que cada paciente sienta que alguien de verdad está pendiente de él.',
    pilar: 'proposito',
    feedback: 'El propósito no depende del cargo — depende de a quién sirves con lo que haces.',
  },
  {
    id: 't3',
    texto: 'Un grupo de amigos sube a caminar a la montaña un domingo, y al llegar arriba se quedan un rato en silencio mirando el paisaje, sintiendo que sus problemas se ven más pequeños desde ahí.',
    pilar: 'trascendencia',
    feedback: 'Basta un instante en que tu ego se achica para que algo en ti cambie.',
  },
  {
    id: 't4',
    texto: 'Andrés perdió su negocio en la pandemia. Por mucho tiempo se repetía: "yo era alguien exitoso, y ahora no soy nadie". Hoy dice: "esa quiebra me enseñó a valorar lo que de verdad importa, y desde ahí empecé de nuevo siendo más honesto conmigo mismo".',
    pilar: 'narracion',
    feedback: 'Los hechos no cambiaron. La historia que se contó a sí mismo, sí.',
  },
  {
    id: 't5',
    texto: 'Contestar el chat de la oficina mientras tu pareja te está contando algo importante, o saludar de pasada a alguien conocido sin mirarlo realmente a los ojos.',
    pilar: 'pertenencia',
    feedback: 'Son rechazos pequeños que casi nadie nota — pero le quitan valor al otro.',
  },
  {
    id: 't6',
    texto: 'Muchas mamás y papás dicen: "mi propósito ahora es sacar adelante a mis hijos", aunque eso signifique turnos dobles y noches cortas.',
    pilar: 'proposito',
    feedback: 'El propósito tiene menos que ver con lo que quieres, y más con lo que das.',
  },
  {
    id: 't7',
    texto: 'A Camila se le va el tiempo sin darse cuenta cuando pinta — empieza a las tres de la tarde convencida de que lleva diez minutos, y de repente ya oscureció.',
    pilar: 'trascendencia',
    feedback: 'La trascendencia no siempre es mística — a veces es solo perderte en lo que haces.',
  },
  {
    id: 't8',
    texto: 'A la abuela de Valentina la operaron de urgencia. Lo último que alcanzó a pensar antes de la anestesia fue el nombre de sus nietos — eso, dijo después, fue lo que la hizo aferrarse a despertar.',
    pilar: 'narracion',
    feedback: 'En ese momento, esa fue su historia de para qué vivir.',
  },
  {
    id: 't9',
    texto: 'Hay grupos de amigos que solo te aceptan de verdad si opinas igual que ellos en todo. La pertenencia real nace de que te valoren siendo distinto, no de estar siempre de acuerdo.',
    pilar: 'pertenencia',
    feedback: 'Vale la pena distinguir entre pertenecer y solo encajar.',
  },
  {
    id: 't10',
    texto: 'Cuando alguien lleva meses buscando trabajo sin conseguirlo, no solo le hace falta el ingreso — también extraña sentirse útil para algo o para alguien.',
    pilar: 'proposito',
    feedback: 'Sin algo valioso que hacer, las personas se desorientan.',
  },
  {
    id: 't11',
    texto: 'Para algunos la trascendencia llega bailando hasta perder la cuenta del tiempo; para otros, en silencio, rezando con la abuela los domingos.',
    pilar: 'trascendencia',
    feedback: 'El lugar cambia de persona a persona; la sensación de conectarse con algo más grande, no.',
  },
  {
    id: 't12',
    texto: 'Las personas que sienten que su vida tiene sentido no son las que nunca han sufrido — son las que aprendieron a contar lo malo como parte de algo que las hizo crecer.',
    pilar: 'narracion',
    feedback: 'No se trata de que te hayan pasado cosas buenas — se trata de cómo las cuentas.',
  },
];

export interface PreguntaPilar {
  id: string;
  pilar: Pilar;
  texto: string;
}

/**
 * Ejercicio 2 — preguntas cortas de autoindagación, para responder por
 * escrito (no calificar en una escala). 3 por pilar, solo para Pertenencia,
 * Propósito y Trascendencia -- Narración tiene su propio ejercicio 3 (ver
 * PROMPTS_HISTORIA), así que no se repite acá.
 */
export const PREGUNTAS_PILARES: PreguntaPilar[] = [
  { id: 'p1', pilar: 'pertenencia', texto: '¿Con quién sientes que puedes ser tú mismo/a, sin esforzarte?' },
  { id: 'p2', pilar: 'pertenencia', texto: '¿Cuándo fue la última vez que te sentiste realmente escuchado/a por alguien?' },
  { id: 'p3', pilar: 'pertenencia', texto: '¿A qué familia, equipo o comunidad sientes que perteneces de verdad hoy?' },
  { id: 'pr1', pilar: 'proposito', texto: '¿Para quién o para qué estás usando tus fortalezas en este momento de tu vida?' },
  { id: 'pr2', pilar: 'proposito', texto: 'Si dejaras de hacer lo que haces hoy, ¿qué se quedaría sin hacer?' },
  { id: 'pr3', pilar: 'proposito', texto: '¿Qué necesitarías para sentir que tu día a día tiene un "para qué" más claro?' },
  { id: 't1p', pilar: 'trascendencia', texto: '¿Cuándo fue la última vez que perdiste por completo la noción del tiempo haciendo algo?' },
  { id: 't2p', pilar: 'trascendencia', texto: '¿Qué actividad, lugar o momento te hace sentir parte de algo más grande que tú?' },
  { id: 't3p', pilar: 'trascendencia', texto: '¿Cuándo fue la última vez que de verdad bajaste el ritmo, aunque fuera un momento?' },
];

/** Ejercicio 3 — narración guiada (3 respuestas cortas). */
export const PROMPTS_HISTORIA = {
  momento_antes:
    'Piensa en una situación que te haya cambiado. Puede haber sido difícil, inesperada, dolorosa, desafiante o incluso muy feliz. No tienes que contar nada que no quieras compartir. ¿Cómo la contabas justo después de que ocurrió?',
  momento_despues: '¿Cómo la cuentas hoy? ¿Qué cambió en la forma en que la entiendes?',
  titulo: 'Si esta historia fuera un libro, ¿cómo se llamaría este capítulo?',
} as const;

/** Micro-reconocimiento (pantalla 05 de la especificación): aparece cada 3
 * tarjetas de clasificación, solo para generar interacción -- no se
 * persiste ni se le pasa a Claude, no construye ninguna puntuación. */
export const OPCIONES_MICRORRECONOCIMIENTO = ['Mucho', 'A veces', 'Nunca lo había pensado'] as const;

/** Sugerencia de respaldo si Claude no devuelve `experimento_24h` (sección
 * 13 de la especificación) -- el juego prioriza siempre la de Claude,
 * personalizada; esto es solo una red de seguridad. */
export const EXPERIMENTO_24H_RESPALDO: Record<Pilar, string> = {
  pertenencia: 'Escribe a alguien con quien hace tiempo no tienes una conversación de verdad.',
  proposito: 'Haz hoy una cosa que ayude a alguien sin esperar reconocimiento.',
  trascendencia: 'Regálate 10 minutos para hacer algo que te conecte con algo mayor que tú.',
  narracion: 'Escribe una frase nueva sobre una situación que hasta hoy has contado siempre de la misma manera.',
};

export type RespuestasClasificacion = Record<string, Pilar>;
/** id de pregunta (PREGUNTAS_PILARES) → lo que escribió la persona. */
export type RespuestasReflexiones = Record<string, string>;
export interface RespuestasHistoria {
  momento_antes: string;
  momento_despues: string;
  titulo: string;
}

/**
 * Orden aleatorio pero FIJO por sesión (se llama una sola vez al montar el
 * juego, no en cada render) -- la especificación pide que las 12 tarjetas
 * se mezclen al azar y que nunca se muestren agrupadas por pilar.
 */
export function barajarTarjetas(): Tarjeta[] {
  const copia = [...TARJETAS];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
