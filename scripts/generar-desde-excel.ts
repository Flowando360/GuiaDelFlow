/**
 * Genera la Guía del Flow y La Carta en PDF a partir de un Excel de
 * respuestas (exportado de un Google Form), SIN pasar por Supabase ni por
 * el correo — solo guarda los PDF en disco. Pensado para procesar a mano
 * respuestas de personas reales que llenaron el cuestionario fuera de la
 * app web (o para pruebas puntuales).
 *
 * Uso:
 *   npx tsx scripts/generar-desde-excel.ts [ruta-al-excel.xlsx] [carpeta-salida]
 *
 * Por defecto lee ./DatosFlowando.xlsx y escribe en ./pdfs-generados/.
 *
 * Asume que el Excel tiene UNA fila de encabezados y UNA fila de
 * respuestas por persona (formato de export de Google Forms), en el mismo
 * orden que flowando_kb/questionnaire.json: demográficos, 3
 * cuestionamientos abiertos, "Soy", C9-C92 (Likert 1-5) y C93-C97 (opción
 * múltiple A-E, donde el Excel trae el texto completo "b) ..." y aquí solo
 * se usa la letra inicial).
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import XLSX from 'xlsx';
import { calcularTodosLosAspectos } from '../src/lib/calculo/motor';
import type { DatosNacimiento, RespuestasCuestionario } from '../src/lib/calculo/tipos';
import { generarGuiaCondensada, generarPdfGuia } from '../src/lib/pdf/guia/generar';
import { generarCartaCondensada, generarPdfCarta } from '../src/lib/pdf/carta/generar';

// Carga ANTHROPIC_API_KEY (y el resto) desde .env.local — tsx no lo hace solo.
process.loadEnvFile(path.join(process.cwd(), '.env.local'));

// Índices de columna (0-based) del export de Google Forms, en el orden
// fijo que trae flowando_kb/questionnaire.json.
const COL = {
  correo: 1,
  nombre: 2,
  apodo: 3,
  genero: 4,
  fechaNacimiento: 5,
  paisCiudad: 6,
  telefono: 7,
  razon: 8,
  pregunta1: 9,
  pregunta2: 10,
  pregunta3: 11,
  soy: 12,
  likertInicio: 13, // C9
  likertFin: 96, // C92 (inclusive)
  ninezInicio: 97, // C93
  ninezFin: 101, // C97 (inclusive)
};

/** Serial de fecha de Excel (días desde 1899-12-30) -> DatosNacimiento. */
function fechaExcelANacimiento(serial: number): DatosNacimiento {
  const ms = Math.round((serial - 25569) * 86400 * 1000); // 25569 = días entre 1899-12-30 y 1970-01-01
  const fecha = new Date(ms);
  return { dia: fecha.getUTCDate(), mes: fecha.getUTCMonth() + 1, anio: fecha.getUTCFullYear() };
}

/** "b) Buscarle una vuelta creativa..." -> "B" */
function extraerLetra(texto: unknown): string {
  const s = String(texto ?? '').trim();
  const letra = s.charAt(0).toUpperCase();
  if (!['A', 'B', 'C', 'D', 'E'].includes(letra)) {
    throw new Error(`No se pudo extraer una letra A-E de la respuesta: "${s}"`);
  }
  return letra;
}

async function main() {
  const rutaExcel = process.argv[2] ?? 'DatosFlowando.xlsx';
  const carpetaSalida = process.argv[3] ?? 'pdfs-generados';

  const wb = XLSX.readFile(rutaExcel);
  const hoja = wb.Sheets[wb.SheetNames[0]];
  const filas: unknown[][] = XLSX.utils.sheet_to_json(hoja, { header: 1 });
  const headers = filas[0] as string[];
  const fila = filas[1];
  if (!fila) throw new Error('El Excel no tiene una fila de respuestas (fila 2).');

  // Arma el objeto de respuestas Likert C9..C97, verificando contra
  // flowando_kb/questionnaire.json que cada columna corresponde a su código.
  const kb = JSON.parse(readFileSync('flowando_kb/questionnaire.json', 'utf8'));
  const preguntasLikert = kb.preguntas_likert_codificadas as { codigo: string; pregunta: string; opciones?: unknown }[];

  const likert: RespuestasCuestionario = {};
  let col = COL.likertInicio;
  for (const p of preguntasLikert) {
    const encabezado = String(headers[col]).replace(/\s+/g, ' ').trim();
    const preguntaKb = p.pregunta.replace(/\s+/g, ' ').trim();
    if (!encabezado.startsWith(preguntaKb.slice(0, 30))) {
      throw new Error(
        `Desalineación en columna ${col}: esperaba algo como "${preguntaKb}" y el Excel trae "${encabezado}"`
      );
    }
    if (p.opciones) {
      likert[p.codigo] = extraerLetra(fila[col]);
    } else {
      const valor = Number(fila[col]);
      if (!Number.isInteger(valor) || valor < 1 || valor > 5) {
        throw new Error(`Valor Likert inválido en ${p.codigo} (columna ${col}): ${JSON.stringify(fila[col])}`);
      }
      likert[p.codigo] = valor;
    }
    col++;
  }
  if (col - 1 !== COL.ninezFin) {
    throw new Error(`Se esperaban columnas hasta la ${COL.ninezFin}, se procesaron hasta la ${col - 1}.`);
  }

  const nacimiento = fechaExcelANacimiento(Number(fila[COL.fechaNacimiento]));
  const apodo = String(fila[COL.apodo] ?? '').trim();
  const nombreCompleto = String(fila[COL.nombre] ?? '').trim();
  const nombreMostrado = apodo || nombreCompleto || 'Amiga/o';
  const razon = String(fila[COL.razon] ?? '');
  const cuestionamiento1 = String(fila[COL.pregunta1] ?? '');
  const cuestionamiento2 = String(fila[COL.pregunta2] ?? '');
  const cuestionamiento3 = String(fila[COL.pregunta3] ?? '');

  console.log(`Procesando a ${nombreMostrado} (nacimiento: ${nacimiento.dia}/${nacimiento.mes}/${nacimiento.anio})...`);

  const resultados = calcularTodosLosAspectos(nacimiento, likert);

  const fechaHoy = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const origen = `${String(nacimiento.dia).padStart(2, '0')}/${String(nacimiento.mes).padStart(2, '0')}/${nacimiento.anio}`;

  console.log('Generando La Guía del Flow (llamadas a Claude)...');
  const guia = await generarGuiaCondensada({ nombre: nombreMostrado, fecha: fechaHoy, origen, resultados });
  const pdfGuia = await generarPdfGuia(guia);

  console.log('Generando La Carta (llamada a Claude)...');
  const carta = await generarCartaCondensada({
    nombre: nombreMostrado,
    fecha: fechaHoy,
    razon,
    cuestionamiento1,
    cuestionamiento2,
    cuestionamiento3,
    guia,
  });
  const pdfCarta = await generarPdfCarta(carta);

  mkdirSync(carpetaSalida, { recursive: true });
  const base = nombreCompleto || nombreMostrado;
  const rutaGuia = path.join(carpetaSalida, `${base} - Guia del Flow.pdf`);
  const rutaCarta = path.join(carpetaSalida, `${base} - La Carta.pdf`);
  writeFileSync(rutaGuia, pdfGuia);
  writeFileSync(rutaCarta, pdfCarta);

  console.log(`Listo:\n  ${rutaGuia}\n  ${rutaCarta}`);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
