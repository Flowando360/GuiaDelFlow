/**
 * Genera "Tu Cuaderno del Flow" para Valentina Solarte Bolaños (Titi) --
 * pedido especial de Diana el 2026-09-03, no es parte del flujo normal de
 * la app (no hay botón para esto en /panel, es un documento de una sola
 * vez). Reusa la paleta y tipografías EXACTAS de GuiaDelFlow_Titi.pdf y
 * CartaDelFlow_Titi.pdf (ver css.ts de guia/ y carta/), y las imágenes de
 * marca directo de /Imagenes_Flow (no de public/images/flow-optimizado,
 * que es un subconjunto ya optimizado para la app).
 *
 * A diferencia de la Guía y la Carta (HTML -> PDF con Puppeteer y ya),
 * este documento tiene espacios para ESCRIBIR de verdad: después de
 * renderizar el PDF visual, se le agregan campos de formulario reales
 * (pdf-lib) exactamente sobre los recuadros con líneas -- Titi puede
 * escribir directo en el PDF (Adobe Acrobat Reader, Vista Previa de Mac,
 * el visor de Chrome) o imprimirlo y escribir a mano.
 *
 * Cómo se logra la alineación exacta: TODO elemento que necesita coincidir
 * con un campo de formulario (recuadros, líneas, casillas) se posiciona
 * con `position:absolute` en pulgadas, nunca con `margin-top` sobre un
 * elemento en flujo normal -- un margen empuja el elemento relativo a
 * dónde haya quedado el contenido anterior, no a una posición fija de
 * página, así que mezclarlo con coordenadas absolutas calculadas aparte
 * garantiza desalineces tarde o temprano (pasó en el primer intento: el
 * tracker de 21 días y la página de firma quedaron con texto encimado).
 * Cada página define sus coordenadas una sola vez, en el mismo array que
 * después usa pdf-lib para ubicar el campo -- nunca se mide nada en
 * píxeles en tiempo de ejecución.
 *
 * Uso: npx tsx scripts/generar-cuaderno-titi.ts
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';
import { PDFDocument, StandardFonts } from 'pdf-lib';

const CARPETA_IMAGENES = path.join(process.cwd(), 'Imagenes_Flow');
const SALIDA = path.join(process.cwd(), 'pdfs-generados', 'ValentinaSolarte', 'CuadernoDelFlow_Titi.pdf');

const IMAGENES = {
  escribiendo: 'FlowiEscribiendo.png',
  puente: 'FlowA_Puente.png',
  eureka: 'Flowa_Eureka.png',
  medita: 'Flowi_Medita.png',
  edificio: 'EdificioFlow.png',
  logo: 'LogoFlowAndoOficial.png',
  cierre: 'Personajes5.png',
} as const;

async function cargarImagenes(): Promise<Record<keyof typeof IMAGENES, string>> {
  const entradas = await Promise.all(
    Object.entries(IMAGENES).map(async ([clave, archivo]) => {
      const buffer = await readFile(path.join(CARPETA_IMAGENES, archivo));
      return [clave, `data:image/png;base64,${buffer.toString('base64')}`] as const;
    })
  );
  return Object.fromEntries(entradas) as Record<keyof typeof IMAGENES, string>;
}

// ────────────────────────────────────────────────────────────────────────
// Campos de formulario: se van llenando mientras se arma el HTML, página
// por página (0-indexado, igual que pdfDoc.getPages()).
// ────────────────────────────────────────────────────────────────────────
type Campo =
  | { tipo: 'texto'; pagina: number; nombre: string; top: number; left: number; width: number; height: number; multilinea: boolean; tamanioFuente: number }
  | { tipo: 'checkbox'; pagina: number; nombre: string; top: number; left: number; lado: number };

const CAMPOS: Campo[] = [];
let contadorPagina = -1; // se incrementa cada vez que se abre una <section class="pagina">

function nuevaPagina(): number {
  contadorPagina++;
  return contadorPagina;
}

/** Recuadro de escritura: dibuja el HTML (líneas de renglón) y registra el campo de formulario correspondiente, en las mismas coordenadas. */
function cajaEscribir(
  pagina: number,
  nombre: string,
  top: number,
  left: number,
  width: number,
  height: number,
  opciones: { lineas?: boolean; tamanioFuente?: number } = {}
): string {
  const { lineas = true, tamanioFuente = 11.5 } = opciones;
  CAMPOS.push({ tipo: 'texto', pagina, nombre, top, left, width, height, multilinea: true, tamanioFuente });
  const fondoLineas = lineas
    ? `background-image: repeating-linear-gradient(transparent, transparent 27px, #d8cdf0 27px, #d8cdf0 28.5px); background-position: 0 4px;`
    : '';
  return `<div class="caja-escribir" style="top:${top}in; left:${left}in; width:${width}in; height:${height}in; ${fondoLineas}"></div>`;
}

