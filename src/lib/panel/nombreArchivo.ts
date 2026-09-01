/**
 * Nombre de archivo para los PDF que se descargan desde /panel (uno a uno
 * con BotonDescargar, o en lote con la descarga masiva) -- mismo formato
 * en los dos casos para que sea predecible: "XX_nombre_SiglasEmpresa.pdf".
 *
 * XX es "GF" para la Guía del Flow o "Carta" para la Carta (pedido así,
 * literal, por Diana Said el 2026-08-31). SiglasEmpresa sale de
 * empresas.siglas (Círculo de Crecimiento, ver migración 0064 de ese
 * repo) -- si la cuenta no está ligada a ninguna empresa, o esa empresa
 * no tiene siglas cargadas todavía, se usa "PS".
 */
export function nombreArchivoPdf(tipo: 'guia' | 'carta', nombreCompleto: string, siglasEmpresa: string | null): string {
  const xx = tipo === 'guia' ? 'GF' : 'Carta';
  const nombreLimpio = nombreCompleto
    .trim()
    .replace(/[\\/:*?"<>|]/g, '') // caracteres que rompen nombres de archivo
    .replace(/\s+/g, '_');
  const siglas = (siglasEmpresa ?? '').trim() || 'PS';
  return `${xx}_${nombreLimpio}_${siglas}.pdf`;
}
