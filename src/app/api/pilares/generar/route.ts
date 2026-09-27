import { NextResponse } from 'next/server';
import { generarPdfSesionPilares } from '@/lib/generacion/pilares';

export const runtime = 'nodejs';
// Mismo margen que /api/generar-carta: Puppeteer + (si hace falta) Claude
// para 7 páginas puede acercarse al límite por defecto.
export const maxDuration = 300;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const sesionId = body?.sesionId;
  const correo = body?.correo;
  if (!sesionId || typeof sesionId !== 'string') {
    return NextResponse.json({ error: 'Falta sesionId.' }, { status: 400 });
  }
  if (correo !== undefined && (typeof correo !== 'string' || !correo.includes('@'))) {
    return NextResponse.json({ error: 'Ese correo no parece válido.' }, { status: 400 });
  }

  const resultado = await generarPdfSesionPilares(sesionId, typeof correo === 'string' ? correo.trim().toLowerCase() : undefined);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: 500 });
  }
  return NextResponse.json(resultado);
}
