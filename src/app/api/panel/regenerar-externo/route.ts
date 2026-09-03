import { NextRequest, NextResponse } from 'next/server';
import { generarGuiaParaUsuario } from '@/lib/generacion/guia';
import { generarCartaParaUsuario } from '@/lib/generacion/carta';

// Igual que /api/generar-guia y /api/generar-carta: Puppeteer necesita
// Node.js, y la llamada a Claude + el render del PDF se acercan al límite
// de 60s del plan Hobby de Vercel.
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Versión de "Reintentar" (ver regenerarDocumentos en /panel/actions.ts)
 * pensada para dispararse DESDE OTRA APP, no desde una sesión de admin acá
 * -- concretamente, desde el botón "Reintentar" que Círculo de Crecimiento
 * ofrece en su pantalla de Seguimiento (Fase de 2026-09-03) para que un
 * líder de Talento Humano pueda reintentar los documentos de alguien de su
 * empresa sin tener que loguearse acá. No hay sesión de admin que
 * verificar (la otra app no tiene ninguna cuenta de guiadelflow), así que
 * la autorización es un secreto compartido por header en vez de esAdmin().
 *
 * El mismo secreto debe existir en las dos apps con el mismo valor
 * (GUIA_FLOW_PANEL_SECRET) -- ver también GUIADELFLOW_URL en el otro repo.
 */
export async function POST(req: NextRequest) {
  const secreto = process.env.GUIA_FLOW_PANEL_SECRET;
  if (!secreto) {
    console.error('GUIA_FLOW_PANEL_SECRET no está configurado -- este endpoint queda inservible hasta que se configure.');
    return NextResponse.json({ ok: false, error: 'Endpoint no configurado.' }, { status: 500 });
  }
  if (req.headers.get('x-panel-secret') !== secreto) {
    return NextResponse.json({ ok: false, error: 'No autorizado.' }, { status: 401 });
  }

  const usuarioId = String((await req.json().catch(() => ({})))?.usuarioId ?? '');
  if (!usuarioId) {
    return NextResponse.json({ ok: false, error: 'Falta usuarioId.' }, { status: 400 });
  }

  const resultadoGuia = await generarGuiaParaUsuario(usuarioId);
  if (!resultadoGuia.ok) {
    return NextResponse.json({ ok: false, error: `Guía: ${resultadoGuia.error}` }, { status: 500 });
  }

  const resultadoCarta = await generarCartaParaUsuario(usuarioId);
  if (!resultadoCarta.ok) {
    return NextResponse.json({ ok: false, error: `Carta: ${resultadoCarta.error}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
