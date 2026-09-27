export interface PilarEscrito {
  nombre_pilar: 'Pertenencia' | 'Propósito' | 'Trascendencia' | 'Narración';
  frase_ancla: string;
  reflexion: string;
}

export interface PilaresCondensado {
  nombre: string;
  fecha: string;
  frase_portada: string;
  introduccion: { parrafo_1: string; parrafo_2: string };
  /** Siempre 4, en orden fijo: Pertenencia, Propósito, Trascendencia, Narración. */
  pilares: [PilarEscrito, PilarEscrito, PilarEscrito, PilarEscrito];
  historia_reescrita: { titulo: string; parrafo_1: string; parrafo_2: string; cierre: string };
  invitacion_final: string;
  /** El pilar que Claude ve más vivo en las respuestas -- para /panel/pilares, no aparece en el PDF. */
  pilar_mas_vivo: 'Pertenencia' | 'Propósito' | 'Trascendencia' | 'Narración';
}
