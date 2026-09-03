import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { esAdmin } from '@/lib/envio/admin';
import { nombreArchivoPdf } from '@/lib/panel/nombreArchivo';

export const runtime = 'nodejs';

/**
 * Igual que /api/descargar/[tipo], pero para que la superusuaria descargue
 * el documento de cualquier persona registrada con uno de sus links de
 * envío, o invitada desde Círculo de Crecimiento por una empresa cliente
 * (no el suyo propio) — ver /panel. Nunca regenera nada, solo sirve el PDF
 * que ya está guardado en Storage.
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
  // de envío o invitado desde Círculo de Crecimiento — evita usar esta ruta
  // para asomarse a cuentas orgánicas (registro público sin relación con
  // ningún cliente).
  const { data: cuestionario } = await admin
    .from('flow_cuestionarios')
    .select('id, usuario_id, respuestas')
    .eq('id', cuestionarioId)
    .maybeSingle();
  if (!cuestionario) {
    return NextResponse.json({ error: 'No se encontró ese cuestionario.' }, { status: 404 });
  }

  const { data: perfil } = await admin
    .from('flow_perfiles')
    .select('nombre_completo, envio_link_id, colaborador_circulo_id')
    .eq('id', cuestionario.usuario_id)
    .maybeSingle();
  if (!perfil?.envio_link_id && !perfil?.colaborador_circulo_id) {
    return NextResponse.json({ error: 'Esa cuenta no vino de un link tuyo ni de una invitación.' }, { status: 403 });
  }

  // Mismas siglas que usa la descarga masiva (empresas.siglas de Círculo de
  // Crecimiento) -- "PS" si no está ligada a ninguna empresa o esa empresa
  // no tiene siglas cargadas.
  let siglas: string | null = null;
  if (perfil.colaborador_circulo_id) {
    const { data: colaborador } = await admin
      .from('colaboradores')
      .select('empresa_id')
      .eq('id', perfil.colaborador_circulo_id)
      .maybeSingle();
    if (colaborador?.empresa_id) {
      const { data: empresa } = await admin.from('empresas').select('siglas').eq('id', colaborador.empresa_id).maybeSingle();
      siglas = empresa?.siglas ?? null;
    }
  }
  const respuestas = cuestionario.respuestas as { demograficos?: { apodo?: string } } | null;

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

  const nombreArchivo = nombreArchivoPdf(tipo, perfil.nombre_completo || 'Sin_nombre', siglas, respuestas?.demograficos?.apodo);
  // A diferencia del nombre fijo de antes ("GuiaDelFlow.pdf"), este nombre
  // puede traer tildes/ñ (viene del nombre real de la persona) -- un
  // Content-Disposition con esos caracteres sueltos no es válido por spec
  // en todos los navegadores. filename= lleva una versión sin tildes como
  // respaldo, y filename*= (RFC 5987) lleva el nombre real -- los
  // navegadores modernos usan ese segundo.
  const nombreAscii = nombreArchivo.normalize('NFD').replace(/[̀-ͯ]/g, '');
  return new NextResponse(archivo, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nombreAscii}"; filename*=UTF-8''${encodeURIComponent(nombreArchivo)}`,
      'Cache-Control': 'private, no-store',
    },
  });
}
