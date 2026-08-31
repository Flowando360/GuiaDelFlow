import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generarCartaParaUsuario } from '@/lib/generacion/carta';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const resultado = await generarCartaParaUsuario(user.id);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: 500 });
  }
  return NextResponse.json(resultado);
}
