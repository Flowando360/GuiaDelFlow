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

    // autorizacion_envio_en queda como constancia de que la persona vio y
    // aceptó la casilla de consentimiento del link (ver registro/page.tsx)
    // antes de que su cuenta quedara vinculada — mismo patrón que
    // autorizacion_circulo_en.
    await admin
      .from('flow_perfiles')
      .update({ envio_link_id: link.id, autorizacion_envio_en: new Date().toISOString() })
      .eq('id', usuarioId);
  } catch (error) {
    console.error('No se pudo vincular el link de envío:', error);
  }
}
