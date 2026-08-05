import { createAdminClient } from '@/lib/supabase/server';

/**
 * Lee una invitación de Círculo de Crecimiento por su token, sin
 * consumirla — solo para prellenar el formulario de registro. Devuelve
 * null si el token no existe o ya fue usado (se trata como si no hubiera
 * invitación: la persona simplemente se registra normal).
 */
export async function leerInvitacion(token: string): Promise<{ nombre: string; correo: string } | null> {
  const admin = createAdminClient();

  const { data: invitacion } = await admin
    .from('guia_del_flow_invitaciones')
    .select('id, usado_at, colaborador_id')
    .eq('token', token)
    .maybeSingle();

  if (!invitacion || invitacion.usado_at) return null;

  const { data: colaborador } = await admin
    .from('colaboradores')
    .select('nombre_completo, email')
    .eq('id', invitacion.colaborador_id)
    .maybeSingle();

  if (!colaborador) return null;

  return { nombre: colaborador.nombre_completo, correo: colaborador.email ?? '' };
}

/**
 * Consume la invitación al registrarse: deja colaborador_circulo_id en
 * flow_perfiles (sincronizar.ts lo usará en vez de emparejar por correo) y
 * marca la invitación como usada. Silencioso ante cualquier error — nunca
 * debe impedir que el registro en sí termine bien.
 */
export async function vincularInvitacion(usuarioId: string, token: string): Promise<void> {
  try {
    const admin = createAdminClient();

    const { data: invitacion } = await admin
      .from('guia_del_flow_invitaciones')
      .select('id, colaborador_id, usado_at')
      .eq('token', token)
      .maybeSingle();

    if (!invitacion || invitacion.usado_at) return;

    await Promise.all([
      admin.from('flow_perfiles').update({ colaborador_circulo_id: invitacion.colaborador_id }).eq('id', usuarioId),
      admin
        .from('guia_del_flow_invitaciones')
        .update({ usado_at: new Date().toISOString(), usado_por_usuario_flow_id: usuarioId })
        .eq('id', invitacion.id),
    ]);
  } catch (error) {
    console.error('No se pudo vincular la invitación de Círculo de Crecimiento:', error);
  }
}
