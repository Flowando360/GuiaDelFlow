import { clienteResend, REMITENTE_FLOWI } from './cliente';
import { construirHtmlCorreoDocumentos } from './plantilla';

/**
 * Envía el correo final con la Guía y la Carta adjuntas. No lanza ni
 * bloquea la generación si falla — el usuario siempre puede descargar los
 * PDFs desde /resultado, así que un error de correo se loguea y se
 * reporta, pero no debe tumbar la respuesta de /api/generar-carta.
 */
export async function enviarCorreoDocumentos(datos: {
  destinatario: string;
  nombre: string;
  pdfGuia: Buffer;
  pdfCarta: Buffer;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { destinatario, nombre, pdfGuia, pdfCarta } = datos;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://guia-del-flow.vercel.app';

  try {
    const resend = clienteResend();
    const { error } = await resend.emails.send({
      from: REMITENTE_FLOWI,
      to: destinatario,
      subject: `${nombre}, tu Guía del Flow y tu Carta ya están listas 💜`,
      html: construirHtmlCorreoDocumentos({
        nombre,
        urlLogo: `${siteUrl}/images/flow-optimizado/LogoFlowAndoOficial.png`,
      }),
      attachments: [
        { filename: 'GuiaDelFlow.pdf', content: pdfGuia },
        { filename: 'CartaDelFlow.pdf', content: pdfCarta },
      ],
    });

    if (error) {
      console.error('Error enviando correo con Resend:', error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (error) {
    console.error('Error enviando correo:', error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
