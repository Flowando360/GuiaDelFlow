import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generarCartaParaUsuario } from '@/lib/generacion/carta';

export const runtime = 'nodejs';
// Subido de 60 a 300 (2026-09-03): al corregir el bug de max_tokens de la
// Carta (ver src/lib/pdf/carta/generar.ts) el límite de tokens subió de
// 4000 a 8000, así que una Carta larga ahora puede tardar más en
// generarse -- 60s ya estaba justo antes ("se acercan al límite", ver
// generar-guia/route.ts), y quedarse corto acá corta la generación de la
// persona real a mitad del cuestionario, no solo un reintento.
export const maxDuration = 300;

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
