import { clienteResend, REMITENTE_FLOWI } from './cliente';
import {
  construirHtmlCorreoDocumentos,
  construirHtmlCorreoInvitacion,
  construirHtmlAvisoInterno,
} from './plantilla';

// A dónde llega el aviso interno de cada Guía+Carta completada -- pedido el
// 2026-09-01 (como BCC) y confirmado de nuevo el 2026-09-02 al pasarlo a
// envío propio (ver enviarCorreoAvisoInterno).
const CORREO_AVISO_INTERNO = 'innovacion@flowando.com';

/**
 * Envía el correo final con la Guía y la Carta adjuntas a LA PERSONA. No
 * lanza ni bloquea la generación si falla — el usuario siempre puede
 * descargar los PDFs desde /resultado, así que un error de correo se loguea
 * y se reporta, pero no debe tumbar la respuesta de /api/generar-carta.
 *
 * `empresa`/`firmanteNombre` personalizan el texto ("regalo que hoy
 * {empresa} te hace" / "comunícate con {firmanteNombre}") — vienen de
 * obtenerEmpresaYFirmante() (src/lib/circulo/empresa.ts); null cuando la
 * cuenta no está vinculada a ninguna empresa de Círculo de Crecimiento.
 *
 * Ya NO lleva BCC a Flowando -- ver enviarCorreoAvisoInterno, que ahora es
 * un envío aparte y siempre se manda sin importar el modo (antes, en modo
 * "acompañado", este correo ni se llamaba, así que la BCC tampoco llegaba).
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
 * Aviso interno a Flowando (innovacion@flowando.com) cada vez que se
 * terminan de generar la Guía y la Carta de alguien, sin importar el modo
 * del link (directo o acompañado). Pedido el 2026-09-02: en modo
 * "acompañado" `enviarCorreoDocumentos` nunca se llama (la persona no
 * recibe correo automático), así que antes de este cambio Flowando no se
 * enteraba en absoluto de que alguien había terminado. Ahora este correo es
 * independiente de ese y siempre se manda, con los mismos 2 PDFs adjuntos.
 *
 * Igual que los otros correos de este archivo: no lanza ni bloquea la
 * generación si falla, solo se loguea y se reporta a quien llamó.
 */
export async function enviarCorreoAvisoInterno(datos: {
  nombre: string;
  /** Correo de la CUENTA (flow_perfiles.email) -- siempre que exista, sin
   * importar el modo. Distinto de correoPersona, que es a dónde se le
   * mandó (o no) el correo con los documentos. */
  correo: string | null;
  modo: 'directo' | 'acompanado';
  correoPersona: string | null;
  envioPersonaOk: boolean | null;
  pdfGuia: Buffer;
  pdfCarta: Buffer;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { nombre, correo, modo, correoPersona, envioPersonaOk, pdfGuia, pdfCarta } = datos;

  try {
    const resend = clienteResend();
    const { error } = await resend.emails.send({
      from: REMITENTE_FLOWI,
      to: CORREO_AVISO_INTERNO,
      // Nombre Y correo en el asunto -- para identificar a la persona sin
      // tener que abrir el correo (pedido el 2026-09-03, después de que
      // fue difícil ubicar de quién se trataba un aviso con solo el
      // nombre/apodo).
      subject: correo
        ? `${nombre} (${correo}) terminó su cuestionario — Guía y Carta listas`
        : `${nombre} terminó su cuestionario — Guía y Carta listas`,
      html: construirHtmlAvisoInterno({ nombre, correo, modo, correoPersona, envioPersonaOk }),
      attachments: [
        { filename: 'GuiaDelFlow.pdf', content: pdfGuia },
        { filename: 'CartaDelFlow.pdf', content: pdfCarta },
      ],
    });

    if (error) {
      console.error('Error enviando aviso interno con Resend:', error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (error) {
    console.error('Error enviando aviso interno:', error);
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
