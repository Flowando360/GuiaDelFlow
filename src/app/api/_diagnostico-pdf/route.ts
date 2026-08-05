import { NextResponse } from 'next/server';
import { htmlAPdf } from '@/lib/pdf/navegador';

// Ruta TEMPORAL para verificar que Puppeteer + @sparticuz/chromium
// funcionan de verdad en el runtime de Vercel (todas las pruebas locales
// usaron la rama de Chromium de desarrollo). Se borra después de
// confirmar. Sin auth a propósito, para poder probarla con un curl
// directo sin necesitar sesión.
export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET() {
  try {
    const inicio = Date.now();
    const pdf = await htmlAPdf('<html><body><h1>Diagnóstico OK</h1></body></html>', {
      anchoPulgadas: 5.5,
      altoPulgadas: 8.5,
    });
    return NextResponse.json({
      ok: true,
      bytes: pdf.length,
      ms: Date.now() - inicio,
      vercel: Boolean(process.env.VERCEL),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.stack : String(error) },
      { status: 500 }
    );
  }
}
