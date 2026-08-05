import { createAdminClient } from '@/lib/supabase/server';
import { clienteClaude } from '@/lib/claude/cliente';
import { KNOWLEDGE_BASE } from '@/lib/kb/knowledgeBase';
import type { ResultadoAspecto, ResultadosCalculados } from '@/lib/calculo/tipos';

/**
 * Puente hacia Círculo de Crecimiento (mismo proyecto de Supabase, prefijo
 * sin "flow_" — ver README de este repo). Se ejecuta después de que se
 * calculan los 30 aspectos de una persona (ver src/app/api/generar-guia).
 *
 * Regla de privacidad — NUNCA se toca desde acá:
 *   - El PDF de la Guía (ni la Carta) no tienen ningún papel aquí.
 *   - Solo cruzan los 18 aspectos con relevancia laboral (ASPECTOS_TIPO_UNICO
 *     + ASPECTOS_ESCALA + las 3 Inteligencias). Los 12 psicológicos/íntimos
 *     (ETAPA_FLOW, DesafioInterior, Desafio_Sanacion, Niñez, Dependencia,
 *     Pasado, Felicidad, Frustración, Estabilidad_Emocional, Pertenencia,
 *     Desafio_Libera, CualidadesPotencia, Integra — y TALENTO_UNICO, que
 *     tampoco tiene fila en el catálogo de Círculo) ni se leen.
 *   - Círculo de Crecimiento ya bloquea a nivel de RLS que cualquier rol
 *     lea/escriba esos 12 aspectos (ver 0051_ser_privacidad_organizacional.sql
 *     en el repo de Círculo de Crecimiento) — esto es una segunda capa,
 *     no la única.
 */

type AspectoSeguro = { nombre: string; puntaje: number; nota: string | null };

// Sin escala real (numerología / signo / fecha) — no hay "más o menos", son
// un tipo. Puntaje neutro fijo; lo que importa es la nota (su título real).
const ASPECTOS_TIPO_UNICO: { clave: keyof ResultadosCalculados; nombre: string }[] = [
  { clave: 'CARACTER', nombre: 'Carácter' },
  { clave: 'TEMPERAMENTO', nombre: 'Temperamento' },
  { clave: 'Talento_Innato', nombre: 'Talentos innatos' },
  { clave: 'Talento_Potenciar', nombre: 'Talentos para potenciar' },
  { clave: 'Proposito_1', nombre: 'Propósito – Intuición' },
  { clave: 'Proposito_2', nombre: 'Propósito – Equilibrio' },
];

// suma_likert: 3 buckets reales (bajo/medio/alto) — sí hay grado real.
const ASPECTOS_ESCALA: { clave: keyof ResultadosCalculados; nombre: string; kb: keyof typeof KNOWLEDGE_BASE }[] = [
  { clave: 'Liderazgo_1', nombre: 'Liderazgo – Inspirar', kb: 'Liderazgo_1' },
  { clave: 'Liderazgo_2', nombre: 'Liderazgo – Transformacional', kb: 'Liderazgo_2' },
  { clave: 'Comunicación', nombre: 'Comunicación', kb: 'Comunicación' },
  { clave: 'TrabajoEnEquipo', nombre: 'Trabajo en equipo', kb: 'TrabajoEnEquipo' },
  { clave: 'Responsabilidad', nombre: 'Responsabilidad', kb: 'Responsabilidad' },
  { clave: 'Compromiso', nombre: 'Compromiso', kb: 'Compromiso' },
  { clave: 'Cambios', nombre: 'Adaptación al cambio', kb: 'Cambios' },
  { clave: 'Negociación', nombre: 'Negociación', kb: 'Negociación' },
  { clave: 'Recursividad', nombre: 'Recursividad', kb: 'Recursividad' },
];

