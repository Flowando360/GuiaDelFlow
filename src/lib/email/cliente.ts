import { Resend } from 'resend';

/**
 * Remitente por defecto — dominio verificado en Resend (mail.flowando.com),
 * separado del dominio principal flowando.com para no tocar el correo real
 * de la empresa (Google Workspace). Ver memoria del proyecto para el detalle
 * de los registros DNS agregados.
 */
export const REMITENTE_FLOWI = 'Flowi de FlowAndo <flowi@mail.flowando.com>';

export function clienteResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('Falta RESEND_API_KEY en las variables de entorno.');
  return new Resend(apiKey);
}
