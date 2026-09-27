/**
 * HTML del correo con los 2 PDFs adjuntos. Estilos en línea (no <style>
 * externo ni @import de fuentes) porque los clientes de correo ignoran o
 * bloquean eso — se usan fuentes "web-safe" con fallback, igual que
 * cualquier plantilla de email tradicional.
 *
 * Texto acordado con Flowando el 2026-09-01 para usarse con TODAS las
 * empresas de ahora en adelante — nombra a la empresa que regala la Guía y
 * a quien lidera Talento Humano ahí, para que la persona sepa a quién
 * buscar si quiere hablarlo. `empresa`/`firmanteNombre` vienen de
 * obtenerEmpresaYFirmante() (src/lib/circulo/empresa.ts) — null cuando la
 * cuenta no está vinculada a ninguna empresa de Círculo de Crecimiento
 * (registro directo), caso en el que se usa un texto genérico de respaldo.
 */
export function construirHtmlCorreoDocumentos(datos: {
  nombre: string;
  empresa: string | null;
  firmanteNombre: string | null;
  urlLogo: string;
  urlFlowi: string;
}): string {
  const { nombre, empresa, firmanteNombre, urlLogo, urlFlowi } = datos;

  const parrafoRegalo = empresa
    ? `Los dos van adjuntos a este correo en PDF y son documentos privados que solamente tú conoces. Es un regalo que hoy
       <strong>${escaparHtml(empresa)}</strong> te hace para que potencies tus talentos y te enfoques en aquello que te hace feliz.`
    : `Los dos van adjuntos a este correo en PDF y son documentos privados que solamente tú conoces. Es un regalo para que
       potencies tus talentos y te enfoques en aquello que te hace feliz.`;

  const parrafoCierre = firmanteNombre
    ? `Tómate tu tiempo para leerlos con calma, disfrútalos, disfrútate y si quieres algún apoyo, comunícate con
       <strong>${escaparHtml(firmanteNombre)}</strong>, quien con gusto estará para ti.`
    : `Tómate tu tiempo para leerlos con calma, disfrútalos, disfrútate.`;

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#faf5ff;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf5ff;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 0 32px;">
              <img src="${urlLogo}" alt="FlowAndo" width="140" style="display:block;height:auto;"/>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 8px 32px;">
              <p style="margin:0 0 4px 0;font-style:italic;color:#7c3aed;font-size:14px;">Hola,</p>
              <h1 style="margin:0 0 16px 0;color:#4c1d95;font-size:24px;">${escaparHtml(nombre)}, tu Guía del Flow ya está lista</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px;">
              <p style="margin:0 0 16px 0;color:#2e1065;font-size:15px;line-height:1.7;">
                Aquí tienes tus dos documentos: <strong>tu Guía del Flow</strong>, con todo lo que descubrimos
                sobre tus talentos, tu propósito y tus desafíos, y <strong>tu Carta</strong>, un mensaje
                personal donde te respondo a lo que me compartiste.
              </p>
              <p style="margin:0 0 16px 0;color:#2e1065;font-size:15px;line-height:1.7;">
                ${parrafoRegalo}
              </p>
              <p style="margin:0 0 24px 0;color:#2e1065;font-size:15px;line-height:1.7;">
                ${parrafoCierre}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 8px 32px;" align="center">
              <img src="${urlFlowi}" alt="Flowi" width="120" style="display:block;height:auto;"/>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px 32px;" align="center">
              <p style="margin:0;font-style:italic;color:#a855f7;font-size:13px;">Con todo el cariño,</p>
              <p style="margin:2px 0 0 0;font-style:italic;color:#7c3aed;font-size:20px;">Flowi ♥</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background-color:#f5f3ff;">
              <p style="margin:0;color:#a78bfa;font-size:11px;letter-spacing:0.5px;text-transform:uppercase;">
                El Lab del Talento · FlowAndo
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * HTML del correo de invitación — se manda al crear un link de envío desde
 * /panel/links si la superusuaria ya tiene el correo del paciente (ver
 * src/app/panel/actions.ts, crearLinksEnvio). Termina con la firma real de
 * quien invita (Imagenes_Flow/FirmaCorreoFlowando_1.jpg, optimizada en
 * public/images/flow-optimizado/) en vez del cierre genérico "Flowi ♥" del
 * correo de documentos — aquí quien invita es una persona real, no Flowi.
 */
export function construirHtmlCorreoInvitacion(datos: {
  nombre: string;
  urlLink: string;
  urlLogo: string;
  urlFirma: string;
}): string {
  const { nombre, urlLink, urlLogo, urlFirma } = datos;

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#faf5ff;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf5ff;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 0 32px;">
              <img src="${urlLogo}" alt="FlowAndo" width="140" style="display:block;height:auto;"/>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 8px 32px;">
              <p style="margin:0 0 4px 0;font-style:italic;color:#7c3aed;font-size:14px;">Hola,</p>
              <h1 style="margin:0 0 16px 0;color:#4c1d95;font-size:22px;">
                Alguien que te aprecia quiere regalarte un espacio para conocerte más
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px;">
              <p style="margin:0 0 16px 0;color:#2e1065;font-size:15px;line-height:1.7;">
                ${escaparHtml(nombre)}, se llama <strong>La Guía del Flow</strong>. Vas a responder un
                cuestionario tranquilo sobre ti — tu forma de ser, tus talentos, el momento de vida en
                el que estás — y con esas respuestas te vamos a escribir dos documentos hechos solo para
                ti: <strong>tu Guía del Flow</strong>, con lo que descubramos sobre tus talentos y tu
                propósito, y <strong>tu Carta</strong>, un mensaje personal respondiendo lo que nos
                compartas.
              </p>
              <p style="margin:0 0 28px 0;color:#2e1065;font-size:15px;line-height:1.7;">
                No hay respuestas correctas ni incorrectas: solo tú, respondiendo desde lo que de verdad
                sientes. Tómate el tiempo que necesites.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 8px 32px;" align="center">
              <a href="${urlLink}"
                 style="display:inline-block;background-color:#7c3aed;color:#ffffff;font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:bold;text-decoration:none;padding:14px 32px;border-radius:999px;">
                Empezar mi Flow
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px 32px;">
              <p style="margin:24px 0 0 0;font-style:italic;color:#a855f7;font-size:13px;">Te espero del otro lado,</p>
              <p style="margin:2px 0 0 0;font-style:italic;color:#7c3aed;font-size:20px;">Flowi ♥</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background-color:#f5f3ff;">
              <img src="${urlFirma}" alt="" width="360" style="display:block;height:auto;max-width:100%;"/>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * HTML del aviso interno a Flowando (ver enviarCorreoAvisoInterno) -- más
 * simple que las plantillas para la persona, es un memo informativo con el
 * contexto de qué modo era y qué pasó con el envío a la persona, no un
 * correo pensado para leerse como un regalo.
 */
export function construirHtmlAvisoInterno(datos: {
  nombre: string;
  correo: string | null;
  modo: 'directo' | 'acompanado';
  correoPersona: string | null;
  envioPersonaOk: boolean | null;
}): string {
  const { nombre, correo, modo, correoPersona, envioPersonaOk } = datos;

  const lineaEnvio =
    modo === 'acompanado'
      ? 'Modo acompañado: no se le manda correo automático a la persona, así que la entrega queda pendiente de coordinarse manualmente.'
      : envioPersonaOk === true
        ? `Modo directo: el correo con sus documentos ya se le envió a ${escaparHtml(correoPersona ?? 'su correo')}.`
        : correoPersona
          ? `Modo directo: el envío a ${escaparHtml(correoPersona)} FALLÓ. Revisa /panel para reintentarlo.`
          : 'Modo directo, pero esta cuenta no tiene un correo registrado -- no se le pudo enviar nada a la persona.';

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#f5f3ff;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f3ff;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:24px 28px 8px 28px;">
              <p style="margin:0 0 4px 0;color:#a78bfa;font-size:11px;letter-spacing:0.5px;text-transform:uppercase;">Aviso interno · Guía del Flow</p>
              <h1 style="margin:0 0 12px 0;color:#4c1d95;font-size:20px;">${escaparHtml(nombre)} terminó su cuestionario</h1>
              <p style="margin:0 0 16px 0;color:#5b21b6;font-size:13px;line-height:1.5;">
                <strong>Correo:</strong> ${correo ? escaparHtml(correo) : 'sin correo registrado'}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px;">
              <p style="margin:0 0 12px 0;color:#2e1065;font-size:14px;line-height:1.6;">
                Ya se generaron su Guía del Flow y su Carta -- van las dos adjuntas en PDF a este correo.
              </p>
              <p style="margin:0 0 20px 0;color:#2e1065;font-size:14px;line-height:1.6;">
                ${lineaEnvio}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;background-color:#f5f3ff;">
              <p style="margin:0;color:#a78bfa;font-size:11px;letter-spacing:0.5px;text-transform:uppercase;">
                El Lab del Talento · FlowAndo
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * HTML del correo con el PDF de "Los 4 Pilares" adjunto — juego público sin
 * cuenta (ver src/lib/pilares/, src/lib/pdf/pilares/). Mismo sistema visual
 * que construirHtmlCorreoDocumentos, pero con su propio texto: acá no hay
 * "empresa que regala" ni "firmante", porque no depende de Círculo de
 * Crecimiento en absoluto.
 */
export function construirHtmlCorreoPilares(datos: {
  nombre: string;
  urlLogo: string;
  urlFlowi: string;
}): string {
  const { nombre, urlLogo, urlFlowi } = datos;

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#faf5ff;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf5ff;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 0 32px;">
              <img src="${urlLogo}" alt="FlowAndo" width="140" style="display:block;height:auto;"/>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 8px 32px;">
              <p style="margin:0 0 4px 0;font-style:italic;color:#7c3aed;font-size:14px;">Hola,</p>
              <h1 style="margin:0 0 16px 0;color:#4c1d95;font-size:24px;">${escaparHtml(nombre)}, tus 4 Pilares ya están listos</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px;">
              <p style="margin:0 0 16px 0;color:#2e1065;font-size:15px;line-height:1.7;">
                Va adjunto en PDF: lo que descubriste sobre tu Pertenencia, tu Propósito, tu Trascendencia y tu
                forma de contarte tu propia historia — con tus propias respuestas del juego.
              </p>
              <p style="margin:0 0 24px 0;color:#2e1065;font-size:15px;line-height:1.7;">
                Tómate tu tiempo para leerlo con calma, disfrútalo, disfrútate.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 8px 32px;" align="center">
              <img src="${urlFlowi}" alt="Flowi" width="120" style="display:block;height:auto;"/>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px 32px;" align="center">
              <p style="margin:0;font-style:italic;color:#a855f7;font-size:13px;">Con todo el cariño,</p>
              <p style="margin:2px 0 0 0;font-style:italic;color:#7c3aed;font-size:20px;">Flowi ♥</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background-color:#f5f3ff;">
              <p style="margin:0;color:#a78bfa;font-size:11px;letter-spacing:0.5px;text-transform:uppercase;">
                El Lab del Talento · FlowAndo
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escaparHtml(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
