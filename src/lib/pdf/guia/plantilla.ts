import { CSS_GUIA } from './css';
import type { ClaveImagen } from './imagenes';
import type { GuiaCondensada, SeccionGuia } from './tipos';

type Imagenes = Record<ClaveImagen, string>;

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function coverHtml(g: GuiaCondensada, imgs: Imagenes): string {
  return `
<div class="cover">
  <div class="cover-top">
    <img class="cover-logo" src="${imgs.logo}" alt="FlowAndo"/>
    <div class="cover-greeting">¡Hola</div>
    <div class="cover-name">${escaparHtml(g.nombre)}!</div>
    <div class="cover-welcome">Bienvenido/a al Flow</div>
  </div>
  <div class="cover-img-wrap">
    <img src="${imgs.eureka}" alt="Flowa Eureka"/>
  </div>
  <div class="cover-bottom">
    <div class="cover-dates">
      Origen del Flow: ${escaparHtml(g.origen ?? '—')} &nbsp;·&nbsp; ${escaparHtml(g.fecha)}
    </div>
    <div class="cover-bar"></div>
    <div class="cover-tagline">El Lab del Talento &nbsp;·&nbsp; Descubre quién eres realmente.</div>
  </div>
</div>`;
}

function talentoUnicoHtml(g: GuiaCondensada, imgs: Imagenes, logoB64: string, fecha: string): string {
  const tu = g.talento_unico;
  return `
<div class="pg">
  <div class="pg-header">
    <div class="pg-header-text">
      <span class="pg-badge badge-talento">Tu Esencia</span>
      <div class="pg-title">TIENES UN TALENTO ÚNICO</div>
      <div class="pg-subtitle">${escaparHtml(tu.titulo_sello ?? '')}</div>
    </div>
    <div class="pg-header-img"><img src="${imgs.eureka}"/></div>
  </div>
  <div class="divider div-talento"></div>
  <div class="body-text">${escaparHtml(tu.texto ?? '')}</div>
  <div style="text-align:center;margin-top:10pt;">
    <img src="${imgs.flowi}" style="max-height:105pt;object-fit:contain;"/>
  </div>
  <div class="footer">
    <span>El Lab del Talento</span>
    <img src="${logoB64}" alt="FlowAndo"/>
    <span>${escaparHtml(fecha)}</span>
  </div>
</div>`;
}

function chapterBanner(
  label: string,
  title: string,
  subtitle: string,
  bgCls: string,
  cCls: string,
  imgKey: ClaveImagen,
  imgs: Imagenes
): string {
  return `
  <div class="${bgCls} ${cCls}" style="display:flex; align-items:center; gap:10pt; padding:8pt 10pt; border-radius:10pt; margin-bottom:9pt;">
    <img src="${imgs[imgKey]}" style="height:55pt;object-fit:contain;border-radius:6pt;"/>
    <div style="flex:1;">
      <div class="chapter-label" style="font-size:7pt;margin-bottom:2pt;">${label}</div>
      <div class="chapter-title" style="font-size:16pt;margin-bottom:2pt;">${title}</div>
      <div class="chapter-sub" style="font-size:9pt;">${subtitle}</div>
      <div class="chapter-deco" style="width:40pt;height:2.5pt;margin-top:5pt;"></div>
    </div>
  </div>`;
}

/** Mapeo sección -> imagen. Ver nota en imagenes.ts sobre el set reducido de assets disponibles. */
const SECTION_IMAGES: Record<string, ClaveImagen> = {
  Carácter: 'flowi',
  Temperamento: 'escena4',
  'Talentos innatos': 'eureka',
  'Talentos para potenciar': 'escena1',
  'Propósito-Intuición': 'medita',
  'Propósito-Equilibrio': 'flowa',
  'Liderazgo-Inspirar': 'p3',
  'Liderazgo-Transformacional': 'p6',
  Comunicación: 'escribe',
  'Inteligencia musical': 'escena3',
  'Inteligencia naturaleza': 'puente',
  'Inteligencia expresiva': 'escribe',
  'Ecos infancia': 'eureka',
  'El pasado': 'medita',
  'Tolerancia frustración': 'triste',
  'Estabilidad emocional': 'ilumina',
  Felicidad: 'eureka',
  Dependencia: 'flowi',
  Pertenencia: 'escena5',
  'Trabajo en equipo': 'escenafutbol',
  Responsabilidad: 'compu',
  'Etapa del Flow': 'flowe',
  'Retos internos': 'triste',
  'Desafíos sanación': 'ilumina',
  Balance: 'medita',
  'Tu mente faro': 'eureka',
  Compromiso: 'p5',
  'Adaptación al cambio': 'flowe',
  Negociación: 'escena3',
  Recursividad: 'p2',
};

