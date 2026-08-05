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
  outputFileTracingIncludes: {
    '/api/generar-guia': ['./node_modules/@sparticuz/chromium/bin/**'],
    '/api/generar-carta': ['./node_modules/@sparticuz/chromium/bin/**'],
  },
};

export default nextConfig;
