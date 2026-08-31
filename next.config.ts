import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Puppeteer/Chromium traen binarios nativos — que el bundler no intente
  // procesarlos, solo se requieren tal cual en tiempo de ejecución.
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium', 'puppeteer'],
  // serverExternalPackages evita que el bundler toque el JS de
  // @sparticuz/chromium, pero el binario real (node_modules/@sparticuz/
  // chromium/bin/*.br) no lo detecta el file-tracing automático porque
  // la ruta se arma en tiempo de ejecución (chromium.executablePath()),
  // no con un import estático. Sin esto, la función serverless se
  // despliega sin el binario y falla con "input directory does not
  // exist" (confirmado en un deploy real).
  //
  // '/panel' está acá por lo mismo: el botón "Reintentar" (ver
  // src/app/panel/actions.ts, regenerarDocumentos) llama a la MISMA
  // lógica de generación (src/lib/generacion/) pero como server action de
  // esa página, no como estas dos rutas -- es un bundle de función
  // serverless aparte, así que necesita su propia entrada acá o falla
  // con el mismo error (confirmado 2026-08-31: reventó justo así al
  // reintentar por primera vez).
  outputFileTracingIncludes: {
    '/api/generar-guia': ['./node_modules/@sparticuz/chromium/bin/**'],
    '/api/generar-carta': ['./node_modules/@sparticuz/chromium/bin/**'],
    '/panel': ['./node_modules/@sparticuz/chromium/bin/**'],
  },
};

export default nextConfig;
