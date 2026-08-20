/**
 * Lista de correos con permiso para crear links de envío (ver
 * /admin/links-envio). Configurable con ADMIN_EMAILS (separados por coma)
 * sin necesidad de redeploy de código — si no está seteada, cae al correo
 * del dueño de FlowAndo.
 */
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? 'innovacion@flowando.com')
  .split(',')
  .map((correo) => correo.trim().toLowerCase())
  .filter(Boolean);

export function esAdmin(email: string | null | undefined): boolean {
  return Boolean(email) && ADMIN_EMAILS.includes(email!.toLowerCase());
}
