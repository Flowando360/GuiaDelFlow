/**
 * Forma del JSON que le pedimos a Claude para redactar la Guía —
 * equivalente a la ESTRUCTURA JSON REQUERIDA del prompt en
 * Codigo/Generar_Guia.py, adaptada: acá el modelo ya recibe los aspectos
 * calculados (no un PDF ya escrito), así que solo redacta y condensa.
 */
export interface SeccionGuia {
  seccion: string;
  subtitulo: string;
  texto: string;
  recuerda_izq: string;
  recuerda_der: string;
}

export interface GuiaCondensada {
  nombre: string;
  fecha: string;
  origen: string;
  talento_unico: {
    titulo_sello: string;
    texto: string;
  };
  talentos: SeccionGuia[];
  emociones: SeccionGuia[];
  pertenencia: SeccionGuia[];
  desafios: SeccionGuia[];
  frase_cierre: string;
}
