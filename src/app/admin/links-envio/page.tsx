import { redirect } from 'next/navigation';

/**
 * Esta pantalla se movió a /panel/links (parte del dashboard de
 * superusuaria) — se deja este redirect por si alguien todavía tiene esta
 * URL guardada.
 */
export default function LinksEnvioRedirect() {
  redirect('/panel/links');
}
