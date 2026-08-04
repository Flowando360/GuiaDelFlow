import { KNOWLEDGE_BASE } from '../kb/knowledgeBase';
import { questionnaire } from '../kb/questionnaire';
import { reducirNumerologico, sumaDigitos } from './numerologia';
import { calcularEdad, septenio, signoZodiacal } from './fechas';
import { CODIGOS_SUMA_LIKERT } from './codigos';
import type {
  DatosNacimiento,
  RespuestasCuestionario,
  ResultadoAspecto,
  ResultadosCalculados,
} from './tipos';

// ── Helpers de búsqueda en knowledge_base ──────────────────────────────

function porValor(aspecto: readonly ResultadoAspecto[], valor: number): ResultadoAspecto {
  const encontrado = aspecto.find((r) => Number(r.valor) === valor);
  if (!encontrado) {
    throw new Error(`No se encontró resultado con valor=${valor} (aspecto con ${aspecto.length} resultados)`);
  }
  return encontrado;
}

function porResiduoYElemento(
  aspecto: readonly ResultadoAspecto[],
  residuo: number,
  elemento: string
): ResultadoAspecto {
  const encontrado = aspecto.find((r) => Number(r.residuo) === residuo && r.elemento === elemento);
  if (!encontrado) {
    throw new Error(`No se encontró resultado con residuo=${residuo} elemento=${elemento}`);
  }
  return encontrado;
}

/**
 * Busca por rango [min,max] inclusive. Si el valor supera el máximo de
 * todos los buckets, cae en el bucket más alto (defensivo — ver nota en
 * calculation_order.json sobre los buckets de Comunicación/Negociación/
 * Liderazgo_2, que definen un techo teórico más alto del que la escala
 * Likert 1-5 puede alcanzar en la práctica; esto evita que el motor rompa
 * si esa escala cambia en el futuro).
 */
function porRango(aspecto: readonly ResultadoAspecto[], suma: number): ResultadoAspecto {
  const ordenado = [...aspecto].sort((a, b) => Number(a.min) - Number(b.min));
  const encontrado = ordenado.find((r) => suma >= Number(r.min) && suma <= Number(r.max));
  if (encontrado) return encontrado;
  return suma < Number(ordenado[0].min) ? ordenado[0] : ordenado[ordenado.length - 1];
}

// ── Likert: suma de un rango de códigos ────────────────────────────────

function sumaLikert(respuestas: RespuestasCuestionario, codigos: string[]): number {
  return codigos.reduce((acc, c) => {
    const v = Number(respuestas[c]);
    if (!Number.isFinite(v)) {
      throw new Error(`Falta la respuesta ${c} (o no es numérica) para calcular la suma Likert`);
    }
    return acc + v;
  }, 0);
}

// ── Niñez: letra más frecuente (ver README + calculation_order.json →
//    detalle_calculo_ninez) ─────────────────────────────────────────────

const ORDEN_DESEMPATE_NINEZ = ['C93', 'C95', 'C94', 'C96', 'C97'] as const;

function calcularNinez(respuestas: RespuestasCuestionario): ResultadoAspecto {
  const letras = ['C93', 'C94', 'C95', 'C96', 'C97'].map((c) => String(respuestas[c]).toUpperCase());

  const conteo = new Map<string, number>();
  for (const letra of letras) conteo.set(letra, (conteo.get(letra) ?? 0) + 1);

  const maxConteo = Math.max(...conteo.values());
  const empatadas = new Set([...conteo.entries()].filter(([, n]) => n === maxConteo).map(([l]) => l));

  let letraGanadora: string;
  if (empatadas.size === 1) {
    letraGanadora = [...empatadas][0];
  } else {
    // Desempate: recorrer C93 -> C95 -> C94 -> C96 -> C97 y usar la
    // primera letra de esa respuesta que esté entre las empatadas.
    const codigoAPos: Record<string, number> = { C93: 0, C94: 1, C95: 2, C96: 3, C97: 4 };
    letraGanadora =
      ORDEN_DESEMPATE_NINEZ.map((codigo) => letras[codigoAPos[codigo]]).find((letra) =>
        empatadas.has(letra)
      ) ?? letras[0];
  }

  const perfil = questionnaire.perfil_letra_valor_ninez as unknown as Record<
    string,
    { valor: number; titulo: string }
  >;
  const valor = perfil[letraGanadora].valor;

  return porValor(KNOWLEDGE_BASE.Niñez.resultados, valor);
}

// ── Inteligencias: multi-resultado, un umbral por pregunta ─────────────

function calcularInteligencias(respuestas: RespuestasCuestionario): ResultadoAspecto[] {
  return KNOWLEDGE_BASE.Inteligencias.resultados.filter((r) => {
    const codigo = String(r.codigo);
    const v = Number(respuestas[codigo]);
    return Number.isFinite(v) && v >= 3;
  });
}

// ── Motor principal ──────────────────────────────────────────────────

/**
 * Calcula los 30 aspectos en el orden obligatorio que documenta
 * flowando_kb/calculation_order.json: primero los directos (fecha o
 * Likert), después los compuestos simples, y por último Integra (que
 * depende de Proposito_2, ya calculado en el paso anterior).
 */
