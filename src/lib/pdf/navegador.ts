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