// El catálogo de Círculo solo tiene 3 slots de "Inteligencia" (posición, no
// tipo fijo — de las hasta 9 que calcularInteligencias() puede activar, se
// toman las 3 primeras en el orden del knowledge_base). El nombre real de
// cada una (musical, lógica, espacial, etc.) queda en la nota, no en el
// nombre del slot.
const NOMBRES_INTELIGENCIAS = ['Inteligencia musical', 'Inteligencia naturaleza', 'Inteligencia expresiva'];

function puntajeEscala(resultado: ResultadoAspecto, todos: readonly ResultadoAspecto[]): number {
  const ordenado = [...todos].sort((a, b) => Number(a.min) - Number(b.min));
  const idx = ordenado.findIndex(
    (r) => Number(r.min) === Number(resultado.min) && Number(r.max) === Number(resultado.max)
  );
  return ([2, 3, 5] as const)[idx] ?? 4;
}

export function aspectosSeguros(resultados: ResultadosCalculados): AspectoSeguro[] {
  const salida: AspectoSeguro[] = [];

  for (const { clave, nombre } of ASPECTOS_TIPO_UNICO) {
    const r = resultados[clave] as ResultadoAspecto | undefined;
    salida.push({ nombre, puntaje: 4, nota: (r?.titulo as string | undefined) ?? null });
  }

  for (const { clave, nombre, kb } of ASPECTOS_ESCALA) {
    const r = resultados[clave] as ResultadoAspecto | undefined;
    if (!r) continue;
    const todos = KNOWLEDGE_BASE[kb].resultados as unknown as ResultadoAspecto[];
    salida.push({ nombre, puntaje: puntajeEscala(r, todos), nota: (r.titulo as string | undefined) ?? null });
  }

  (resultados.Inteligencias ?? []).slice(0, 3).forEach((r, i) => {
    salida.push({ nombre: NOMBRES_INTELIGENCIAS[i], puntaje: 4, nota: (r?.titulo as string | undefined) ?? null });
  });

  return salida;
}

// ── Mismos dos system prompts que ya existen en Círculo de Crecimiento
// (src/app/(dashboard)/circulo-crecimiento/colaboradores/[id]/guia-flow/
// actions.ts → generarInformesSer). Si se ajustan allá, ajustar acá también.

const SYSTEM_INFORME_LIDER = `Eres un asistente de Talento Humano. A partir de una lista de aspectos profesionales evaluados en escala 1-5 (talentos, propósito, estilo de liderazgo, comunicación, trabajo en equipo, compromiso, adaptación al cambio, negociación, recursividad), escribe en español un informe breve (200-300 palabras) dirigido al LÍDER de esa persona, para que enfoque su Plan de Desarrollo Individual.

Estructura: (1) talentos a aprovechar, (2) qué la/lo motiva, (3) cómo comunicarse y liderarla/o, (4) 2-3 sugerencias concretas para el PDI. Tono profesional, cálido y orientado a la acción.

IMPORTANTE: solo tienes los aspectos de la lista. No tienes ni debes mencionar infancia, pasado, estabilidad emocional, felicidad, dependencia, sanación, frustración, sentido de pertenencia ni ningún tema psicológico o de vida personal — esa información existe pero es privada y nunca te fue entregada. No la inventes ni sugieras que existe.`;

const SYSTEM_INFORME_COLABORADOR = `Eres un asistente de desarrollo profesional. A partir de una lista de aspectos profesionales evaluados en escala 1-5 (talentos, propósito, estilo de liderazgo, comunicación, trabajo en equipo, compromiso, adaptación al cambio, negociación, recursividad), escribe en español un informe breve (200-300 palabras) dirigido DIRECTAMENTE a esa persona (en segunda persona, tono cercano y alentador), que le ayude a recordar en qué es fuerte profesionalmente y en qué puede seguir trabajando.

Aclara que esto es un complemento breve, no un reemplazo de su Guía del Flow completa (que ya recibió por su cuenta). Cierra con una invitación a seguir explorando esa Guía si quiere profundizar en su autoconocimiento.

IMPORTANTE: solo tienes los aspectos de la lista. No tienes ni debes mencionar infancia, pasado, estabilidad emocional, felicidad, dependencia, sanación, frustración, sentido de pertenencia ni ningún tema psicológico o de vida personal — esa información existe pero es privada y nunca te fue entregada. No la inventes ni sugieras que existe.`;

