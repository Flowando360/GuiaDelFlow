import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { esAdmin } from '@/lib/envio/admin';
import { nombreArchivoPdf } from '@/lib/panel/nombreArchivo';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface ItemPedido {
  usuarioId: string;
  cuestionarioId: string | null;
}

/**
 * Descarga masiva desde /panel (ver PanelTabla.tsx): recibe una lista de
 * usuarios ya filtrados/seleccionados en el cliente, pero todo lo que
 * decide qué se incluye y cómo se llama cada archivo se recalcula acá con
 * datos frescos de la base -- nunca se confía en nombres/rutas que mande
 * el navegador. Arma un solo .zip con los PDF de Guía y Carta que estén
 * "listo", nombrados "GF_nombre_Siglas.pdf" / "Carta_nombre_Siglas.pdf".
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!esAdmin(user?.email)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  let items: ItemPedido[];
  try {
    const body = await req.json();
    items = Array.isArray(body.items) ? body.items : [];
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 });
  }
  items = items.filter((it) => it && typeof it.usuarioId === 'string' && typeof it.cuestionarioId === 'string');
  if (items.length === 0) {
    return NextResponse.json({ error: 'No hay nada seleccionado.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const usuarioIds = items.map((it) => it.usuarioId);
  const cuestionarioIds = items.map((it) => it.cuestionarioId!);

  const [{ data: perfiles }, { data: documentos }] = await Promise.all([
    admin.from('flow_perfiles').select('id, nombre_completo, colaborador_circulo_id').in('id', usuarioIds),
    admin
      .from('flow_documentos')
      .select('cuestionario_id, tipo, estado, storage_path')
      .in('cuestionario_id', cuestionarioIds)
      .eq('estado', 'listo'),
  ]);

  const colaboradorIds = [
    ...new Set((perfiles ?? []).map((p) => p.colaborador_circulo_id).filter((id): id is string => Boolean(id))),
  ];
  const { data: colaboradores } =
    colaboradorIds.length > 0
      ? await admin.from('colaboradores').select('id, empresa_id').in('id', colaboradorIds)
      : { data: [] as { id: string; empresa_id: string }[] };

  const empresaIds = [...new Set((colaboradores ?? []).map((c) => c.empresa_id))];
  const { data: empresas } =
    empresaIds.length > 0
      ? await admin.from('empresas').select('id, siglas').in('id', empresaIds)
      : { data: [] as { id: string; siglas: string | null }[] };

  const siglasPorEmpresa = new Map((empresas ?? []).map((e) => [e.id, e.siglas]));
  const empresaPorColaborador = new Map((colaboradores ?? []).map((c) => [c.id, c.empresa_id]));
  const perfilPorId = new Map((perfiles ?? []).map((p) => [p.id, p]));

  const documentosPorCuestionario = new Map<string, { guia?: string; carta?: string }>();
  for (const d of documentos ?? []) {
    if (!d.storage_path) continue;
    const actual = documentosPorCuestionario.get(d.cuestionario_id) ?? {};
    actual[d.tipo as 'guia' | 'carta'] = d.storage_path;
    documentosPorCuestionario.set(d.cuestionario_id, actual);
  }

  const zip = new JSZip();
  const nombresUsados = new Map<string, number>();
  let agregados = 0;

  function nombreSinChocar(base: string): string {
    const usos = nombresUsados.get(base) ?? 0;
    nombresUsados.set(base, usos + 1);
    if (usos === 0) return base;
    return base.replace(/\.pdf$/, `_${usos + 1}.pdf`);
  }

  for (const item of items) {
    const perfil = perfilPorId.get(item.usuarioId);
    if (!perfil) continue;
    const docs = documentosPorCuestionario.get(item.cuestionarioId!) ?? {};
    const empresaId = perfil.colaborador_circulo_id ? empresaPorColaborador.get(perfil.colaborador_circulo_id) : null;
    const siglas = empresaId ? (siglasPorEmpresa.get(empresaId) ?? null) : null;

    for (const [tipo, path] of [
      ['guia', docs.guia],
      ['carta', docs.carta],
    ] as const) {
      if (!path) continue;
      const { data: archivo, error } = await admin.storage.from('guia-del-flow').download(path);
      if (error || !archivo) continue;
      const nombre = nombreSinChocar(nombreArchivoPdf(tipo, perfil.nombre_completo, siglas));
      zip.file(nombre, await archivo.arrayBuffer());
      agregados++;
    }
  }

  if (agregados === 0) {
    return NextResponse.json({ error: 'Ninguno de los seleccionados tiene documentos listos todavía.' }, { status: 400 });
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return new NextResponse(zipBlob, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="guia-del-flow.zip"',
      'Cache-Control': 'private, no-store',
    },
  });
}
