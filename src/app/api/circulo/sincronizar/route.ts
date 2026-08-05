import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sincronizarConCirculo } from '@/lib/circulo/sincronizar';

// Igual que generar-guia/generar-carta: necesita Node.js (llamadas a
// Claude) y un poco de margen sobre el default.
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Se dispara en segundo plano desde /resultado justo después de que la
 * Guía terminó de generarse — no bloquea ni afecta lo que ve la persona
 * llenando el cuestionario. Por eso SIEMPRE responde 200: un fallo acá
 * (persona no vinculada a ninguna empresa, error de Círculo, etc.) no debe
 * verse como un error de la Guía del Flow en sí.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, motivo: 'No autenticado' });

  try {
    const resultado = await sincronizarConCirculo(user.id);
    if (!resultado.ok) console.log('Sincronización con Círculo de Crecimiento sin acción:', resultado.motivo);
    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Error sincronizando con Círculo de Crecimiento:', error);
    return NextResponse.json({ ok: false, motivo: 'Error inesperado' });
  }
}
