/**
 * Helpers de fecha de nacimiento: signo zodiacal, elemento y septenio.
 * Rangos de fecha y elemento por signo son astrología estándar (no vienen
 * codificados en flowando_kb, pero sí la numeración 1-12 que usa CARACTER
 * y la lista de 4 elementos que usa TALENTO_UNICO — ver sus preambulos).
 */

export interface DatosNacimiento {
  dia: number; // 1-31
  mes: number; // 1-12
  anio: number; // ej. 1993
}

export type Elemento = 'FUEGO' | 'TIERRA' | 'AIRE' | 'AGUA';

const SIGNOS = [
  { numero: 1, nombre: 'ARIES', elemento: 'FUEGO' as Elemento },
  { numero: 2, nombre: 'TAURO', elemento: 'TIERRA' as Elemento },
  { numero: 3, nombre: 'GÉMINIS', elemento: 'AIRE' as Elemento },
  { numero: 4, nombre: 'CANCER', elemento: 'AGUA' as Elemento },
  { numero: 5, nombre: 'LEO', elemento: 'FUEGO' as Elemento },
  { numero: 6, nombre: 'VIRGO', elemento: 'TIERRA' as Elemento },
  { numero: 7, nombre: 'LIBRA', elemento: 'AIRE' as Elemento },
  { numero: 8, nombre: 'ESCORPION', elemento: 'AGUA' as Elemento },
  { numero: 9, nombre: 'SAGITARIO', elemento: 'FUEGO' as Elemento },
  { numero: 10, nombre: 'CAPRICORNIO', elemento: 'TIERRA' as Elemento },
  { numero: 11, nombre: 'ACUARIO', elemento: 'AIRE' as Elemento },
  { numero: 12, nombre: 'PISCIS', elemento: 'AGUA' as Elemento },
] as const;

/**
 * Signo zodiacal a partir de día+mes, con la numeración 1=ARIES..12=PISCIS
 * que usa CARACTER.json (ver su campo CÁLCULO).
 */
export function signoZodiacal(dia: number, mes: number): (typeof SIGNOS)[number] {
  // [mesInicio, diaInicio, índice en SIGNOS] — cada signo empieza a mitad
  // de un mes y termina a mitad del siguiente.
  const cortes: [number, number, number][] = [
    [1, 20, 10], // Acuario empieza 20 ene
    [2, 19, 11], // Piscis empieza 19 feb
    [3, 21, 0], // Aries empieza 21 mar
    [4, 20, 1], // Tauro empieza 20 abr
    [5, 21, 2], // Géminis empieza 21 may
    [6, 21, 3], // Cáncer empieza 21 jun
    [7, 23, 4], // Leo empieza 23 jul
    [8, 23, 5], // Virgo empieza 23 ago
    [9, 23, 6], // Libra empieza 23 sep
    [10, 23, 7], // Escorpio empieza 23 oct
    [11, 22, 8], // Sagitario empieza 22 nov
    [12, 22, 9], // Capricornio empieza 22 dic
  ];

  // Busca el último corte cuyo (mes,día) sea <= (mes,dia) de la persona.
  let indiceSigno = 9; // por defecto Capricornio (cubre 1-19 de enero)
  for (const [m, d, idx] of cortes) {
    if (mes > m || (mes === m && dia >= d)) {
      indiceSigno = idx;
    }
  }
  return SIGNOS[indiceSigno];
}

/** Edad en años cumplidos a una fecha de referencia (por defecto, hoy). */
export function calcularEdad(nacimiento: DatosNacimiento, referencia: Date = new Date()): number {
  let edad = referencia.getFullYear() - nacimiento.anio;
  const mesRef = referencia.getMonth() + 1;
  const diaRef = referencia.getDate();
  if (mesRef < nacimiento.mes || (mesRef === nacimiento.mes && diaRef < nacimiento.dia)) {
    edad -= 1;
  }
  return edad;
}

/**
 * Septenio (ciclo de 7 años) que vive la persona — ver ETAPA_FLOW.json,
 * CÁLCULO: "SEPTENIO QUE VIVE LA PERSONA". 11 septenios posibles
 * (0-6 años = septenio 1, 7-13 = septenio 2, ..., 70+ = septenio 11).
 */
export function septenio(edad: number): number {
  const valor = Math.floor(Math.max(edad, 0) / 7) + 1;
  return Math.min(valor, 11);
}
