import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Puppeteer/Chromium traen binarios nativos — que el bundler no intente
  // procesarlos, solo se requieren tal cual en tiempo de ejecución.
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium', 'puppeteer'],
};

export default nextConfig;
