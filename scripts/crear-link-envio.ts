/**
 * Crea un link de envío configurado: quien se registre con ese link, al
 * terminar su Carta, recibe la Guía y la Carta por correo en el
 * destinatario que le des acá — no en su propio correo (ver
 * supabase/migrations/0005_flow_links_envio.sql y src/lib/envio/enlace.ts).
 *
 * Uso:
 *   npx tsx scripts/crear-link-envio.ts "correo@destino.com" ["Etiqueta opcional"]
 *
 * Ejemplo: quieres compartir el cuestionario con varios candidatos de una
 * empresa y que todos los resultados te lleguen a ti (o a la empresa) en
 * vez de a cada candidato:
 *   npx tsx scripts/crear-link-envio.ts "rrhh@empresa.com" "Proceso Empresa X"
 */
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

process.loadEnvFile(path.join(process.cwd(), '.env.local'));

async function main() {
  const correoDestino = process.argv[2];
  const etiqueta = process.argv[3] ?? null;

  if (!correoDestino || !correoDestino.includes('@')) {
    console.error('Uso: npx tsx scripts/crear-link-envio.ts "correo@destino.com" ["Etiqueta opcional"]');
    process.exit(1);
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin
    .from('flow_links_envio')
    .insert({ correo_destino: correoDestino, etiqueta })
    .select('id')
    .single();

  if (error) {
    console.error('No se pudo crear el link:', error.message);
    process.exit(1);
  }

  const siteUrl = 'https://guia-del-flow.vercel.app';
  console.log(`Link creado${etiqueta ? ` (${etiqueta})` : ''}. Los resultados de quien lo use llegarán a: ${correoDestino}\n`);
  console.log(`${siteUrl}/registro?envio=${data.id}`);
}

main();