async function pedirInforme(system: string, listaAspectos: string): Promise<string> {
  const respuesta = await clienteClaude().messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 700,
    system,
    messages: [{ role: 'user', content: `Aspectos evaluados (escala 1-5):\n${listaAspectos}` }],
  });
  const bloque = respuesta.content.find((b) => b.type === 'text');
  return bloque && bloque.type === 'text' ? bloque.text : '';
}

type ResultadoSincronizacion = { ok: boolean; motivo: string };
type ResultadoBitacora = 'vinculado' | 'sin_colaborador' | 'correo_ambiguo' | 'error';

/**
 * Deja rastro de CADA intento (con o sin match) en
 * guia_del_flow_sincronizaciones, para que admin_th pueda ver en Círculo de
 * Crecimiento los casos que no encontraron a nadie (típicamente: correo
 * distinto al que tiene cargado su ficha) y no solo los que sí funcionaron.
 * Nunca lanza — un fallo acá no debe tumbar la sincronización real.
 */
async function registrarIntento(
  admin: ReturnType<typeof createAdminClient>,
  datos: {
    correo: string;
    nombreFlow: string | null;
    resultado: ResultadoBitacora;
    detalle?: string;
    colaboradorId?: string;
    empresaId?: string;
    guiaDelFlowId?: string;
  }
) {
  try {
    await admin.from('guia_del_flow_sincronizaciones').insert({
      correo: datos.correo,
      nombre_flow: datos.nombreFlow,
      resultado: datos.resultado,
      detalle: datos.detalle ?? null,
      colaborador_id: datos.colaboradorId ?? null,
      empresa_id: datos.empresaId ?? null,
      guia_del_flow_id: datos.guiaDelFlowId ?? null,
    });
  } catch (error) {
    console.error('No se pudo registrar el intento de sincronización en la bitácora:', error);
  }
}

/**
 * Empareja a la persona (por correo) con un colaborador de Círculo de
 * Crecimiento, carga los 18 aspectos seguros y genera sus dos informes.
 * No hace nada distinto (y no revienta) si la persona no es colaboradora de
 * ninguna empresa cliente — sigue teniendo su Guía y Carta completas igual;
 * solo queda un registro en la bitácora para que admin_th lo pueda revisar.
 */
