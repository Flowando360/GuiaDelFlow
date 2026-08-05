import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * Sirve el PDF (Guía o Carta) directamente desde nuestro propio dominio,
 * con Content-Disposition: attachment. Antes el botón "Descargar" era un
 * <a href> apuntando directo a una URL firmada de Supabase Storage (otro
 * dominio) sin atributo `download` — el navegador podía abrirlo inline en
 * vez de descargarlo, y en máquinas con la extensión de Adobe Acrobat
 * instalada, esa extensión a veces intercepta el PDF y falla en vez de
 * mostrarlo. Sirviéndolo nosotros mismos con el header correcto se evita
 * depender del comportamiento del visor/extensión de cada usuario.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params;
  if (tipo !== 'guia' && tipo !== 'carta') {
    return NextResponse.json({ error: 'Tipo de documento inválido' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: cuestionario } = await supabase
    .from('flow_cuestionarios')
    .select('id')
    .eq('usuario_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!cuestionario) {
    return NextResponse.json({ error: 'No se encontró tu cuestionario.' }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data: documento } = await admin
    .from('flow_documentos')
    .select('estado, storage_path')
    .eq('cuestionario_id', cuestionario.id)
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
