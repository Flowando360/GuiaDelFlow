/**
 * Forma del JSON que le pedimos a Claude para redactar la Carta —
 * equivalente a la estructura de las 5 páginas de Codigo/Generar_Carta.txt.
 */
export interface CuestionamientoRespondido {
  pregunta: string;
  respuesta: [string, string, string]; // 3 párrafos
}

export interface CartaCondensada {
  nombre: string;
  fecha: string;
  frase_portada: string; // frase corta en cursiva, personalizada según su esencia
  intro: {
    parrafo_1: string; // por qué está haciendo la guía y qué dice eso de ella
    parrafo_2: string; // quién es según su guía (carácter, talentos, propósito)
    parrafo_3: string; // puente hacia los cuestionamientos
  };
  cuestionamiento_1: CuestionamientoRespondido & { cierre: string };
  cuestionamiento_2: CuestionamientoRespondido & { pie_foto: string };
  cuestionamiento_3: CuestionamientoRespondido & { cierre_1: string; cierre_2: string };
}
