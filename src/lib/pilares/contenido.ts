/**
 * Contenido fijo de "Los 4 Pilares" — inspirado en la charla TEDx de Emily
 * Esfahani Smith, "Los cuatro pilares de una vida con significado". Ver
 * Diseno-Juego-4-Pilares.md (repo espiralcrecimiento360) para el diseño con
 * el que se escribió esto originalmente — el ejercicio 2 se redefinió
 * después, de escalas 1-5 a preguntas cortas de autoindagación, para
 * invitar a escribir en cada pilar en vez de solo calificarse.
 */

export type Pilar = 'pertenencia' | 'proposito' | 'trascendencia' | 'narracion';

export const PILARES: { id: Pilar; nombre: string }[] = [
  { id: 'pertenencia', nombre: 'Pertenencia' },
  { id: 'proposito', nombre: 'Propósito' },
  { id: 'trascendencia', nombre: 'Trascendencia' },
  { id: 'narracion', nombre: 'Narración' },
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
    texto: 'Jonathan compra el periódico cada mañana al mismo vendedor. No es solo una transacción: se detienen a conversar, a tratarse como seres humanos.',
    pilar: 'pertenencia',
    feedback: 'La pertenencia vive en esos momentos pequeños entre personas — es una elección, no una casualidad.',
  },
  {
    id: 't2',
    texto: 'Una trabajadora de limpieza de un hospital dice que su propósito es sanar a las personas enfermas.',
    pilar: 'proposito',
    feedback: 'El propósito no depende del cargo — depende de a quién sirves con lo que haces.',
  },
  {
    id: 't3',
    texto: 'Estudiantes que miraron durante un minuto un eucalipto de 60 metros terminaron comportándose de forma más generosa después.',
    pilar: 'trascendencia',
    feedback: 'Basta un instante en que tu ego se achica para que algo en ti cambie.',
  },
  {
    id: 't4',
    texto: 'Emika, paralizado jugando fútbol, cambió su historia de "mi vida era buena y ahora es mala" a "mi lesión me hizo un hombre mejor".',
    pilar: 'narracion',
    feedback: 'Los hechos no cambiaron. La historia que se contó a sí mismo, sí.',
  },
  {
    id: 't5',
    texto: 'Revisar el teléfono mientras alguien te habla, o pasar junto a un conocido sin reconocerlo de verdad.',
    pilar: 'pertenencia',
    feedback: 'Son rechazos pequeños que casi nadie nota — pero le quitan valor al otro.',
  },
  {
    id: 't6',
    texto: 'Muchos padres dicen: "mi propósito es criar a mis hijos".',
    pilar: 'proposito',
    feedback: 'El propósito tiene menos que ver con lo que quieres, y más con lo que das.',
  },
  {
    id: 't7',
    texto: 'Emily entra en tal concentración escribiendo, que pierde por completo la noción del tiempo y el lugar.',
    pilar: 'trascendencia',
    feedback: 'La trascendencia no siempre es mística — a veces es solo perderte en lo que haces.',
  },
  {
    id: 't8',
    texto: 'El papá de Emily, en cirugía de emergencia, repitió los nombres de sus hijos como un mantra en vez de contar hacia atrás.',
    pilar: 'narracion',
    feedback: 'En ese momento, esa fue su historia de para qué vivir.',
  },
  {
    id: 't9',
    texto: 'Algunos grupos dan una pertenencia barata: te valoran por lo que odias, no por quien eres. La verdadera pertenencia nace del amor.',
    pilar: 'pertenencia',
    feedback: 'Vale la pena distinguir entre pertenecer y solo encajar.',
  },
  {
    id: 't10',
    texto: 'El desempleo y la falta de compromiso en el trabajo no son solo problemas económicos — son problemas existenciales.',
    pilar: 'proposito',
    feedback: 'Sin algo valioso que hacer, las personas se desorientan.',
  },
  {
    id: 't11',
    texto: 'Para unos, la trascendencia llega contemplando arte. Para otros, en la iglesia.',
    pilar: 'trascendencia',
    feedback: 'El lugar cambia de persona a persona; la sensación de conectarse con algo más grande, no.',
  },
  {
    id: 't12',
    texto: 'El psicólogo Dan McAdams encontró que las vidas con más significado se cuentan como historias de redención, no solo de pérdida.',
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
  momento_antes: 'Piensa en un momento difícil de tu vida. ¿Cómo lo hubieras contado justo después de que pasó?',
  momento_despues: '¿Cómo lo cuentas hoy? ¿Qué cambió en la forma en que lo entiendes?',
  titulo: 'Si esa historia tuviera un título, ¿cuál sería?',
} as const;

export type RespuestasClasificacion = Record<string, Pilar>;
/** id de pregunta (PREGUNTAS_PILARES) → lo que escribió la persona. */
export type RespuestasReflexiones = Record<string, string>;
export interface RespuestasHistoria {
  momento_antes: string;
  momento_despues: string;
  titulo: string;
}
