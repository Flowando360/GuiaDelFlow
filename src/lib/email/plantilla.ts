/**
 * HTML del correo con los 2 PDFs adjuntos. Estilos en línea (no <style>
 * externo ni @import de fuentes) porque los clientes de correo ignoran o
 * bloquean eso — se usan fuentes "web-safe" con fallback, igual que
 * cualquier plantilla de email tradicional.
 */
export function construirHtmlCorreoDocumentos(datos: { nombre: string; urlLogo: string }): string {
  const { nombre, urlLogo } = datos;

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
              <p style="margin:0 0 24px 0;color:#2e1065;font-size:15px;line-height:1.7;">
                Los dos van adjuntos a este correo en PDF. Tómate tu tiempo para leerlos con calma.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px 32px;">
              <p style="margin:24px 0 0 0;font-style:italic;color:#a855f7;font-size:13px;">Con todo el cariño,</p>
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
