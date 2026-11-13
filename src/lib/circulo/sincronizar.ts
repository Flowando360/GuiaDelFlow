import { createAdminClient } from '@/lib/supabase/server';
import { clienteClaude } from '@/lib/claude/cliente';
import type { ResultadosCalculados } from '@/lib/calculo/tipos';

/**
 * Puente hacia Espiral de Crecimiento (mismo proyecto de Supabase). Se ejecuta después de que se calculan los
 * aspectos de una persona (ver src/app/api/generar-guia).
 *
 * Regla de privacidad — lo que SÍ y lo que NO cruza:
 *   - La Guía y la Carta completas NO viajan ni se guardan en Espiral. Son solo de la persona.
 *   - Solo cruza el ESQUEMA del Ser (ver esquema-ser.ts): por cada aspecto con relevancia laboral, un título, una
 *     descripción formal redactada para la empresa, cómo aprovecharlo y cómo acompañarlo, y una lectura descriptiva.
 *     El texto original de la Guía solo se usa como insumo para redactar y no se guarda en Espiral.
 *   - Los aspectos íntimos (infancia, pasado, frustración, estabilidad emocional, felicidad, dependencia,
 *     pertenencia, etapa del Flow, retos internos, sanación, balance, mente faro y los cierres) no se leen.
 *   - Sin la casilla de autorización del registro (autorizacion_circulo_en) no se envía nada. Esa es la base del
 *     consentimiento: la persona decide aquí, antes de que algo llegue a la empresa, y puede retirarlo en su resultado.
 *   - Espiral además bloquea a nivel de RLS los aspectos sensibles (0051_ser_privacidad_organizacional.sql).
 */

import { construirAspectos, redactarEsquema, type AspectoEsquema } from './esquema-ser';

type AspectoSeguro = AspectoEsquema;

// ── Mismos dos system prompts que usa Espiral de Crecimiento
// (src/lib/guia-flow/generar-informes.ts). Si se ajustan allá, ajustar acá también.

const SYSTEM_INFORME_LIDER = `Eres un asistente de Talento Humano. A partir de un esquema de aspectos con relevancia laboral (talentos, propósito, liderazgo, comunicación, trabajo en equipo, compromiso, adaptación al cambio, negociación, recursividad, inteligencias), cada uno con título, descripción y una lectura descriptiva (para aprovechar, en equilibrio o para acompañar; no es una nota), escribe en español un informe breve (200-300 palabras) dirigido al LÍDER de esa persona, para que enfoque su Plan de Desarrollo Individual.

Estructura: (1) talentos a aprovechar, (2) qué la/lo motiva, (3) cómo comunicarse y liderarla/o, (4) 2-3 sugerencias concretas para el PDI. Tono profesional, cálido y orientado a la acción.

IMPORTANTE: solo tienes los aspectos de la lista. No tienes ni debes mencionar infancia, pasado, estabilidad emocional, felicidad, dependencia, sanación, frustración, sentido de pertenencia ni ningún tema psicológico o de vida personal — esa información existe pero es privada y nunca te fue entregada. No la inventes ni sugieras que existe.`;

const SYSTEM_INFORME_COLABORADOR = `Eres un asistente de desarrollo profesional. A partir de un esquema de aspectos con relevancia laboral (talentos, propósito, liderazgo, comunicación, trabajo en equipo, compromiso, adaptación al cambio, negociación, recursividad, inteligencias), cada uno con título, descripción y una lectura descriptiva (para aprovechar, en equilibrio o para acompañar; no es una nota), escribe en español un informe breve (200-300 palabras) dirigido DIRECTAMENTE a esa persona (en segunda persona, tono cercano y alentador), que le ayude a recordar en qué es fuerte profesionalmente y en qué puede seguir trabajando.

Aclara que esto es un complemento breve, no un reemplazo de su Guía del Flow completa (que ya recibió por su cuenta). Cierra con una invitación a seguir explorando esa Guía si quiere profundizar en su autoconocimiento.

IMPORTANTE: solo tienes los aspectos de la lista. No tienes ni debes mencionar infancia, pasado, estabilidad emocional, felicidad, dependencia, sanación, frustración, sentido de pertenencia ni ningún tema psicológico o de vida personal — esa información existe pero es privada y nunca te fue entregada. No la inventes ni sugieras que existe.`;