function imagenDeSeccion(nombreSeccion: string, imgs: Imagenes): string {
  const clave = SECTION_IMAGES[nombreSeccion] ?? 'flowi';
  return imgs[clave];
}

function sectionBlock(
  item: SeccionGuia,
  badgeCls: string,
  badgePrefix: string,
  subCls: string,
  divCls: string,
  rlCls: string,
  cbCls: string,
  nombre: string,
  mostrarDivisor: boolean
): string {
  const div = mostrarDivisor ? `<div class="divider ${divCls}" style="margin-bottom:6pt;"></div>` : '';
  return `
  <div style="margin-bottom:5pt;">
    <span class="pg-badge ${badgeCls}" style="margin-bottom:2pt;display:inline-block;">${badgePrefix} · ${escaparHtml(item.seccion)}</span>
    <div class="pg-title" style="font-size:11.5pt;line-height:1.2;">${escaparHtml(item.subtitulo ?? item.seccion)}</div>
    <div class="pg-subtitle ${subCls}" style="font-size:8.5pt;">${escaparHtml(item.seccion)}</div>
  </div>
  ${div}
  <div class="body-text" style="font-size:10pt;margin-bottom:5pt;">${escaparHtml(item.texto ?? '')}</div>
  <div class="recuerda-label ${rlCls}" style="font-size:8pt;">${escaparHtml(nombre)}, siempre ten presente...</div>
  <div class="two-col" style="margin-bottom:3pt;">
    <div class="col-box ${cbCls}"><p style="font-size:9pt;">${escaparHtml(item.recuerda_izq ?? '')}</p></div>
    <div class="col-box ${cbCls}"><p style="font-size:9pt;">${escaparHtml(item.recuerda_der ?? '')}</p></div>
  </div>`;
}

function buildSectionPages(
  items: SeccionGuia[],
  badgeCls: string,
  badgePrefix: string,
  subCls: string,
  divCls: string,
  rlCls: string,
  cbCls: string,
  logoB64: string,
  nombre: string,
  fecha: string,
  imgs: Imagenes,
  chapterBannerHtml?: string
): string[] {
  const paginas: string[] = [];
  let i = 0;
  let paginaIdx = 0;

  while (i < items.length) {
    const itemA = items[i];
    const itemB = items[i + 1];

    const mostrarImg = paginaIdx % 3 === 0 && !chapterBannerHtml;
    const imgBlock = mostrarImg
      ? `<div class="pg-header-img"><img src="${imagenDeSeccion(itemA.seccion, imgs)}"/></div>`
      : '';

    const sep = itemB ? '<div style="border-top:1pt dashed #e0d4f7;margin:7pt 0;"></div>' : '';

    const blockA = sectionBlock(itemA, badgeCls, badgePrefix, subCls, divCls, rlCls, cbCls, nombre, true);
    const blockB = itemB
      ? sectionBlock(itemB, badgeCls, badgePrefix, subCls, divCls, rlCls, cbCls, nombre, false)
      : '';

    const banner = paginaIdx === 0 && chapterBannerHtml ? chapterBannerHtml : '';

    paginas.push(`
<div class="pg">
  ${banner}
  <div style="display:flex;align-items:flex-start;gap:8pt;">
    <div style="flex:1;">${blockA}</div>
    ${imgBlock}
  </div>
  ${sep}
  ${blockB}
  <div class="footer">
    <span>El Lab del Talento</span>
    <img src="${logoB64}" alt="FlowAndo"/>
    <span>${escaparHtml(fecha)}</span>
  </div>
</div>`);
    i += 2;
    paginaIdx += 1;
  }
  return paginas;
}

