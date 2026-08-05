import { CSS_CARTA } from './css';
import type { ClaveImagen } from '../guia/imagenes';
import type { CartaCondensada } from './tipos';

type Imagenes = Record<ClaveImagen, string>;

function escaparHtml(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function envolver(paginaCss: 'portada' | 'interna', bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/>
<style>${CSS_CARTA}
@page { size: 8.5in 11in; ${paginaCss === 'portada' ? 'margin: 0;' : 'margin: 0.55in 0.65in;'} }
</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

function footer(nombre: string, fecha: string): string {
  return `<div class="footer-pagina"><span>Carta para ${escaparHtml(nombre)}</span><span>FlowAndo · ${escaparHtml(fecha)}</span></div>`;
}

function parrafos(textos: string[]): string {
  return textos.map((t) => `<p class="parrafo">${escaparHtml(t)}</p>`).join('');
}

function bloqueRespuesta(textos: [string, string, string]): string {
  return `<div class="bloque-respuesta">${textos.map((t) => `<p>${escaparHtml(t)}</p>`).join('')}</div>`;
}

// ── Página 1: portada ───────────────────────────────────────────────────
function paginaPortada(c: CartaCondensada, imgs: Imagenes): string {
  return envolver(
    'portada',
    `
<div class="portada">
  <div class="portada-top"><img src="${imgs.logo}" alt="FlowAndo"/></div>
  <div>
    <div class="portada-tag">Una carta para ti</div>
    <div class="portada-nombre">${escaparHtml(c.nombre)}</div>
    <div class="portada-estrella">✦</div>
    <div class="portada-linea"></div>
    <div class="portada-frase">${escaparHtml(c.frase_portada)}</div>
  </div>
  <div class="portada-img-wrap"><img src="${imgs.escena5}" alt=""/></div>
  <div class="portada-fecha">${escaparHtml(c.fecha)}</div>
</div>`
  );
}

// ── Página 2: introducción ───────────────────────────────────────────────
function paginaIntro(c: CartaCondensada, imgs: Imagenes): string {
  return envolver(
    'interna',
    `
<div class="pagina-interna">
  <div class="header">
    <img src="${imgs.logo}" alt="FlowAndo"/>
    <span class="header-titulo">Carta personal · FlowAndo</span>
    <span class="header-numero">02</span>
  </div>
  <div class="saludo">Hola,</div>
  <div class="titulo-grande">${escaparHtml(c.nombre)}, qué bonito es leerte.</div>
  <div class="linea-decorativa"></div>
  ${parrafos([c.intro.parrafo_1, c.intro.parrafo_2, c.intro.parrafo_3])}
  ${footer(c.nombre, c.fecha)}
</div>`
  );
}

// ── Página 3: cuestionamiento 1 ──────────────────────────────────────────
function paginaCuestionamiento1(c: CartaCondensada, imgs: Imagenes): string {
  const q = c.cuestionamiento_1;
  return envolver(
    'interna',
    `
<div class="pagina-interna">
  <div class="header">
    <img src="${imgs.logo}" alt="FlowAndo"/>
    <span class="header-titulo">Carta personal · FlowAndo</span>
    <span class="header-numero">03</span>
  </div>
  <div class="bloque-cuestionamiento">
    <div class="bloque-etiqueta">Cuestionamiento 01</div>
    <div class="bloque-pregunta">"${escaparHtml(q.pregunta)}"</div>
    ${bloqueRespuesta(q.respuesta)}
  </div>
  ${parrafos([q.cierre])}
  ${footer(c.nombre, c.fecha)}
</div>`
  );
}

// ── Página 4: cuestionamiento 2 ──────────────────────────────────────────
function paginaCuestionamiento2(c: CartaCondensada, imgs: Imagenes): string {
  const q = c.cuestionamiento_2;
  return envolver(
    'interna',
    `
<div class="pagina-interna">
  <div class="header">
    <img src="${imgs.logo}" alt="FlowAndo"/>
    <span class="header-titulo">Carta personal · FlowAndo</span>
    <span class="header-numero">04</span>
  </div>
  <div class="bloque-cuestionamiento">
    <div class="bloque-etiqueta">Cuestionamiento 02</div>
    <div class="bloque-pregunta">"${escaparHtml(q.pregunta)}"</div>
    ${bloqueRespuesta(q.respuesta)}
  </div>
  <div class="pie-foto-wrap">
    <img src="${imgs.carticas}" alt=""/>
    <div class="pie-foto">${escaparHtml(q.pie_foto)}</div>
  </div>
  ${footer(c.nombre, c.fecha)}
</div>`
  );
}

// ── Página 5: cuestionamiento 3 + cierre ─────────────────────────────────
function paginaCuestionamiento3(c: CartaCondensada, imgs: Imagenes): string {
  const q = c.cuestionamiento_3;
  return envolver(
    'interna',
    `
<div class="pagina-interna">
  <div class="header">
    <img src="${imgs.logo}" alt="FlowAndo"/>
    <span class="header-titulo">Carta personal · FlowAndo</span>
    <span class="header-numero">05</span>
  </div>
  <div class="bloque-cuestionamiento">
    <div class="bloque-etiqueta">Cuestionamiento 03</div>
    <div class="bloque-pregunta">"${escaparHtml(q.pregunta)}"</div>
    ${bloqueRespuesta(q.respuesta)}
  </div>
  ${parrafos([q.cierre_1, q.cierre_2])}
  <div class="firma-wrap">
    <div class="firma-label">Con todo el cariño del mundo,</div>
    <div class="firma-nombre">Flowi ♥</div>
    <div class="firma-pie">El Lab del Talento · FlowAndo · ${escaparHtml(c.fecha)}</div>
  </div>
  ${footer(c.nombre, c.fecha)}
</div>`
  );
}

/** Devuelve las 5 páginas como 5 documentos HTML independientes (ver
 * navegador.ts → cartaAPdf: cada una se renderiza y se une por separado,
 * porque un solo HTML largo con saltos de página corta texto entre
 * páginas). */
export function construirPaginasCarta(c: CartaCondensada, imgs: Imagenes): string[] {
  return [
    paginaPortada(c, imgs),
    paginaIntro(c, imgs),
    paginaCuestionamiento1(c, imgs),
    paginaCuestionamiento2(c, imgs),
    paginaCuestionamiento3(c, imgs),
  ];
}
