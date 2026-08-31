import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generarGuiaParaUsuario } from '@/lib/generacion/guia';

// Puppeteer necesita Node.js (no Edge), y la llamada a Claude + el
// render del PDF se acercan al límite de 60s del plan Hobby de Vercel.
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const resultado = await generarGuiaParaUsuario(user.id);
  if (!resultado.ok) {
    // "No se encontró..." / "Todavía no terminó..." son mensajes pensados
    // para mostrarse tal cual (ver generarGuiaParaUsuario) -- el resto son
    // errores internos, se muestran igual pero quedan además en logs.
    return NextResponse.json({ error: resultado.error }, { status: 500 });
  }
  return NextResponse.json(resultado);
}
