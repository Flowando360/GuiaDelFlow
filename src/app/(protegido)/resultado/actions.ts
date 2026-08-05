'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Da o retira la autorización de compartir un resumen de los 18 aspectos
 * seguros con la empresa (Círculo de Crecimiento). Retirarla no borra lo
 * que ya se compartió antes — solo evita que se comparta más hacia
 * adelante (una futura sincronización, si vuelve a generar su Guía).
 */
export async function actualizarAutorizacionCirculo(autoriza: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'No autenticado' };

  const { error } = await supabase
    .from('flow_perfiles')
    .update({ autorizacion_circulo_en: autoriza ? new Date().toISOString() : null })
    .eq('id', user.id);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/resultado');
  return { ok: true as const };
}