/** Campo de una sola línea (para "fecha:", "firma:", una frase corta). */
function lineaEscribir(pagina: number, nombre: string, top: number, left: number, width: number): string {
  CAMPOS.push({ tipo: 'texto', pagina, nombre, top, left, width, height: 0.32, multilinea: false, tamanioFuente: 12 });
  return `<div class="linea-escribir" style="top:${top}in; left:${left}in; width:${width}in;"></div>`;
}

function casillaVerificar(pagina: number, nombre: string, top: number, left: number, lado = 0.19): string {
  CAMPOS.push({ tipo: 'checkbox', pagina, nombre, top, left, lado });
  return `<div class="casilla" style="top:${top}in; left:${left}in; width:${lado}in; height:${lado}in;"></div>`;
}

/** Párrafo/consigna posicionado en absoluto -- para usar SIEMPRE que algo
 * deba caer en un lugar exacto de la página (nunca con margin-top). */
function bloqueAbs(html: string, top: number, left: number, width: number): string {
  return `<div style="position:absolute; top:${top}in; left:${left}in; width:${width}in;">${html}</div>`;
}

// ────────────────────────────────────────────────────────────────────────
// CSS -- paleta y tipografías portadas tal cual de guia/css.ts y
// carta/css.ts (mismo import de Google Fonts, mismos hex).
// ────────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=Playfair+Display:ital,wght@0,600;0,700;1,600;1,700&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
@page { size: 8.5in 11in; margin: 0; }
body { font-family: 'Nunito', Georgia, sans-serif; color: #2e1065; }

.pagina { width: 8.5in; height: 11in; position: relative; page-break-after: always; overflow: hidden; }
.pagina:last-child { page-break-after: avoid; }

/* ── portada / cierre ── */
.pagina-gradiente { background: linear-gradient(160deg, #faf5ff 0%, #ede9fe 50%, #f5d0fe 100%); display:flex; flex-direction:column; align-items:center; justify-content:space-between; padding: 0.6in 0.7in; text-align:center; }
.pg-logo { height: 30pt; }
.pg-tag { margin-top: 0.35in; font-size: 10pt; font-weight: 700; letter-spacing: 2pt; text-transform: uppercase; color: #7c3aed; }
.pg-nombre { font-family: 'Playfair Display', Georgia, serif; font-size: 46pt; font-weight: 700; color: #4c1d95; line-height: 1.1; margin-top: 8pt; }
.pg-estrella { font-size: 20pt; color: #a855f7; margin-top: 10pt; }
.pg-linea { width: 90pt; height: 2.5pt; background: linear-gradient(90deg, #7c3aed, #a855f7); border-radius: 2pt; margin: 12pt auto; }
.pg-frase { font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 15pt; color: #4c1d95; max-width: 5in; line-height: 1.5; }
.pg-img-wrap { flex: 1; display:flex; align-items:center; justify-content:center; min-height:0; }
.pg-img-wrap img { max-height: 2.3in; max-width: 3.6in; object-fit: contain; }
.pg-fecha { font-size: 9pt; color: #7c3aed; font-weight: 700; letter-spacing: 0.5pt; }

/* ── páginas de contenido (fondo blanco) ── */
.hoja { padding: 0.55in 0.65in; position: relative; height: 100%; }
.encabezado { display:flex; align-items:center; justify-content:space-between; border-bottom: 1pt solid #e9d5ff; padding-bottom: 8pt; margin-bottom: 16pt; }
.encabezado img { height: 20pt; }
.encabezado .etq { font-size: 9pt; font-weight: 700; letter-spacing: 1pt; color: #a855f7; text-transform: uppercase; }
.encabezado .num { font-size: 9pt; font-weight: 700; color: #a855f7; }
.pie { position:absolute; bottom: 0.3in; left: 0.65in; right: 0.65in; display:flex; justify-content:space-between; font-size: 7.5pt; color:#d8b4fe; font-weight:700; letter-spacing:0.5pt; text-transform:uppercase; }

.titulo { font-family:'Playfair Display', Georgia, serif; font-size: 22pt; font-weight:700; color:#4c1d95; line-height:1.2; margin-bottom: 8pt; }
.parrafo { font-size: 11pt; line-height: 1.65; color:#2e1065; margin-bottom: 10pt; text-align: justify; }
.parrafo b { color: #4c1d95; }

/* ── divisores de sección (tomado de guia/css.ts .chapter-break) ── */
.divisor { display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding: 0.5in; height: 100%; }
.divisor img.divisor-img { max-height: 2.4in; margin-bottom: 20pt; object-fit: contain; border-radius: 12pt; }
.divisor .etiqueta { font-size: 10pt; font-weight:800; letter-spacing:3pt; text-transform:uppercase; margin-bottom:8pt; opacity:0.75; }
.divisor .titulo-divisor { font-family:'Playfair Display', Georgia, serif; font-size: 34pt; font-weight:700; line-height:1.15; margin-bottom:10pt; }
.divisor .sub-divisor { font-family:'Playfair Display', Georgia, serif; font-style:italic; font-size: 13pt; opacity:0.85; max-width:4.6in; line-height:1.5; }
.divisor .deco { width: 70pt; height: 3pt; border-radius: 2pt; margin: 18pt auto 0; }
.reto-herramienta { margin-top: 22pt; display:flex; flex-direction:column; gap:5pt; font-size: 9.5pt; opacity: 0.85; }
.reto-herramienta span { background: rgba(255,255,255,0.55); border-radius: 20pt; padding: 4pt 14pt; }

.d-etapa   { background: linear-gradient(160deg, #fff7ed, #fed7aa, #fdba7422); }
.d-etapa .etiqueta, .d-etapa .sub-divisor { color: #c2410c; }
.d-etapa .titulo-divisor { color: #9a3412; }
.d-etapa .deco { background: linear-gradient(90deg,#f97316,#fb923c); }

.d-proposito   { background: linear-gradient(160deg, #faf5ff, #ede9fe, #c4b5fd); }
.d-proposito .etiqueta, .d-proposito .sub-divisor { color: #5b21b6; }
.d-proposito .titulo-divisor { color: #4c1d95; }
.d-proposito .deco { background: linear-gradient(90deg,#7c3aed,#a855f7); }

.d-decision   { background: linear-gradient(160deg, #fef2f2, #fecaca, #f8717122); }
.d-decision .etiqueta, .d-decision .sub-divisor { color: #991b1b; }
.d-decision .titulo-divisor { color: #7f1d1d; }
.d-decision .deco { background: linear-gradient(90deg,#ef4444,#f87171); }

.d-compromiso   { background: linear-gradient(160deg, #f0fdf4, #bbf7d0, #4ade8022); }
.d-compromiso .etiqueta, .d-compromiso .sub-divisor { color: #166534; }
.d-compromiso .titulo-divisor { color: #14532d; }
.d-compromiso .deco { background: linear-gradient(90deg,#22c55e,#4ade80); }

/* ── recuadro de pregunta (tomado de carta/css.ts .bloque-cuestionamiento) ── */
.bloque { background:#faf5ff; border-left:4pt solid #7c3aed; border-radius:4pt; padding:12pt 14pt; }
.bloque .etq { font-size:8pt; font-weight:800; letter-spacing:1.5pt; text-transform:uppercase; color:#a855f7; margin-bottom:6pt; }
.bloque .pregunta { font-family:'Playfair Display', Georgia, serif; font-style:italic; font-size:12.5pt; color:#4c1d95; line-height:1.4; }

.consigna { font-size: 11pt; font-weight: 700; color:#5b21b6; line-height: 1.4; }
.consigna.c-etapa { color:#c2410c; }
.consigna.c-decision { color:#991b1b; }
.consigna.c-compromiso { color:#166534; }

/* ── recuadros de escritura y líneas ── */
.caja-escribir { position:absolute; border:1pt solid #e9d5ff; border-radius: 8pt; background-color: #fffdff; }
.linea-escribir { position:absolute; border-bottom: 1pt solid #c4b5fd; height: 0.32in; }
.casilla { position:absolute; border:1.3pt solid #f87171; border-radius: 3pt; }

.mini-etiqueta { position:absolute; font-size: 8pt; font-weight:800; letter-spacing:0.8pt; text-transform:uppercase; color:#a855f7; }
.mini-etiqueta.c-etapa { color:#c2410c; }
.mini-etiqueta.c-decision { color:#991b1b; }
.mini-etiqueta.c-compromiso { color:#166534; }

.dia-num { position:absolute; font-size: 7pt; font-weight: 800; color:#f87171; text-align:center; }
`;

function encabezadoHtml(imgLogo: string, etiqueta: string, numero: number): string {
  return `<div class="encabezado"><img src="${imgLogo}"/><span class="etq">${etiqueta}</span><span class="num">${String(numero).padStart(2, '0')}</span></div>`;
}

function pieHtml(): string {
  return `<div class="pie"><span>Cuaderno del Flow</span><span>FlowAndo · 03/09/2026</span></div>`;
}

async function main() {
  const img = await cargarImagenes();
  const partes: string[] = [];
  let numeroPaginaVisible = 1;

  // ── 1. Portada ─────────────────────────────────────────────────────
  {
    nuevaPagina();
    partes.push(`
      <section class="pagina pagina-gradiente">
        <img class="pg-logo" src="${img.logo}"/>
        <div>
          <div class="pg-tag">Para Titi · un espacio solo tuyo</div>
          <div class="pg-nombre">Tu Cuaderno<br/>del Flow</div>
          <div class="pg-estrella">✦</div>
          <div class="pg-linea"></div>
          <div class="pg-frase">Para leer, escribir y decidir quién quieres ser en esta etapa que hoy vives.</div>
        </div>
        <div class="pg-img-wrap"><img src="${img.escribiendo}"/></div>
        <div class="pg-fecha">03/09/2026</div>
      </section>
    `);
  }

  // ── 2. Instrucciones ──────────────────────────────────────────────
  {
    nuevaPagina();
    partes.push(`
      <section class="pagina">
        <div class="hoja">
          ${encabezadoHtml(img.logo, 'Instrucciones', numeroPaginaVisible++)}
          <div class="titulo">Antes de empezar</div>
          <p class="parrafo">Este cuaderno nació de tu propia Guía y tu propia Carta -- de lo que ya escribiste sobre ti misma, y de tus tres cuestionamientos. No trae respuestas nuevas: trae <b>preguntas</b> para que las respuestas salgan de ti, con calma, sin prisa.</p>
          <p class="parrafo">Tu Guía ya te lo dijo dos veces: tu Inteligencia 7 es que <b>tu mirada interior es tu brújula</b> ("lleva un diario, explora la filosofía"), y tu Inteligencia 1 es que <b>las palabras son tu puente hacia el mundo</b>. Este cuaderno existe para que uses esos dos talentos tuyos a propósito, no por casualidad.</p>
          <p class="parrafo">Puedes escribir directo en este PDF (ábrelo en Adobe Acrobat Reader, en el visor de Chrome o en Vista Previa de Mac y haz clic sobre cada recuadro) o imprimirlo y escribir a mano. Las dos formas valen igual -- lo que importa es que sea tu letra, tu ritmo, tu verdad.</p>
          <p class="parrafo">Recuerda lo que ya te dijeron los tres resaltadores de tu Guía: <b>no hay respuestas correctas ni incorrectas</b>. Aquí tampoco. Solo hay honestidad.</p>
          <div class="bloque" style="margin-bottom: 14pt;">
            <div class="etq">Cómo está organizado</div>
            <p class="parrafo" style="margin-bottom:4pt"><b>1. Tu etapa de vida hoy</b> -- nombrar dónde estás parada.</p>
            <p class="parrafo" style="margin-bottom:4pt"><b>2. Tu propósito de vida</b> -- conectar lo que ya sabes de ti con lo que decides hacer.</p>
            <p class="parrafo" style="margin-bottom:4pt"><b>3. Tus cuestionamientos</b> -- una herramienta para decidir, no solo para preguntarte.</p>
            <p class="parrafo" style="margin-bottom:0"><b>4. Tu compromiso</b> -- un paso concreto, con fecha y firma.</p>
          </div>
          <p class="parrafo" style="font-style:italic; color:#7c3aed;">Cada parte nombra un RETO de tu Guía -- lo que hoy te cuesta -- y una FORTALEZA tuya que puedes usar como herramienta para superarlo. No estás empezando de cero: ya tienes con qué.</p>
        </div>
        ${pieHtml()}
      </section>
    `);
  }

  // ── 3. Divisor: Tu etapa de vida hoy ──────────────────────────────
  {
    nuevaPagina();
    partes.push(`
      <section class="pagina">
        <div class="divisor d-etapa">
          <img class="divisor-img" src="${img.puente}"/>
          <div class="etiqueta">Parte 1</div>
          <div class="titulo-divisor">Tu etapa de vida hoy</div>
          <div class="sub-divisor">Nombrar dónde estás parada, sin apurarte a resolverlo todavía.</div>
          <div class="deco"></div>
          <div class="reto-herramienta">
            <span><b>Tu reto:</b> Adaptación al cambio y Retos internos</span>
            <span><b>Tu herramienta:</b> Equilibrio entre tierra y espíritu</span>
          </div>
        </div>
      </section>
    `);
  }

  // ── 4. Contenido 1a: ejercicio 1.1 y 1.2 (todo en absoluto) ───────
  {
    const p = nuevaPagina();
    partes.push(`
      <section class="pagina">
        <div class="hoja">
          ${encabezadoHtml(img.logo, 'Tu etapa de vida hoy', numeroPaginaVisible++)}
          <div class="titulo" style="font-size:18pt;">Nombra tu etapa</div>
          <p class="parrafo">Tú misma lo dijiste: sientes que la vida te ha premiado mucho, y que a veces te cuesta esforzarte, sientes estancamiento. Eso no es flojera, es una brújula que aún no has terminado de leer.</p>
          ${bloqueAbs('<p class="consigna c-etapa">¿Qué momento de tu vida sientes que estás viviendo hoy? ¿Qué se siente distinto comparado con hace un año?</p>', 3.35, 0.65, 7.2)}
          ${cajaEscribir(p, 'etapa_1_1', 3.85, 0.65, 7.2, 1.55)}
          ${bloqueAbs('<p class="consigna c-etapa">Cuando piensas "debería esforzarme más", ¿qué es exactamente lo que temes que pase si te esfuerzas y aún así no alcanza? ¿Y qué pasaría si te esfuerzas y SÍ alcanza?</p>', 5.75, 0.65, 7.2)}
          ${cajaEscribir(p, 'etapa_1_2', 6.55, 0.65, 7.2, 1.7)}
        </div>
        ${pieHtml()}
      </section>
    `);
  }

  // ── 5. Contenido 1b: ejercicio 1.3 (dos columnas) ─────────────────
  {
    const p = nuevaPagina();
    partes.push(`
      <section class="pagina">
        <div class="hoja">
          ${encabezadoHtml(img.logo, 'Tu etapa de vida hoy', numeroPaginaVisible++)}
          <div class="titulo" style="font-size:18pt;">Lo conocido y lo posible</div>
          <p class="parrafo">Tu Guía nombra tu desafío de Adaptación al cambio: te aferras a lo conocido porque te da seguridad, y eso no te hace menos valiente, te hace humana. Pero vale la pena mirar las dos orillas.</p>
          <p class="consigna c-etapa">Escribe en cada columna, sin juzgar lo que sale.</p>
          <div class="mini-etiqueta c-etapa" style="top:3.55in; left:0.65in;">LO QUE YA CONOZCO Y ME DA SEGURIDAD</div>
          <div class="mini-etiqueta c-etapa" style="top:3.55in; left:4.45in;">LO QUE AÚN NO CONOZCO Y ME DA CURIOSIDAD</div>
          ${cajaEscribir(p, 'etapa_1_3_conocido', 3.85, 0.65, 3.4, 4.0)}
          ${cajaEscribir(p, 'etapa_1_3_posible', 3.85, 4.45, 3.4, 4.0)}
        </div>
        ${pieHtml()}
      </section>
    `);
  }

  // ── 6. Divisor: Tu propósito de vida ──────────────────────────────
  {
    nuevaPagina();
    partes.push(`
      <section class="pagina">
        <div class="divisor d-proposito">
          <img class="divisor-img" src="${img.eureka}"/>
          <div class="etiqueta">Parte 2</div>
          <div class="titulo-divisor">Tu propósito de vida</div>
          <div class="sub-divisor">Conectar lo que tu Guía ya sabe de ti con lo que decides hacer.</div>
          <div class="deco"></div>
          <div class="reto-herramienta">
            <span><b>Tu reto:</b> Balance -- reconectar con lo que te mueve</span>
            <span><b>Tu herramienta:</b> Propósito de enseñanza, cuerpo y disciplina</span>
          </div>
        </div>
      </section>
    `);
  }

  // ── 7. Contenido 2a: ejercicio 2.1 y 2.2 ──────────────────────────
  {
    const p = nuevaPagina();
    partes.push(`
      <section class="pagina">
        <div class="hoja">
          ${encabezadoHtml(img.logo, 'Tu propósito de vida', numeroPaginaVisible++)}
          <div class="titulo" style="font-size:18pt;">Tu propósito, en tus palabras</div>
          <p class="parrafo">Tu Guía dice que tu propósito combina <b>enseñanza</b> y <b>cuidado del cuerpo</b> como pilares de vida.</p>
          ${bloqueAbs('<p class="consigna">¿En qué momento reciente sentiste que estabas enseñando algo a alguien, o cuidando tu cuerpo de una forma que de verdad te llenó? Descríbelo con detalle.</p>', 3.15, 0.65, 7.2)}
          ${cajaEscribir(p, 'proposito_2_1', 3.65, 0.65, 7.2, 1.7)}
          ${bloqueAbs('<p class="consigna">Tú misma escribiste: <i>"la disciplina es el puente entre lo que sueñas y lo que logras, y tu seguridad propia es el ancla."</i> Hoy, ¿qué necesitas más: construir el puente (empezar algo nuevo) o afirmar el ancla (confiar en lo que ya eres)? ¿Por qué?</p>', 5.55, 0.65, 7.2)}
          ${cajaEscribir(p, 'proposito_2_2', 6.45, 0.65, 7.2, 1.1)}
        </div>
        ${pieHtml()}
      </section>
    `);
  }

  // ── 8. Contenido 2b: ejercicio 2.3 ────────────────────────────────
  {
    const p = nuevaPagina();
    partes.push(`
      <section class="pagina">
        <div class="hoja">
          ${encabezadoHtml(img.logo, 'Tu propósito de vida', numeroPaginaVisible++)}
          <div class="titulo" style="font-size:18pt;">Si el dinero no fuera la pregunta</div>
          <p class="parrafo">En tu carta te lo dijimos así: lo económico asusta menos cuando dejas de pedir permiso interno para merecer más. Este ejercicio no es sobre dinero, es sobre dirección.</p>
          <div class="bloque">
            <div class="pregunta">Si mañana tuvieras la seguridad económica completamente resuelta, ¿qué harías con tu tiempo? Esa respuesta es un mapa hacia tu propósito -- no la descartes por parecer poco práctica.</div>
          </div>
          ${cajaEscribir(p, 'proposito_2_3', 4.6, 0.65, 7.2, 3.3)}
        </div>
        ${pieHtml()}
      </section>
    `);
  }

  // ── 9. Divisor: Tus cuestionamientos ───────────────────────────────
  {
    nuevaPagina();
    partes.push(`
      <section class="pagina">
        <div class="divisor d-decision">
          <img class="divisor-img" src="${img.medita}"/>
          <div class="etiqueta">Parte 3</div>
          <div class="titulo-divisor">Tus cuestionamientos</div>
          <div class="sub-divisor">Una herramienta para decidir, no solo para preguntarte.</div>
          <div class="deco"></div>
          <div class="reto-herramienta">
            <span><b>Tu reto:</b> Dependencia y Negociación</span>
            <span><b>Tu herramienta:</b> Alma valiente y palabra clara</span>
          </div>
        </div>
      </section>
    `);
  }

  // ── 10. Contenido 3a: cuestionamiento 1 + ejercicio ───────────────
  {
    const p = nuevaPagina();
    partes.push(`
      <section class="pagina">
        <div class="hoja">
          ${encabezadoHtml(img.logo, 'Tus cuestionamientos', numeroPaginaVisible++)}
          <div class="titulo" style="font-size:15.5pt;">"Siento que merezco un mejor pago, pero dudo de mis habilidades"</div>
          <p class="parrafo" style="margin-bottom:6pt;">Esto que sientes se llama Dependencia en tu Guía: el equilibrio entre saber lo que vales y necesitar que otros te lo confirmen antes de creértelo tú misma. Tu herramienta contra esto ya la tienes: tu Alma valiente, la que se lanza a lo desconocido, y tu talento de Comunicación -- pasar de las indirectas a la palabra clara, hablando en primera persona.</p>
          ${bloqueAbs('<p class="consigna c-decision">Escribe 3 evidencias reales (hechos, no opiniones) de que sí tienes las habilidades que dudas tener.</p>', 3.05, 0.65, 7.2)}
          ${cajaEscribir(p, 'decision_3_1a', 3.55, 0.65, 7.2, 1.55)}
          ${bloqueAbs('<p class="consigna c-decision">Si una amiga con tu mismo talento dudara así de sí misma, ¿qué le dirías tú? Escríbelo como si fuera una frase directa, en primera persona -- la misma valentía que usarías por ella, úsala por ti.</p>', 5.35, 0.65, 7.2)}
          ${cajaEscribir(p, 'decision_3_1b', 5.75, 0.65, 7.2, 1.8)}
        </div>
        ${pieHtml()}
      </section>
    `);
  }

  // ── 11. Contenido 3b: acción de esta semana + tracker 21 días ─────
  //      (grilla 7x3 calculada a mano, sin flexbox, para que el
  //      recuadro visual y el campo de formulario caigan exactos)
  {
    const p = nuevaPagina();
    const trackerTop = 6.55;
    const trackerLeft = 0.65;
    const celdaAncho = 1.0286; // 7.2in / 7 columnas
    const celdaAlto = 0.42;
    let celdas = '';
    for (let i = 0; i < 21; i++) {
      const col = i % 7;
      const fila = Math.floor(i / 7);
      const top = trackerTop + fila * celdaAlto;
      const left = trackerLeft + col * celdaAncho;
      celdas += `<div class="dia-num" style="top:${top}in; left:${left}in; width:0.3in;">${i + 1}</div>`;
      celdas += casillaVerificar(p, `decision_3_2_dia_${i + 1}`, top + 0.13, left + 0.32, 0.19);
    }
    partes.push(`
      <section class="pagina">
        <div class="hoja">
          ${encabezadoHtml(img.logo, 'Tus cuestionamientos', numeroPaginaVisible++)}
          <div class="titulo" style="font-size:18pt;">Del enfoque a la confianza</div>
          <p class="parrafo">Ya te lo dijimos en tu carta: <b>el enfoque no se fuerza, se elige cada día</b>. Y la confianza no se ve en un espejo, se construye en cada acción disciplinada que sostienes hasta el final.</p>
          ${bloqueAbs('<p class="consigna c-decision">Una acción pequeña, concreta, que puedas hacer ESTA semana para acercarte a pedir o cobrar lo que mereces:</p>', 3.15, 0.65, 7.2)}
          ${cajaEscribir(p, 'decision_3_2a', 3.65, 0.65, 7.2, 1.15)}
          ${bloqueAbs('<p class="consigna c-decision">¿Qué UNA cosa, si la sostienes 21 días seguidos, cambiaría tu sensación de disciplina? Escríbela y marca cada día que la cumplas:</p>', 5.15, 0.65, 7.2)}
          ${lineaEscribir(p, 'decision_3_2b', 5.75, 0.65, 7.2)}
          ${celdas}
        </div>
        ${pieHtml()}
      </section>
    `);
  }

  // ── 12. Contenido 3c: brújula de decisión ─────────────────────────
  {
    const p = nuevaPagina();
    partes.push(`
      <section class="pagina">
        <div class="hoja">
          ${encabezadoHtml(img.logo, 'Tus cuestionamientos', numeroPaginaVisible++)}
          <div class="titulo" style="font-size:18pt;">Tu brújula de decisión</div>
          <p class="parrafo">Guarda esta herramienta -- sirve para esta decisión y para cualquier otra que venga. Cuatro preguntas, cuatro voces distintas dentro de ti.</p>
          <div class="mini-etiqueta c-decision" style="top:3.55in; left:0.65in;">¿QUÉ DICE MI MENTE (LO LÓGICO)?</div>
          ${cajaEscribir(p, 'decision_3_3_mente', 3.85, 0.65, 3.4, 1.55)}
          <div class="mini-etiqueta c-decision" style="top:3.55in; left:4.45in;">¿QUÉ DICE MI CUERPO (LA SENSACIÓN)?</div>
          ${cajaEscribir(p, 'decision_3_3_cuerpo', 3.85, 4.45, 3.4, 1.55)}
          <div class="mini-etiqueta c-decision" style="top:5.65in; left:0.65in;">¿QUÉ DIRÍA LA TITI DE DENTRO DE 5 AÑOS?</div>
          ${cajaEscribir(p, 'decision_3_3_futura', 5.95, 0.65, 3.4, 1.55)}
          <div class="mini-etiqueta c-decision" style="top:5.65in; left:4.45in;">¿QUÉ ELEGIRÍA SI NO TUVIERA MIEDO?</div>
          ${cajaEscribir(p, 'decision_3_3_sinmiedo', 5.95, 4.45, 3.4, 1.55)}
        </div>
        ${pieHtml()}
      </section>
    `);
  }

  // ── 13. Divisor: Tu compromiso ─────────────────────────────────────
  {
    nuevaPagina();
    partes.push(`
      <section class="pagina">
        <div class="divisor d-compromiso">
          <img class="divisor-img" src="${img.edificio}"/>
          <div class="etiqueta">Parte 4</div>
          <div class="titulo-divisor">Tu compromiso</div>
          <div class="sub-divisor">Un paso concreto, con fecha y firma -- contigo misma.</div>
          <div class="deco"></div>
          <div class="reto-herramienta">
            <span><b>Tu reto:</b> Compromiso -- sostener sin rigidez</span>
            <span><b>Tu herramienta:</b> Tu poder de transformación</span>
          </div>
        </div>
      </section>
    `);
  }

  // ── 14. Contenido 4a: carta a un año ──────────────────────────────
  {
    const p = nuevaPagina();
    partes.push(`
      <section class="pagina">
        <div class="hoja">
          ${encabezadoHtml(img.logo, 'Tu compromiso', numeroPaginaVisible++)}
          <div class="titulo" style="font-size:18pt;">Una carta breve a la Titi de dentro de un año</div>
          <p class="parrafo">Suelta lo que pesa, abraza lo que eres: tu flow te espera, no en un futuro lejano, sino en cada paso pequeño que das hoy. Cuéntale a esa Titi qué decidiste hoy, y por qué.</p>
          ${cajaEscribir(p, 'compromiso_4_1', 3.6, 0.65, 7.2, 5.6)}
        </div>
        ${pieHtml()}
      </section>
    `);
  }

  // ── 15. Contenido 4b: primer paso + firma (todo en absoluto, con
  //       espacio generoso entre bloques para que nada se encime) ────
  {
    const p = nuevaPagina();
    partes.push(`
      <section class="pagina">
        <div class="hoja">
          ${encabezadoHtml(img.logo, 'Tu compromiso', numeroPaginaVisible++)}
          <div class="titulo" style="font-size:18pt;">Tu primer paso</div>
          <p class="parrafo" style="margin-bottom:8pt;">Tu Guía dice que eres recursiva: cuando un plan no sale como esperabas, no te quedas estancada, encuentras otra forma. Si esta acción no sale perfecta a la primera, esa misma creatividad es tu herramienta para ajustarla, no para abandonarla.</p>
          <p class="consigna c-compromiso">Escribe UNA acción concreta que darás esta semana, y la fecha en la que la harás.</p>

          <div class="mini-etiqueta c-compromiso" style="top: 3.35in; left:0.65in;">ACCIÓN</div>
          ${lineaEscribir(p, 'compromiso_4_2_accion', 3.65, 0.65, 4.6)}
          <div class="mini-etiqueta c-compromiso" style="top: 3.35in; left:5.45in;">FECHA</div>
          ${lineaEscribir(p, 'compromiso_4_2_fecha', 3.65, 5.45, 1.4)}

          <div class="bloque" style="position:absolute; top:4.5in; left:0.65in; width:7.2in; border-left-color:#22c55e; background:#f0fdf4;">
            <div class="etq" style="color:#16a34a;">Firmo este compromiso conmigo misma</div>
            <div class="pregunta" style="color:#14532d; font-size:11.5pt;">No prometo tenerlo todo resuelto. Prometo darme el permiso de intentarlo, con la disciplina y la seguridad que ya son mías.</div>
          </div>

          <div class="mini-etiqueta c-compromiso" style="top: 6.15in; left:0.65in;">FIRMA</div>
          ${lineaEscribir(p, 'compromiso_4_3_firma', 6.45, 0.65, 4.6)}
          <div class="mini-etiqueta c-compromiso" style="top: 6.15in; left:5.45in;">FECHA</div>
          ${lineaEscribir(p, 'compromiso_4_3_fecha', 6.45, 5.45, 1.4)}
        </div>
        ${pieHtml()}
      </section>
    `);
  }

  // ── 16. Cierre ─────────────────────────────────────────────────────
  {
    nuevaPagina();
    partes.push(`
      <section class="pagina pagina-gradiente">
        <img class="pg-logo" src="${img.logo}"/>
        <div class="pg-img-wrap"><img src="${img.cierre}"/></div>
        <div class="pg-frase">No necesitas gritar para dejar huella. Solo necesitas seguir escribiéndote, un día a la vez.</div>
        <div class="pg-linea"></div>
        <div class="pg-tag">Con cariño, Flowi 💜</div>
        <div class="pg-fecha">03/09/2026</div>
      </section>
    `);
  }

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><style>${CSS}</style></head><body>${partes.join('\n')}</body></html>`;

  console.log(`Renderizando ${partes.length} páginas con Puppeteer...`);
  const navegador = await puppeteer.launch({ headless: true });
  let pdfBuffer: Buffer;
  try {
    const pagina = await navegador.newPage();
    await pagina.setContent(html, { waitUntil: 'load' });
    pdfBuffer = Buffer.from(
      await pagina.pdf({ width: '8.5in', height: '11in', printBackground: true, preferCSSPageSize: false })
    );
  } finally {
    await navegador.close();
  }

  console.log(`Agregando ${CAMPOS.length} campos de formulario...`);
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const form = pdfDoc.getForm();
  const paginas = pdfDoc.getPages();
  const fuente = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const campo of CAMPOS) {
    const pagina = paginas[campo.pagina];
    const altoPaginaPt = pagina.getHeight(); // 11in * 72
    if (campo.tipo === 'texto') {
      const x = campo.left * 72;
      const y = altoPaginaPt - campo.top * 72 - campo.height * 72;
      const w = campo.width * 72;
      const h = campo.height * 72;
      const textField = form.createTextField(`cuaderno.${campo.nombre}`);
      if (campo.multilinea) textField.enableMultiline();
      textField.setText('');
      textField.addToPage(pagina, {
        x,
        y,
        width: w,
        height: h,
        borderWidth: 0,
        font: fuente,
      });
      textField.setFontSize(campo.tamanioFuente);
      textField.updateAppearances(fuente);
    } else {
      const x = campo.left * 72;
      const y = altoPaginaPt - campo.top * 72 - campo.lado * 72;
      const w = campo.lado * 72;
      const checkBox = form.createCheckBox(`cuaderno.${campo.nombre}`);
      checkBox.addToPage(pagina, { x, y, width: w, height: w, borderWidth: 0 });
    }
  }

  const pdfFinal = await pdfDoc.save();
  await writeFile(SALIDA, pdfFinal);
  console.log(`Listo: ${SALIDA} (${partes.length} páginas, ${CAMPOS.length} campos)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
