import type { User } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Garantiza que exista una fila en flow_perfiles para este usuario antes de
 * dejarlo entrar a cualquier página protegida. Sin esto, una cuenta de
 * auth.users sin fila en flow_perfiles (ej. cuentas de antes de que
 * existiera esa tabla/trigger, o creadas por otro camino que no dispara
 * flow_handle_new_user) revienta con un 500 real la primera vez que
 * /cuestionario intenta insertar en flow_cuestionarios — esa tabla tiene
 * `usuario_id references flow_perfiles(id)`, así que el insert falla por
 * violación de foreign key y el error no estaba manejado.
 *
 * Encontrado en vivo el 2026-08-20: 38 cuentas reales (la mayoría del
 * piloto de Mármoles y Servicios en Círculo de Crecimiento, más 2 cuentas
 * de prueba de antes de la migración 0001) no tenían flow_perfiles. Se
 * repararon a mano una vez, pero esto evita que se repita con cualquier
 * cuenta futura que llegue a auth.users sin pasar por el trigger.
 */
export async function asegurarPerfil(user: User): Promise<void> {
  const admin = createAdminClient();

  const { data: existe } = await admin.from('flow_perfiles').select('id').eq('id', user.id).maybeSingle();
  if (existe) return;

  const nombreCompleto = (user.user_metadata?.nombre_completo as string | undefined) || user.email || 'Sin nombre';

  const { error } = await admin.from('flow_perfiles').insert({
    id: user.id,
    nombre_completo: nombreCompleto,
    email: user.email ?? '',
  });

  // Si dos requests concurrentes intentan crearlo a la vez, el segundo
  // choca con la primary key — no es un error real, la fila ya quedó bien.
  if (error && error.code !== '23505') {
    console.error('No se pudo crear flow_perfiles de respaldo:', error);
  }
}
