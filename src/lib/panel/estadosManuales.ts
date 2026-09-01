/**
 * Catálogo curado de estados manuales (ver migración 0009) -- la columna
 * en sí es texto libre, esto es solo lo que ofrece la UI de
 * /panel/estados-manuales. Agregar uno nuevo acá es el único paso para
 * que aparezca en el selector.
 */
export const ESTADOS_MANUALES = [
  {
    valor: 'entregada_gestionada',
    etiqueta: 'Entregada y gestionada',
    descripcion: 'Ya tiene su Guía del Flow, resuelta por fuera de este sistema (antes de existir, en persona, etc.)',
  },
  {
    valor: 'no_aplica',
    etiqueta: 'No aplica',
    descripcion: 'No le corresponde Guía del Flow por ahora (ej. cargo temporal, ya se retira, etc.)',
  },
] as const;

export type EstadoManualValor = (typeof ESTADOS_MANUALES)[number]['valor'];

export function etiquetaEstadoManual(valor: string): string {
  return ESTADOS_MANUALES.find((e) => e.valor === valor)?.etiqueta ?? valor;
}