/** Esquema en texto, igual al que arma Espiral (src/lib/guia-flow/generar-informes.ts) para sus síntesis. */
function listaParaInforme(aspectos: AspectoSeguro[]): string {
  return aspectos
    .map((a) => {
      const lectura = a.enfoque === 'aprovechar' ? 'para aprovechar' : a.enfoque === 'acompanar' ? 'para acompañar' : 'en equilibrio';
      return [
        `${a.nombre}${a.titulo ? `: ${a.titulo}` : ''} [${lectura}]`,
        a.descripcion ? `  Descripción: ${a.descripcion}` : null,
        a.aprovechar ? `  Aprovecharlo: ${a.aprovechar}` : null,
        a.acompanar ? `  Acompañar: ${a.acompanar}` : null,
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');
}

async function pedirInforme(system: string, listaAspectos: string): Promise<string> {
  const respuesta = await clienteClaude().messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 900,
    system,
    messages: [{ role: 'user', content: `Esquema del Ser (descriptivo, sin nota):\n${listaAspectos}` }],
  });
  const bloque = respuesta.content.find((b) => b.type === 'text');
  return bloque && bloque.type === 'text' ? bloque.text : '';
}

type ResultadoSincronizacion = { ok: boolean; motivo: string };
type ResultadoBitacora = 'vinculado' | 'sin_colaborador' | 'correo_ambiguo' | 'sin_autorizacion' | 'error';

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
    admin
      .from('flow_perfiles')
      .select('email, nombre_completo, fecha_nacimiento, colaborador_circulo_id, autorizacion_circulo_en')
      .eq('id', usuarioId)
      .maybeSingle(),
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

  // Sin autorización explícita (checkbox del registro), no se comparte
  // nada — sin importar si el correo o una invitación coinciden con un
  // colaborador. Esto es lo primero que se revisa, antes de tocar
  // cualquier dato de Círculo de Crecimiento.
  if (!perfil.autorizacion_circulo_en) {
    await registrarIntento(admin, { correo, nombreFlow, resultado: 'sin_autorizacion' });
    return { ok: false, motivo: 'La persona no autorizó compartir sus resultados con su empresa' };
  }

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

  // Idempotencia: si este cuestionario ya se sincronizó antes (doble clic
  // en "Generar mi Guía", reintento de red), no crear una segunda
  // aplicación real duplicada — el índice único de cuestionario_flow_id
  // es la garantía de fondo, esto es solo para no gastar 2 llamadas a
  // Claude de más si ya sabemos que va a fallar por duplicado.
  const { data: yaSincronizado } = await admin
    .from('guia_del_flow')
    .select('id')
    .eq('cuestionario_flow_id', cuestionario.id)
    .maybeSingle();

  if (yaSincronizado) {
    await registrarIntento(admin, {
      correo,
      nombreFlow,
      resultado: 'vinculado',
      detalle: 'Ya estaba sincronizado — no se duplicó',
      guiaDelFlowId: yaSincronizado.id,
    });
    return { ok: true, motivo: 'Ya estaba sincronizado' };
  }

  // Si la cuenta se registró con un link de invitación, el colaborador ya
  // se conoce con certeza — no hay que adivinar nada por correo. Solo si
  // no hubo invitación (cuenta genérica) se cae al emparejamiento de
  // siempre.
  let colaborador: { id: string; empresa_id: string } | null = null;
  let metodo: 'invitación' | 'correo' = 'correo';

  if (perfil.colaborador_circulo_id) {
    const { data: colaboradorInvitado, error: errorColaboradorInvitado } = await admin
      .from('colaboradores')
      .select('id, empresa_id')
      .eq('id', perfil.colaborador_circulo_id)
      .maybeSingle();

    if (errorColaboradorInvitado) {
      const motivo = `Error buscando colaborador invitado: ${errorColaboradorInvitado.message}`;
      await registrarIntento(admin, { correo, nombreFlow, resultado: 'error', detalle: motivo });
      return { ok: false, motivo };
    }
    if (colaboradorInvitado) {
      colaborador = colaboradorInvitado;
      metodo = 'invitación';
    }
    // Si no se encontró (p. ej. el colaborador se borró después de mandar
    // la invitación), sigue de largo y prueba con el correo como respaldo.
  }

  if (!colaborador) {
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
    colaborador = colaboradores[0];
  }

  const inicio = Date.now();

  // Esquema del Ser: lo único que cruza hacia la empresa. Se redacta ANTES de crear nada en Espiral, para no dejar una
  // aplicación a medias si algo falla. Los lotes que no se puedan redactar quedan solo con título y lectura.
  const aspectosGuia = construirAspectos(resultadosRow.aspectos as unknown as ResultadosCalculados);
  const aspectos: AspectoSeguro[] = await redactarEsquema(aspectosGuia);

  const { data: catalogo } = await admin
    .from('ser_aspectos')
    .select('id, nombre')
    .eq('empresa_id', colaborador.empresa_id)
    .eq('sensible', false);

  const idPorNombre = new Map((catalogo ?? []).map((a) => [a.nombre, a.id]));

  const { data: guia, error: errorGuia } = await admin
    .from('guia_del_flow')
    .insert({ colaborador_id: colaborador.id, origen_flow: perfil.fecha_nacimiento, cuestionario_flow_id: cuestionario.id })
    .select('id')
    .single();
  if (errorGuia || !guia) {
    // 23505 = unique_violation — dos sincronizaciones del mismo
    // cuestionario corriendo casi al mismo tiempo (carrera real, no solo
    // el chequeo de arriba). No es un error de verdad: alguien más ya
    // ganó la carrera y ya existe la aplicación real.
    if (errorGuia?.code === '23505') {
      const { data: existente } = await admin
        .from('guia_del_flow')
        .select('id')
        .eq('cuestionario_flow_id', cuestionario.id)
        .maybeSingle();
      await registrarIntento(admin, {
        correo,
        nombreFlow,
        resultado: 'vinculado',
        detalle: 'Ya estaba sincronizado (carrera) — no se duplicó',
        colaboradorId: colaborador.id,
        empresaId: colaborador.empresa_id,
        guiaDelFlowId: existente?.id,
      });
      return { ok: true, motivo: 'Ya estaba sincronizado' };
    }
    const motivo = `Error creando guia_del_flow: ${errorGuia?.message}`;
    await registrarIntento(admin, { correo, nombreFlow, resultado: 'error', detalle: motivo, colaboradorId: colaborador.id, empresaId: colaborador.empresa_id });
    return { ok: false, motivo };
  }

  // Sin puntaje: el Ser se describe, no se califica.
  const filas = aspectos.flatMap((a) => {
    const aspectoId = idPorNombre.get(a.nombre);
    if (!aspectoId) return []; // el aspecto no está en el catálogo de esa empresa: no se inventa
    return [
      {
        guia_del_flow_id: guia.id,
        aspecto_id: aspectoId,
        puntaje: null as number | null,
        nota: a.titulo,
        descripcion: a.descripcion,
        aprovechar: a.aprovechar,
        acompanar: a.acompanar,
        enfoque: a.enfoque,
      },
    ];
  });

  if (filas.length > 0) {
    const { error: errorPuntajes } = await admin.from('ser_puntajes').insert(filas);
    if (errorPuntajes) {
      const motivo = `Error cargando puntajes: ${errorPuntajes.message}`;
      await registrarIntento(admin, { correo, nombreFlow, resultado: 'error', detalle: motivo, colaboradorId: colaborador.id, empresaId: colaborador.empresa_id, guiaDelFlowId: guia.id });
      return { ok: false, motivo };
    }
  }

  const listaAspectos = listaParaInforme(aspectos);

  // Si ya se gastó casi todo el tiempo de la función (límite de 60 s), se omiten los informes: Espiral los genera
  // solo desde el esquema con su cron de respaldo (generar-informes-pendientes). Nada se pierde.
  let informeLider = '';
  let informeColaborador = '';
  if (Date.now() - inicio < 40_000) {
    try {
      [informeLider, informeColaborador] = await Promise.all([
        pedirInforme(SYSTEM_INFORME_LIDER, listaAspectos),
        pedirInforme(SYSTEM_INFORME_COLABORADOR, listaAspectos),
      ]);
    } catch (error) {
      console.error('No se pudieron generar las síntesis desde el esquema; las completa el cron de Espiral:', error);
    }
  }

  const ahora = new Date().toISOString();
  await admin
    .from('guia_del_flow')
    .update({
      informe_lider: informeLider || null,
      informe_lider_generado_at: informeLider ? ahora : null,
      informe_colaborador: informeColaborador || null,
      informe_colaborador_generado_at: informeColaborador ? ahora : null,
    })
    .eq('id', guia.id);

  await registrarIntento(admin, {
    correo,
    nombreFlow,
    resultado: 'vinculado',
    detalle: `Vinculado por ${metodo}`,
    colaboradorId: colaborador.id,
    empresaId: colaborador.empresa_id,
    guiaDelFlowId: guia.id,
  });

  return { ok: true, motivo: 'Sincronizado con Círculo de Crecimiento' };
}
