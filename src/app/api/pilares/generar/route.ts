import { NextResponse } from 'next/server';
import { generarPilaresParaSesion } from '@/lib/generacion/pilares';

export const runtime = 'nodejs';
// Mismo margen que /api/generar-carta: Puppeteer + Claude para 7 páginas
// puede acercarse al límite por defecto.
export const maxDuration = 300;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const sesionId = body?.sesionId;
  if (!sesionId || typeof sesionId !== 'string') {
    return NextResponse.json({ error: 'Falta sesionId.' }, { status: 400 });
  }

  const resultado = await generarPilaresParaSesion(sesionId);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: 500 });
  }
  return NextResponse.json(resultado);
}
