'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type RespuestasJson = Record<string, unknown>;

/** Merge de un nivel de profundidad — así "likert" se va acumulando entre
 * pasos en vez de pisarse (cada paso Likert solo manda sus propios
 * códigos, no todos los que ya se habían guardado antes). */
function mergeUnNivel(base: RespuestasJson, parcial: RespuestasJson): RespuestasJson {
  const resultado: RespuestasJson = { ...base };
  for (const [clave, valor] of Object.entries(parcial)) {
    const actual = resultado[clave];
    if (
      valor &&
      typeof valor === 'object' &&
      !Array.isArray(valor) &&
      actual &&
      typeof actual === 'object' &&
      !Array.isArray(actual)
    ) {
      resultado[clave] = { ...(actual as RespuestasJson), ...(valor as RespuestasJson) };
    } else {
      resultado[clave] = valor;
    }
  }
  return resultado;
}

async function usuarioActual() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return { supabase, user: user! };
}

export async function guardarPaso(cuestionarioId: string, parcial: RespuestasJson) {
  const { supabase } = await usuarioActual();

  const { data: actual, error: errorLectura } = await supabase
    .from('flow_cuestionarios')
    .select('respuestas')
    .eq('id', cuestionarioId)
    .single();
  if (errorLectura) throw errorLectura;

  const nuevasRespuestas = mergeUnNivel((actual?.respuestas as RespuestasJson) ?? {}, parcial);

  const { error } = await supabase
    .from('flow_cuestionarios')
    .update({ respuestas: nuevasRespuestas, updated_at: new Date().toISOString() })
    .eq('id', cuestionarioId);
  if (error) throw error;
}

export async function finalizarCuestionario(cuestionarioId: string, parcial: RespuestasJson) {
  await guardarPaso(cuestionarioId, parcial);

  const { supabase } = await usuarioActual();
  const { error } = await supabase
    .from('flow_cuestionarios')
    .update({ completado_at: new Date().toISOString() })
    .eq('id', cuestionarioId);
  if (error) throw error;

  redirect('/resultado');
}