export function calcularTodosLosAspectos(
  nacimiento: DatosNacimiento,
  respuestas: RespuestasCuestionario,
  fechaReferencia: Date = new Date()
): ResultadosCalculados {
  const { dia, mes, anio } = nacimiento;

  // ── Paso 1: directos de fecha ──────────────────────────────────────
  const signo = signoZodiacal(dia, mes);
  const residuoAnio = anio % 12;

  const TALENTO_UNICO = porResiduoYElemento(KNOWLEDGE_BASE.TALENTO_UNICO.resultados, residuoAnio, signo.elemento);
  const TEMPERAMENTO = porValor(KNOWLEDGE_BASE.TEMPERAMENTO.resultados, residuoAnio);
  const CARACTER = porValor(KNOWLEDGE_BASE.CARACTER.resultados, signo.numero);
  const ETAPA_FLOW = porValor(KNOWLEDGE_BASE.ETAPA_FLOW.resultados, septenio(calcularEdad(nacimiento, fechaReferencia)));

  // ── Paso 1: directos numerológicos ─────────────────────────────────
  const ultimosDosDigitosAnio = anio % 100;
  const valorTalentoInnato = reducirNumerologico(sumaDigitos(ultimosDosDigitosAnio));
  const Talento_Innato = porValor(KNOWLEDGE_BASE.Talento_Innato.resultados, valorTalentoInnato);

  const valorTalentoPotenciar = reducirNumerologico(sumaDigitos(anio));
  const Talento_Potenciar = porValor(KNOWLEDGE_BASE.Talento_Potenciar.resultados, valorTalentoPotenciar);

  const valorProposito1 = reducirNumerologico(dia + mes + sumaDigitos(anio));
  const Proposito_1 = porValor(KNOWLEDGE_BASE.Proposito_1.resultados, valorProposito1);

  const valorDesafioInterior = reducirNumerologico(sumaDigitos(dia));
  const DesafioInterior = porValor(KNOWLEDGE_BASE.DesafioInterior.resultados, valorDesafioInterior);

  const valorDesafioSanacion = reducirNumerologico(sumaDigitos(mes));
  const Desafio_Sanacion = porValor(KNOWLEDGE_BASE.Desafio_Sanacion.resultados, valorDesafioSanacion);

  // ── Paso 1: Niñez (letra más frecuente) ────────────────────────────
  const Niñez = calcularNinez(respuestas);

  // ── Paso 1: suma_likert ─────────────────────────────────────────────
  const sumaLikertPorAspecto = Object.fromEntries(
    Object.entries(CODIGOS_SUMA_LIKERT).map(([aspecto, codigos]) => [
      aspecto,
      porRango(
        KNOWLEDGE_BASE[aspecto as keyof typeof KNOWLEDGE_BASE].resultados as ResultadoAspecto[],
        sumaLikert(respuestas, codigos)
      ),
    ])
  ) as Record<keyof typeof CODIGOS_SUMA_LIKERT, ResultadoAspecto>;

  // ── Paso 1: Inteligencias (multi-resultado) ────────────────────────
  const Inteligencias = calcularInteligencias(respuestas);

  // ── Paso 2: compuestos simples (dependen solo del paso 1) ──────────
  const valorProposito2 = reducirNumerologico(
    Number(TALENTO_UNICO.residuo) +
      Number(Talento_Innato.valor) +
      Number(Talento_Potenciar.valor) +
      Number(Proposito_1.valor)
  );
  const Proposito_2 = porValor(KNOWLEDGE_BASE.Proposito_2.resultados, valorProposito2);

  const valorDesafioLibera = reducirNumerologico(Number(DesafioInterior.valor) + Number(Desafio_Sanacion.valor));
  const Desafio_Libera = porValor(KNOWLEDGE_BASE.Desafio_Libera.resultados, valorDesafioLibera);

  const valorCualidadesPotencia = reducirNumerologico(
    Number(DesafioInterior.valor) +
      Number(Desafio_Sanacion.valor) +
      Number(Talento_Innato.valor) +
      Number(Talento_Potenciar.valor)
  );
  const CualidadesPotencia = porValor(KNOWLEDGE_BASE.CualidadesPotencia.resultados, valorCualidadesPotencia);

  // ── Paso 3: doble compuesto (depende de Proposito_2, ya calculado) ─
  const valorIntegra = reducirNumerologico(
    Number(Talento_Innato.valor) + Number(Talento_Potenciar.valor) + Number(Proposito_2.valor)
  );
  const Integra = porValor(KNOWLEDGE_BASE.Integra.resultados, valorIntegra);

  return {
    TALENTO_UNICO,
    TEMPERAMENTO,
    CARACTER,
    ETAPA_FLOW,
    Talento_Innato,
    Talento_Potenciar,
    Proposito_1,
    DesafioInterior,
    Desafio_Sanacion,
    Niñez,
    Dependencia: sumaLikertPorAspecto.Dependencia,
    Pasado: sumaLikertPorAspecto.Pasado,
    Compromiso: sumaLikertPorAspecto.Compromiso,
    Responsabilidad: sumaLikertPorAspecto.Responsabilidad,
    Felicidad: sumaLikertPorAspecto.Felicidad,
    Cambios: sumaLikertPorAspecto.Cambios,
    TrabajoEnEquipo: sumaLikertPorAspecto.TrabajoEnEquipo,
    Liderazgo_1: sumaLikertPorAspecto.Liderazgo_1,
    Liderazgo_2: sumaLikertPorAspecto.Liderazgo_2,
    Comunicación: sumaLikertPorAspecto.Comunicación,
    Negociación: sumaLikertPorAspecto.Negociación,
    Frustración: sumaLikertPorAspecto.Frustración,
    Recursividad: sumaLikertPorAspecto.Recursividad,
    Estabilidad_Emocional: sumaLikertPorAspecto.Estabilidad_Emocional,
    Pertenencia: sumaLikertPorAspecto.Pertenencia,
    Inteligencias,
    Proposito_2,
    Desafio_Libera,
    CualidadesPotencia,
    Integra,
  };
}
