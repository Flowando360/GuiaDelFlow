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
  /** El pilar que Claude ve más vivo en las respuestas. La interfaz nunca lo
   * presenta como "tu pilar más fuerte" ni similar (ver pantalla de
   * revelación) -- el nombre técnico se conserva, solo cambia el lenguaje
   * de cara a la persona. */
  pilar_mas_vivo: 'Pertenencia' | 'Propósito' | 'Trascendencia' | 'Narración';
  /** 1-2 frases, en la voz de Flowi, que explican por qué ese pilar se hizo
   * visible -- se muestra en la pantalla de "Revelación", antes de pedir el
   * correo (no aparece en el PDF). */
  explicacion_pilar_mas_visible: string;
  /** Sugerencia pequeña y realizable para las próximas 24h, personalizada
   * con lo que la persona escribió -- aparece en el juego y en la última
   * página del PDF. */
  experimento_24h: string;
}