function closingHtml(g: GuiaCondensada, frase: string, imgs: Imagenes): string {
  return `
<div class="closing">
  <img class="cl-logo" src="${imgs.logo}" alt="FlowAndo"/>
  <img class="cl-char" src="${imgs.p6}" alt="celebración"/>
  <div class="closing-quote">${escaparHtml(frase)}</div>
  <div class="closing-bar"></div>
  <div class="closing-flowi">
    <img src="${imgs.flowi}" alt="Flowi"/>
  </div>
  <div class="closing-fecha">
    Con amor, Flowi ❤ &nbsp;·&nbsp; ${escaparHtml(g.fecha)}
  </div>
</div>`;
}

/** Arma el HTML completo de la Guía del Flow, lista para convertir a PDF. */
export function construirHtmlGuia(g: GuiaCondensada, imgs: Imagenes): string {
  const logoB64 = imgs.logo;
  const nombre = g.nombre;
  const fecha = g.fecha;
  const partes: string[] = [];

  partes.push(coverHtml(g, imgs));
  partes.push(talentoUnicoHtml(g, imgs, logoB64, fecha));

  const bTalentos = chapterBanner(
    'Tu Sello',
    'TALENTOS PODEROSOS',
    'Las fortalezas que nos hacen únicos y nos impulsan hacia el éxito',
    'chapter-bg-talento',
    'c-talento',
    'p2',
    imgs
  );
  partes.push(
    ...buildSectionPages(
      g.talentos,
      'badge-talento',
      'Talentos',
      '',
      'div-talento',
      'rl-talento',
      'cb-talento',
      logoB64,
      nombre,
      fecha,
      imgs,
      bTalentos
    )
  );

  const bEmociones = chapterBanner(
    'Tu Mundo Interior',
    'EMOCIONES',
    'La energía interna que nos impulsa o nos desafía',
    'chapter-bg-emocion',
    'c-emocion',
    'ilumina',
    imgs
  );
  partes.push(
    ...buildSectionPages(
      g.emociones,
      'badge-emocion',
      'Emociones',
      's-emocion',
      'div-emocion',
      'rl-emocion',
      'cb-emocion',
      logoB64,
      nombre,
      fecha,
      imgs,
      bEmociones
    )
  );

  const bPertene = chapterBanner(
    'Tus Vínculos',
    'PERTENENCIA Y COMPROMISO',
    'Los lazos que nos fortalecen y nos dan propósito colectivo',
    'chapter-bg-pertene',
    'c-pertene',
    'escena5',
    imgs
  );
  partes.push(
    ...buildSectionPages(
      g.pertenencia,
      'badge-pertene',
      'Pertenencia',
      's-pertene',
      'div-pertene',
      'rl-pertene',
      'cb-pertene',
      logoB64,
      nombre,
      fecha,
      imgs,
      bPertene
    )
  );

  const bDesafios = chapterBanner(
    'Tu Evolución',
    'DESAFÍOS',
    'Los retos que nos impulsan a evolucionar y transformarnos',
    'chapter-bg-desafio',
    'c-desafio',
    'triste',
    imgs
  );
  partes.push(
    ...buildSectionPages(
      g.desafios,
      'badge-desafio',
      'Desafíos',
      's-desafio',
      'div-desafio',
      'rl-desafio',
      'cb-desafio',
      logoB64,
      nombre,
      fecha,
      imgs,
      bDesafios
    )
  );

  const frase =
    g.frase_cierre ?? 'El verdadero crecimiento no es un destino, sino una aventura en constante evolución.';
  partes.push(closingHtml(g, frase, imgs));

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/>
<style>${CSS_GUIA}</style>
</head>
<body>${partes.join('')}</body>
</html>`;
}
