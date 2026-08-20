import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { esAdmin } from '@/lib/envio/admin';

export const runtime = 'nodejs';

/**
 * Igual que /api/descargar/[tipo], pero para que la superusuaria descargue
 * el documento de CUALQUIER persona registrada con uno de sus links de
 * envío (no el suyo propio) — ver /panel. Nunca regenera nada, solo sirve
 * el PDF que ya está guardado en Storage.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ cuestionarioId: string; tipo: string }> }
) {
  const { cuestionarioId, tipo } = await params;
  if (tipo !== 'guia' && tipo !== 'carta') {
    return NextResponse.json({ error: 'Tipo de documento inválido' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!esAdmin(user?.email)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const admin = createAdminClient();

  // Confirma que el cuestionario pertenece a alguien registrado con un link
  // de envío — evita usar esta ruta para asomarse a cuentas orgánicas.
  const { data: cuestionario } = await admin
    .from('flow_cuestionarios')
    .select('id, usuario_id')
    .eq('id', cuestionarioId)
    .maybeSingle();
  if (!cuestionario) {
    return NextResponse.json({ error: 'No se encontró ese cuestionario.' }, { status: 404 });
  }

  const { data: perfil } = await admin
    .from('flow_perfiles')
    .select('envio_link_id')
    .eq('id', cuestionario.usuario_id)
    .maybeSingle();
  if (!perfil?.envio_link_id) {
    return NextResponse.json({ error: 'Esa cuenta no vino de un link de envío.' }, { status: 403 });
  }

  const { data: documento } = await admin
    .from('flow_documentos')
    .select('estado, storage_path')
    .eq('cuestionario_id', cuestionarioId)
    .eq('tipo', tipo)
    .maybeSingle();

  if (documento?.estado !== 'listo' || !documento.storage_path) {
    return NextResponse.json({ error: 'Ese documento todavía no está listo.' }, { status: 404 });
  }

  const { data: archivo, error } = await admin.storage.from('guia-del-flow').download(documento.storage_path);
  if (error || !archivo) {
    return NextResponse.json({ error: 'No se pudo descargar el archivo.' }, { status: 500 });
  }

  const nombreArchivo = tipo === 'guia' ? 'GuiaDelFlow.pdf' : 'CartaDelFlow.pdf';
  return new NextResponse(archivo, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
