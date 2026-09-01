import { createAdminClient } from '@/lib/supabase/server';
import { PanelTabla, type FilaPanel } from './PanelTabla';

/**
 * Todo el proceso de generación depende de que la persona deje su pestaña
 * abierta un par de minutos después de responder -- no hay reintento
 * automático. Este texto distingue los 3 formas en que puede quedar
 * atascado (nunca arrancó / se cortó a mitad de camino / reventó con un
 * error real) de lo que sí es solo cuestión de esperar, para que quede
 * claro cuándo conviene usar "Reintentar".
 */
function textoEstado(fila: FilaPanel): string {
  if (!fila.completado) return 'Sin terminar el cuestionario';
  if (fila.guiaEstado === 'error') return 'Error generando la Guía';
  if (fila.cartaEstado === 'error') return 'Error generando la Carta';
  if (!fila.guiaEstado) return 'Nunca se generó (la persona no llegó a iniciar)';
  if (fila.guiaEstado === 'generando' || fila.cartaEstado === 'generando') {
    return 'Generando… (si lleva más de unos minutos, probablemente se atascó)';
  }
  if (fila.guiaLista && fila.cartaLista) {
    return fila.modo === 'acompanado' && !fila.liberadoAt ? 'Lista — pendiente de liberar' : 'Completo';
  }
  return 'Generando documentos…';
}

