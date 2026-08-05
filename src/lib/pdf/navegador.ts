import type { Browser } from 'puppeteer-core';

/**
 * En Vercel (producción/preview) usa @sparticuz/chromium, un binario de
 * Chromium empaquetado para funciones serverless. En desarrollo local usa
 * el Chromium completo que instala el paquete 'puppeteer' (devDependency)
 * porque el binario de @sparticuz/chromium es para Linux, no sirve en
 * Windows/Mac.
 */
export async function lanzarNavegador(): Promise<Browser> {
  const enVercel = Boolean(process.env.VERCEL);

  if (enVercel) {
    const [{ default: puppeteer }, { default: chromium }] = await Promise.all([
      import('puppeteer-core'),
      import('@sparticuz/chromium'),
    ]);
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  const { default: puppeteer } = await import('puppeteer');
  return puppeteer.launch({ headless: true }) as unknown as Promise<Browser>;
}

/** HTML -> PDF (buffer). Cierra el navegador siempre, incluso si falla. */
export async function htmlAPdf(
  html: string,
  opciones: { anchoPulgadas: number; altoPulgadas: number }
): Promise<Buffer> {
  const navegador = await lanzarNavegador();
  try {
    const pagina = await navegador.newPage();
    await pagina.setContent(html, { waitUntil: 'load' });
    const pdf = await pagina.pdf({
      width: `${opciones.anchoPulgadas}in`,
      height: `${opciones.altoPulgadas}in`,
      printBackground: true,
      preferCSSPageSize: false,
    });
    return Buffer.from(pdf);
  } finally {
    await navegador.close();
  }
}

/**
 * Varios HTML -> un solo PDF, cada uno renderizado como su PROPIA página
 * (no como un solo HTML largo con saltos de página). Es el método que
 * pide Codigo/Generar_Carta.txt: con un solo HTML largo, WeasyPrint (y
 * Chromium/Puppeteer igual) puede cortar texto a mitad de página o dejar
 * imágenes solas en páginas vacías cuando el contenido varía de tamaño
 * entre secciones. Renderizando cada página por separado a tamaño de
 * carta exacto y uniéndolas después (pdf-lib) se evita ese problema.
 *
 * IMPORTANTE: si el contenido de un capítulo es más alto que el tamaño
 * de página fijado (ej. una respuesta larga de Claude + una imagen),
 * Chromium genera automáticamente una página física adicional para el
 * desborde. Antes este código solo copiaba la página [0] de cada
 * capítulo, así que ese desborde se perdía EN SILENCIO (bug real: la
 * imagen y el pie de foto del cuestionamiento_2 desaparecían sin error
 * ni página en blanco delatora). Ahora se copian todas las páginas que
 * Chromium haya generado por capítulo, para no perder contenido nunca —
 * el costo es que la Carta puede terminar con más de 5 páginas si algún
 * capítulo se desborda, en vez de perder texto o imágenes.
 */
export async function htmlsAPdfUnido(
  htmls: string[],
  opciones: { anchoPulgadas: number; altoPulgadas: number }
): Promise<Buffer> {
  const { PDFDocument } = await import('pdf-lib');
  const navegador = await lanzarNavegador();
  try {
    const pdfFinal = await PDFDocument.create();
    for (const html of htmls) {
      const pagina = await navegador.newPage();
      try {
        await pagina.setContent(html, { waitUntil: 'load' });
        const bufferPagina = await pagina.pdf({
          width: `${opciones.anchoPulgadas}in`,
          height: `${opciones.altoPulgadas}in`,
          printBackground: true,
          preferCSSPageSize: false,
        });
        const pdfPagina = await PDFDocument.load(bufferPagina);
        const indices = pdfPagina.getPageIndices();
        const copiadas = await pdfFinal.copyPages(pdfPagina, indices);
        for (const copiada of copiadas) pdfFinal.addPage(copiada);
      } finally {
        await pagina.close();
      }
    }
    return Buffer.from(await pdfFinal.save());
  } finally {
    await navegador.close();
  }
}
