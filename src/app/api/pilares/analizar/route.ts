import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { analizarSesionPilares } from '@/lib/generacion/pilares';
import type { RespuestasHistoria } from '@/lib/pilares/contenido';

export const runtime = 'nodejs';
// Solo llama a Claude (sin Puppeteer) -- más corto que /api/pilares/generar,
// pero con margen: la respuesta estructurada de 7 páginas puede tardar.
export const maxDuration = 120;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const sesionId = body?.sesionId;
  const historia = body?.historia as RespuestasHistoria | undefined;
  if (!sesionId || typeof sesionId !== 'string') {
    return NextResponse.json({ error: 'Falta sesionId.' }, { status: 400 });
  }
  if (!historia?.momento_antes?.trim() || !historia?.momento_despues?.trim() || !historia?.titulo?.trim()) {
    return NextResponse.json({ error: 'Falta completar tu historia.' }, { status: 400 });
  }

  const admin = createAdminClient();
  await admin.from('flow_pilares_sesiones').update({ historia }).eq('id', sesionId);

  const resultado = await analizarSesionPilares(sesionId);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: 500 });
  }
  return NextResponse.json(resultado);
}
