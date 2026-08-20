/**
 * Textos de consentimiento por modo de flow_links_envio.modo — se muestran
 * en /registro cuando la persona llega por un link de envío (?envio=), para
 * que sepa explícitamente que quien le compartió el link también va a
 * poder ver su Guía del Flow. Compartido con /panel para mostrar el mismo
 * texto al crear un link, así la superusuaria ve exactamente lo que verá
 * la persona.
 */
export const COPY_MODO_ENVIO: Record<'directo' | 'acompanado', { titulo: string; texto: string }> = {
  directo: {
    titulo: 'Un camino acompañado',
    texto:
      'Tu Guía del Flow y tu Carta llegarán a tu correo — y también a quien te invitó a este camino, para poder acompañarte con lo que descubras.',
  },
  acompanado: {
    titulo: 'Un camino acompañado',
    texto:
      'Este es un camino que recorres acompañada. Quien te invitó leerá primero tu Guía y tu Carta, y te las compartirá en el momento justo — para que cuando las recibas, no sea sola.',
  },
};
