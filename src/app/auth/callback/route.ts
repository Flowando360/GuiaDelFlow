import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * A donde Supabase redirige después de que la persona hace click en el
 * link de confirmación de su email (ver emailRedirectTo en
 * src/app/(auth)/registro/actions.ts). Intercambia el código por una
 * sesión y la manda directo al cuestionario.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const siguiente = searchParams.get('next') ?? '/cuestionario';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${siguiente}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=No pudimos confirmar tu cuenta, intentá de nuevo.`);
}