export default async function PanelPage() {
  const admin = createAdminClient();

  // Una cuenta llega acá por dos caminos: un link de envío manual
  // (envio_link_id, ver 0005) o una invitación desde Círculo de Crecimiento
  // (colaborador_circulo_id, ver 0004) -- este segundo es el camino real de
  // casi todos los colaboradores hoy (Mármoles y Servicios y las empresas
  // que vengan después). Cuentas sin ninguno de los dos (registro público
  // orgánico, sin relación con ningún cliente) quedan afuera a propósito.
  const { data: perfiles } = await admin
    .from('flow_perfiles')
    .select('id, nombre_completo, email, envio_link_id, colaborador_circulo_id')
    .or('envio_link_id.not.is.null,colaborador_circulo_id.not.is.null')
    .order('created_at', { ascending: false });

  if (!perfiles || perfiles.length === 0) {
    return <PanelVacio />;
  }

  const linkIds = [...new Set(perfiles.map((p) => p.envio_link_id).filter((id): id is string => Boolean(id)))];
  const colaboradorIds = [
    ...new Set(perfiles.map((p) => p.colaborador_circulo_id).filter((id): id is string => Boolean(id))),
  ];
  const usuarioIds = perfiles.map((p) => p.id);

  const [{ data: links }, { data: cuestionarios }, { data: colaboradores }] = await Promise.all([
    linkIds.length > 0
      ? admin.from('flow_links_envio').select('id, etiqueta, modo, correo_destino').in('id', linkIds)
      : Promise.resolve({ data: [] as { id: string; etiqueta: string | null; modo: string; correo_destino: string | null }[] }),
    admin
      .from('flow_cuestionarios')
      .select('id, usuario_id, completado_at, liberado_at, created_at')
      .in('usuario_id', usuarioIds)
      .order('created_at', { ascending: false }),
    colaboradorIds.length > 0
      ? admin.from('colaboradores').select('id, empresa_id').in('id', colaboradorIds)
      : Promise.resolve({ data: [] as { id: string; empresa_id: string }[] }),
  ]);

  const empresaIds = [...new Set((colaboradores ?? []).map((c) => c.empresa_id))];
  // "siglas" (Círculo de Crecimiento, migración 0064 de ese repo) es lo que
  // arma el nombre de archivo de la descarga masiva -- ver
  // src/lib/panel/nombreArchivo.ts. Si una empresa no la tiene cargada
  // todavía, esa función cae sola a "PS".
  const { data: empresas } =
    empresaIds.length > 0
      ? await admin.from('empresas').select('id, nombre, siglas').in('id', empresaIds)
      : { data: [] as { id: string; nombre: string; siglas: string | null }[] };

  const empresaPorId = new Map((empresas ?? []).map((e) => [e.id, e]));
  const empresaPorColaborador = new Map(
    (colaboradores ?? []).map((c) => [c.id, empresaPorId.get(c.empresa_id) ?? null])
  );

  const linkPorId = new Map((links ?? []).map((l) => [l.id, l]));

  // Un usuario puede tener más de un intento de cuestionario — nos
  // quedamos con el más reciente de cada uno (ya vienen ordenados desc).
  const cuestionarioPorUsuario = new Map<string, NonNullable<typeof cuestionarios>[number]>();
  for (const c of cuestionarios ?? []) {
    if (!cuestionarioPorUsuario.has(c.usuario_id)) cuestionarioPorUsuario.set(c.usuario_id, c);
  }

  const cuestionarioIds = [...cuestionarioPorUsuario.values()].map((c) => c.id);
  const { data: documentos } = await admin
    .from('flow_documentos')
    .select('cuestionario_id, tipo, estado, generado_at')
    .in('cuestionario_id', cuestionarioIds);

  const docsPorCuestionario = new Map<string, { guia?: string; carta?: string; guiaAt?: string; cartaAt?: string }>();
  for (const d of documentos ?? []) {
    const actual = docsPorCuestionario.get(d.cuestionario_id) ?? {};
    actual[d.tipo as 'guia' | 'carta'] = d.estado;
    if (d.generado_at) actual[d.tipo === 'guia' ? 'guiaAt' : 'cartaAt'] = d.generado_at;
    docsPorCuestionario.set(d.cuestionario_id, actual);
  }

  const filas: FilaPanel[] = perfiles.map((p) => {
    const link = p.envio_link_id ? linkPorId.get(p.envio_link_id) : undefined;
    const empresa = p.colaborador_circulo_id ? (empresaPorColaborador.get(p.colaborador_circulo_id) ?? null) : null;
    const cuestionario = cuestionarioPorUsuario.get(p.id);
    const docs = cuestionario ? (docsPorCuestionario.get(cuestionario.id) ?? {}) : {};
    // La "fecha de generación" para filtrar es la más reciente entre Guía y
    // Carta -- normalmente casi seguidas, pero si solo una está lista se usa
    // esa sola.
    const fechas = [docs.guiaAt, docs.cartaAt].filter((f): f is string => Boolean(f));
    const fechaGeneracion = fechas.length > 0 ? fechas.sort().at(-1)! : null;

    const fila: FilaPanel = {
      usuarioId: p.id,
      nombre: p.nombre_completo,
      email: p.email,
      empresa: empresa?.nombre ?? null,
      empresaSiglas: empresa?.siglas ?? null,
      etiqueta: link?.etiqueta ?? null,
      modo: link?.modo ?? 'directo',
      cuestionarioId: cuestionario?.id ?? null,
      completado: Boolean(cuestionario?.completado_at),
      liberadoAt: cuestionario?.liberado_at ?? null,
      guiaLista: docs.guia === 'listo',
      cartaLista: docs.carta === 'listo',
      guiaEstado: docs.guia ?? null,
      cartaEstado: docs.carta ?? null,
      fechaGeneracion,
      estadoTexto: '',
    };
    fila.estadoTexto = textoEstado(fila);
    return fila;
  });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-8">
      <p className="text-xs font-bold uppercase tracking-widest text-flow-600">Guía del Flow · Panel</p>
      <h1 className="mt-1 font-serif text-2xl font-bold text-flow-900">Tus registros</h1>
      <p className="mt-2 text-sm text-flow-800">
        Personas que se registraron con alguno de tus links de envío, o invitadas desde Círculo de Crecimiento
        por una empresa cliente. Desde acá puedes descargar su Guía y su Carta, y liberarlas cuando el link es
        de modo acompañado.
      </p>

      <PanelTabla filas={filas} />
    </main>
  );
}

function PanelVacio() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-flow-600">Guía del Flow · Panel</p>
      <h1 className="mt-1 font-serif text-2xl font-bold text-flow-900">Todavía no hay registros</h1>
      <p className="mt-3 text-sm text-flow-800">
        Cuando alguien se registre con uno de tus links de envío, aparecerá aquí.
      </p>
    </main>
  );
}
