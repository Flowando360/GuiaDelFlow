import { createAdminClient } from '@/lib/supabase/server';

/**
 * Vincula la cuenta recién creada a un link de envío (?envio=<id> en
 * /registro, ver flow_links_envio en 0005_flow_links_envio.sql) — deja
 * envio_link_id en flow_perfiles para que /api/generar-carta sepa mandar el
 * correo final al destinatario configurado en el link en vez de al dueño de
 * la cuenta. Silencioso ante cualquier error o token inválido/inexistente:
 * nunca debe impedir que el registro en sí termine bien, y un link mal
 * escrito simplemente se ignora (la cuenta queda con el comportamiento
 * normal, correo al propio usuario).
 */
export async function vincularLinkEnvio(usuarioId: string, token: string): Promise<void> {
  try {
    const admin = createAdminClient();

    const { data: link } = await admin.from('flow_links_envio').select('id').eq('id', token).maybeSingle();

    if (!link) return;

    await admin.from('flow_perfiles').update({ envio_link_id: link.id }).eq('id', usuarioId);
  } catch (error) {
    console.error('No se pudo vincular el link de envío:', error);
  }
}