export async function sincronizarConCirculo(usuarioId: string): Promise<ResultadoSincronizacion> {
  const admin = createAdminClient();

  const [{ data: perfil }, { data: cuestionario }] = await Promise.all([
    admin.from('flow_perfiles').select('email, nombre_completo, fecha_nacimiento').eq('id', usuarioId).maybeSingle(),
    admin
      .from('flow_cuestionarios')
      .select('id')
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  // Sin correo no hay nada que registrar en la bitácora tampoco (no hay
  // llave con la que emparejar ni con la que dejar rastro útil).
  if (!perfil?.email || !cuestionario) return { ok: false, motivo: 'Sin perfil o cuestionario' };

  const correo = perfil.email;
  const nombreFlow = perfil.nombre_completo ?? null;

  const { data: resultadosRow } = await admin
    .from('flow_resultados')
    .select('aspectos')
    .eq('cuestionario_id', cuestionario.id)
    .order('calculado_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!resultadosRow) {
    await registrarIntento(admin, { correo, nombreFlow, resultado: 'error', detalle: 'Aún no hay resultados calculados' });
    return { ok: false, motivo: 'Aún no hay resultados calculados' };
  }

  const { data: colaboradores, error: errorColaboradores } = await admin
    .from('colaboradores')
    .select('id, empresa_id')
    .ilike('email', correo);

  if (errorColaboradores) {
    const motivo = `Error buscando colaborador: ${errorColaboradores.message}`;
    await registrarIntento(admin, { correo, nombreFlow, resultado: 'error', detalle: motivo });
    return { ok: false, motivo };
  }
  if (!colaboradores || colaboradores.length === 0) {
    await registrarIntento(admin, { correo, nombreFlow, resultado: 'sin_colaborador' });
    return { ok: false, motivo: 'No es colaboradora/colaborador de ninguna empresa cliente — sin acción' };
  }
  if (colaboradores.length > 1) {
    await registrarIntento(admin, { correo, nombreFlow, resultado: 'correo_ambiguo', detalle: `${colaboradores.length} colaboradores comparten este correo` });
    return { ok: false, motivo: 'Correo ambiguo: coincide con más de un colaborador, no se adivina' };
  }
  const colaborador = colaboradores[0];

  const aspectos = aspectosSeguros(resultadosRow.aspectos as unknown as ResultadosCalculados);

  const { data: catalogo } = await admin
    .from('ser_aspectos')
    .select('id, nombre')
    .eq('empresa_id', colaborador.empresa_id)
    .eq('sensible', false);

  const idPorNombre = new Map((catalogo ?? []).map((a) => [a.nombre, a.id]));

  const { data: guia, error: errorGuia } = await admin
    .from('guia_del_flow')
    .insert({ colaborador_id: colaborador.id, origen_flow: perfil.fecha_nacimiento })
    .select('id')
    .single();
  if (errorGuia || !guia) {
    const motivo = `Error creando guia_del_flow: ${errorGuia?.message}`;
    await registrarIntento(admin, { correo, nombreFlow, resultado: 'error', detalle: motivo, colaboradorId: colaborador.id, empresaId: colaborador.empresa_id });
    return { ok: false, motivo };
  }

  const filas = aspectos
    .map((a) => ({ guia_del_flow_id: guia.id, aspecto_id: idPorNombre.get(a.nombre), puntaje: a.puntaje, nota: a.nota }))
    .filter((f): f is { guia_del_flow_id: string; aspecto_id: string; puntaje: number; nota: string | null } =>
      Boolean(f.aspecto_id)
    );

  if (filas.length > 0) {
    const { error: errorPuntajes } = await admin.from('ser_puntajes').insert(filas);
    if (errorPuntajes) {
      const motivo = `Error cargando puntajes: ${errorPuntajes.message}`;
      await registrarIntento(admin, { correo, nombreFlow, resultado: 'error', detalle: motivo, colaboradorId: colaborador.id, empresaId: colaborador.empresa_id, guiaDelFlowId: guia.id });
      return { ok: false, motivo };
    }
  }

  const listaAspectos = aspectos
    .map((a) => (a.nota ? `${a.nombre}: ${a.nota} (${a.puntaje}/5)` : `${a.nombre}: ${a.puntaje}/5`))
    .join('\n');

  const [informeLider, informeColaborador] = await Promise.all([
    pedirInforme(SYSTEM_INFORME_LIDER, listaAspectos),
    pedirInforme(SYSTEM_INFORME_COLABORADOR, listaAspectos),
  ]);

  const ahora = new Date().toISOString();
  await admin
    .from('guia_del_flow')
    .update({
      informe_lider: informeLider,
      informe_lider_generado_at: ahora,
      informe_colaborador: informeColaborador,
      informe_colaborador_generado_at: ahora,
    })
    .eq('id', guia.id);

  await registrarIntento(admin, {
    correo,
    nombreFlow,
    resultado: 'vinculado',
    colaboradorId: colaborador.id,
    empresaId: colaborador.empresa_id,
    guiaDelFlowId: guia.id,
  });

  return { ok: true, motivo: 'Sincronizado con Círculo de Crecimiento' };
}
