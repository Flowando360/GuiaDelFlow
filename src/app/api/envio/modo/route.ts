import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * Consultado por /registro cuando llega ?envio=<id>, para saber qué texto
 * de consentimiento mostrar (ver src/lib/envio/copy.ts). Solo expone el
 * modo — nunca correo_destino ni etiqueta, esos son datos internos de la
 * superusuaria, no algo que el navegador de quien se registra deba ver.
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ modo: null });

  const admin = createAdminClient();
  const { data } = await admin.from('flow_links_envio').select('modo').eq('id', id).maybeSingle();

  return NextResponse.json({ modo: data?.modo ?? null });
}
