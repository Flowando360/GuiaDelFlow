import { clienteResend, REMITENTE_FLOWI } from './cliente';
import { construirHtmlCorreoDocumentos, construirHtmlCorreoInvitacion } from './plantilla';

// Copia oculta de todo correo con Guía+Carta, para que Flowando tenga
// registro de a quién y cuándo le llegó — pedido el 2026-09-01.
const BCC_REGISTRO_ENVIOS = 'innovacion@flowando.com';

/**
 * Envía el correo final con la Guía y la Carta adjuntas. No lanza ni
 * bloquea la generación si falla — el usuario siempre puede descargar los
 * PDFs desde /resultado, así que un error de correo se loguea y se
 * reporta, pero no debe tumbar la respuesta de /api/generar-carta.
 *
 * `empresa`/`firmanteNombre` personalizan el texto ("regalo que hoy
 * {empresa} te hace" / "comunícate con {firmanteNombre}") — vienen de
 * obtenerEmpresaYFirmante() (src/lib/circulo/empresa.ts); null cuando la
 * cuenta no está vinculada a ninguna empresa de Círculo de Crecimiento.
 */
export async function enviarCorreoDocumentos(datos: {
  destinatario: string;
  nombre: string;
  empresa: string | null;
  firmanteNombre: string | null;
  pdfGuia: Buffer;
  pdfCarta: Buffer;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { destinatario, nombre, empresa, firmanteNombre, pdfGuia, pdfCarta } = datos;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://guia-del-flow.vercel.app';

  try {
    const resend = clienteResend();
    const { error } = await resend.emails.send({
      from: REMITENTE_FLOWI,
      to: destinatario,
      bcc: BCC_REGISTRO_ENVIOS,
      subject: `${nombre}, tu Guía del Flow y tu Carta ya están listas 💜`,
      html: construirHtmlCorreoDocumentos({
        nombre,
        empresa,
        firmanteNombre,
        urlLogo: `${siteUrl}/images/flow-optimizado/LogoFlowAndoOficial.png`,
        urlFlowi: `${siteUrl}/images/flow-optimizado/flowi%20principal.jpg`,
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

/**
 * Correo de invitación al crear un link de envío (ver
 * src/app/panel/actions.ts, crearLinksEnvio) — solo se manda cuando la
 * superusuaria ya tiene el correo del paciente. Igual que el de
 * documentos, no lanza si falla: el link ya quedó creado y siempre se
 * puede copiar/pegar a mano desde /panel/links.
 */
export async function enviarCorreoInvitacion(datos: {
  destinatario: string;
  nombre: string;
  urlLink: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { destinatario, nombre, urlLink } = datos;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://guia-del-flow.vercel.app';

  try {
    const resend = clienteResend();
    const { error } = await resend.emails.send({
      from: REMITENTE_FLOWI,
      to: destinatario,
      subject: `${nombre}, alguien te invitó a conocerte más 💜`,
      html: construirHtmlCorreoInvitacion({
        nombre,
        urlLink,
        urlLogo: `${siteUrl}/images/flow-optimizado/LogoFlowAndoOficial.png`,
        urlFirma: `${siteUrl}/images/flow-optimizado/FirmaCorreoFlowando_1.jpg`,
      }),
    });

    if (error) {
      console.error('Error enviando correo de invitación con Resend:', error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (error) {
    console.error('Error enviando correo de invitación:', error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
