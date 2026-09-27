import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * Sirve el PDF de "Los 4 Pilares" directamente desde nuestro dominio (mismo
 * motivo que /api/descargar/[tipo]: Content-Disposition: attachment
 * explícito). Sin cuenta: el id de la sesión en la URL ES la credencial —
 * mismo modelo de confianza que el resto de este juego (ver migración
 * 0010).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ sesionId: string }> }) {
  const { sesionId } = await params;

  const admin = createAdminClient();
  const { data: sesion } = await admin
    .from('flow_pilares_sesiones')
    .select('estado, storage_path')
    .eq('id', sesionId)
    .maybeSingle();

  if (sesion?.estado !== 'listo' || !sesion.storage_path) {
    return NextResponse.json({ error: 'Ese documento todavía no está listo.' }, { status: 404 });
  }

  const { data: archivo, error } = await admin.storage.from('pilares-del-flow').download(sesion.storage_path);
  if (error || !archivo) {
    return NextResponse.json({ error: 'No se pudo descargar el archivo.' }, { status: 500 });
  }

  return new NextResponse(archivo, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="Los4Pilares.pdf"',
      'Cache-Control': 'private, no-store',
    },
  });
}
