/**
 * Reducción numerológica compartida por todos los aspectos de
 * formula_numerologica* — ver flowando_kb/calculation_order.json →
 * "regla_de_reduccion_numerologica".
 *
 * Regla (confirmada por el texto fuente de BC_MADRE.xlsx en varias hojas,
 * ver README del kb y la sesión que resolvió el pendiente 2026-08-04):
 * sumar los dígitos del número repetidamente hasta obtener un valor <= 11.
 * A diferencia de la numerología clásica, NO se reduce más allá de 11 (el
 * 11 se preserva como "número maestro", igual que cualquier valor 1-10).
 */

/** Suma los dígitos de un número entero no negativo (una sola pasada). */
export function sumaDigitos(n: number): number {
  return Math.abs(Math.trunc(n))
    .toString()
    .split('')
    .reduce((acc, d) => acc + Number(d), 0);
}

/**
 * Reduce un número repitiendo sumaDigitos hasta que el resultado sea <= 11.
 * Converge siempre en pocas pasadas (raíz digital): para cualquier entero
 * positivo, como mucho hacen falta 2 pasadas para bajar de dos cifras a
 * <=11 (ver análisis en calculation_order.json →
 * resuelto_2026_08_04_reduccion_numerologica_compuestos).
 */
export function reducirNumerologico(n: number): number {
  let valor = Math.abs(Math.trunc(n));
  while (valor > 11) {
    valor = sumaDigitos(valor);
  }
  return valor;
}
