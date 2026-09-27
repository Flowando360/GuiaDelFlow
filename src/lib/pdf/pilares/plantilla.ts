import { CSS_PILARES } from './css';
import type { ClaveImagen } from '../guia/imagenes';
import type { PilaresCondensado, PilarEscrito } from './tipos';

type Imagenes = Record<ClaveImagen, string>;

const IMAGEN_POR_PILAR: Record<PilarEscrito['nombre_pilar'], ClaveImagen> = {
  Pertenencia: 'pmundo',
  Propósito: 'eureka',
  Trascendencia: 'medita',
  Narración: 'escribe',
};

function escaparHtml(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function envolver(paginaCss: 'portada' | 'interna', bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/>
<style>${CSS_PILARES}
@page { size: 8.5in 11in; ${paginaCss === 'portada' ? 'margin: 0;' : 'margin: 0.55in 0.65in;'} }
</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

function footer(nombre: string, fecha: string): string {
  return `<div class="footer-pagina"><span>Los 4 Pilares de ${escaparHtml(nombre)}</span><span>FlowAndo · ${escaparHtml(fecha)}</span></div>`;
}

function parrafos(textos: string[]): string {
  return textos.map((t) => `<p class="parrafo">${escaparHtml(t)}</p>`).join('');
}

// ── Página 1: portada ───────────────────────────────────────────────────
function paginaPortada(c: PilaresCondensado, imgs: Imagenes): string {
  return envolver(
    'portada',
    `
<div class="portada">
  <div class="portada-top"><img src="${imgs.logo}" alt="FlowAndo"/></div>
  <div>
    <div class="portada-tag">Los 4 Pilares</div>
    <div class="portada-nombre">${escaparHtml(c.nombre)}</div>
    <div class="portada-estrella">✦</div>
    <div class="portada-linea"></div>
    <div class="portada-frase">${escaparHtml(c.frase_portada)}</div>
  </div>
  <div class="portada-img-wrap"><img src="${imgs.puente}" alt=""/></div>
  <div class="portada-fecha">${escaparHtml(c.fecha)}</div>
</div>`
  );
}

// ── Página 2: introducción ───────────────────────────────────────────────
function paginaIntro(c: PilaresCondensado, imgs: Imagenes): string {
  return envolver(
    'interna',
    `
<div class="pagina-interna">
  <div class="header">
    <img src="${imgs.logo}" alt="FlowAndo"/>
    <span class="header-titulo">Los 4 Pilares · FlowAndo</span>
    <span class="header-numero">02</span>
  </div>
  <div class="saludo">Hola,</div>
  <div class="titulo-grande">${escaparHtml(c.nombre)}, esto fue lo que encontraste.</div>
  <div class="linea-decorativa"></div>
  ${parrafos([c.introduccion.parrafo_1, c.introduccion.parrafo_2])}
  ${footer(c.nombre, c.fecha)}
</div>`
  );
}

// ── Páginas 3-6: una por pilar ───────────────────────────────────────────
function paginaPilar(c: PilaresCondensado, imgs: Imagenes, pilar: PilarEscrito, numero: number): string {
  const claveImagen = IMAGEN_POR_PILAR[pilar.nombre_pilar];
  return envolver(
    'interna',
    `
<div class="pagina-interna">
  <div class="header">
    <img src="${imgs.logo}" alt="FlowAndo"/>
    <span class="header-titulo">Los 4 Pilares · FlowAndo</span>
    <span class="header-numero">0${numero}</span>
  </div>
  <div class="pilar-numero">Pilar ${numero - 2} de 4</div>
  <div class="pilar-nombre">${escaparHtml(pilar.nombre_pilar)}</div>
  <div class="pilar-frase-ancla">${escaparHtml(pilar.frase_ancla)}</div>
  <div class="pilar-imagen-wrap"><img src="${imgs[claveImagen]}" alt=""/></div>
  <div class="pilar-reflexion">${escaparHtml(pilar.reflexion)}</div>
  ${footer(c.nombre, c.fecha)}
</div>`
  );
}

// ── Página 7: historia reescrita + cierre ────────────────────────────────
function paginaHistoriaYCierre(c: PilaresCondensado, imgs: Imagenes): string {
  return envolver(
    'interna',
    `
<div class="pagina-interna">
  <div class="header">
    <img src="${imgs.logo}" alt="FlowAndo"/>
    <span class="header-titulo">Los 4 Pilares · FlowAndo</span>
    <span class="header-numero">07</span>
  </div>
  <div class="bloque-historia">
    <div class="bloque-historia-titulo">${escaparHtml(c.historia_reescrita.titulo)}</div>
    <p>${escaparHtml(c.historia_reescrita.parrafo_1)}</p>
    <p>${escaparHtml(c.historia_reescrita.parrafo_2)}</p>
  </div>
  ${parrafos([c.historia_reescrita.cierre, c.invitacion_final])}
  <div class="firma-wrap">
    <div class="firma-label">Con todo el cariño del mundo,</div>
    <div class="firma-nombre">Flowi ♥</div>
    <div class="firma-pie">El Lab del Talento · FlowAndo · ${escaparHtml(c.fecha)}</div>
  </div>
  ${footer(c.nombre, c.fecha)}
</div>`
  );
}

/** Devuelve las 7 páginas como 7 documentos HTML independientes (ver
 * navegador.ts → htmlsAPdfUnido: cada una se renderiza y se une por
 * separado, mismo motivo que la Carta). */
export function construirPaginasPilares(c: PilaresCondensado, imgs: Imagenes): string[] {
  return [
    paginaPortada(c, imgs),
    paginaIntro(c, imgs),
    ...c.pilares.map((pilar, i) => paginaPilar(c, imgs, pilar, i + 3)),
    paginaHistoriaYCierre(c, imgs),
  ];
}
