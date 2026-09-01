/**
 * Uso puntual (2026-09-01): manda por correo la Guía+Carta ya generadas a
 * través del aplicativo a los colaboradores de Mármoles y Servicios que
 * todavía no las habían recibido — los PDFs ya estaban en
 * pdfs-generados/Guias_Marmoles&Servicios/ (descargados con la herramienta
 * de descarga masiva de /panel), pero el correo automático nunca se les
 * mandó. Excluye a propósito a comercial, Líder de Talento Humano y
 * Gerente: sus documentos en esa misma carpeta son de un lote generado
 * ANTES de que existiera el aplicativo (no tienen fila en
 * flow_cuestionarios), así que no aplican acá.
 *
 * Usa la misma plantilla de correo que ya usa /api/generar-carta y /panel
 * (enviarCorreoDocumentos), con BCC automático a innovacion@flowando.com.
 *
 * Uso:
 *   npx tsx scripts/enviar-guias-marmoles.ts
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database.types';
import { enviarCorreoDocumentos } from '../src/lib/email/enviar';

process.loadEnvFile(path.join(process.cwd(), '.env.local'));

const admin = createSupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const CARPETA = path.join(process.cwd(), 'pdfs-generados', 'Guias_Marmoles&Servicios');
const EMPRESA = 'Mármoles y Servicios';
const FIRMANTE = 'Alexandra Rozo Trejos';

const PERSONAS = [
  { cuestionarioId: 'f67a6cd0-5b90-42c8-8d92-9fc3241a46e2', archivo: 'Brayner_Jose_vergara_Pérez_MyS', email: 'braynervergara09@gmail.com', apodo: 'Brayner' },
  { cuestionarioId: 'af4045ce-d50c-470c-8840-86a4a908e6ac', archivo: 'Carlos_Andrés_Martínez_Baldovino_MyS', email: '17051999cmb@gmail.com', apodo: 'Carlitos' },
  { cuestionarioId: '2bc435c1-31ec-4001-9676-65996b4f725d', archivo: 'Daniel_Gerardo_Flórez_Pérez_MyS', email: 'daflo2021@gmail.com', apodo: 'Daniel' },
  { cuestionarioId: '539d3677-c094-418c-bd00-e3b76a7c01cf', archivo: 'Eveli_Córdoba_Restrepo_MyS', email: 'evelicores@gmail.com', apodo: 'Eveli' },
  { cuestionarioId: '4d6323af-09c5-4eb1-9f0c-905b15f1949f', archivo: 'Ian_Mateo_Narváez_Viveros_MyS', email: 'iannarva0710@gmail.com', apodo: 'Ian' },
  { cuestionarioId: '8ef3e01c-5003-46f3-9144-02e13f261742', archivo: 'Jahn_Carlos_Flores_Toro_MyS', email: 'maracuchozuliano05@gmail.com', apodo: 'JC' },
  { cuestionarioId: '3a7e350b-b747-497b-b845-24f577286077', archivo: 'José_Armando_Ketterer_Yonusg_MyS', email: 'joseketterer139@gmail.com', apodo: 'Joselito' },
  { cuestionarioId: '4e75578c-b2c9-4cfe-9fe8-fee33877ac6b', archivo: 'Luz_Ennith_Álvarez_Cardona_MyS', email: 'luz.msc@hotmail.com', apodo: 'Luz Ennith' },
  { cuestionarioId: '4b357b27-f14a-4750-825f-e37b707ddd3d', archivo: 'Luz_Mery_Arroyave_Vélez_MyS', email: 'luzmarroyave@hotmail.com', apodo: 'Luz' },
  { cuestionarioId: '967d6625-cc28-43ac-b6d9-78b66f8f3acf', archivo: 'Óscar_Andrés_Martínez_Baldovino_MyS', email: 'oscarabandovino@gmail.com', apodo: 'Oscarito' },
];

async function main() {
  for (const persona of PERSONAS) {
    process.stdout.write(`${persona.apodo} (${persona.email})... `);

    // Nunca reenviar dos veces por error si el script se corre de nuevo.
    const { data: cuestionario } = await admin
      .from('flow_cuestionarios')
      .select('correo_documentos_enviado_at')
      .eq('id', persona.cuestionarioId)
      .single();
    if (cuestionario?.correo_documentos_enviado_at) {
      console.log(`ya estaba enviado (${cuestionario.correo_documentos_enviado_at}), se omite.`);
      continue;
    }

    const [pdfGuia, pdfCarta] = await Promise.all([
      fs.readFile(path.join(CARPETA, `GF_${persona.archivo}.pdf`)),
      fs.readFile(path.join(CARPETA, `Carta_${persona.archivo}.pdf`)),
    ]);

    const resultado = await enviarCorreoDocumentos({
      destinatario: persona.email,
      nombre: persona.apodo,
      empresa: EMPRESA,
      firmanteNombre: FIRMANTE,
      pdfGuia,
      pdfCarta,
    });

    if (!resultado.ok) {
      console.log(`ERROR: ${resultado.error}`);
      await admin
        .from('flow_cuestionarios')
        .update({ correo_documentos_error: resultado.error })
        .eq('id', persona.cuestionarioId);
      continue;
    }

    await admin
      .from('flow_cuestionarios')
      .update({ correo_documentos_enviado_at: new Date().toISOString(), correo_documentos_error: null })
      .eq('id', persona.cuestionarioId);
    console.log('enviado.');
  }
}

main().catch((err) => {
  console.error('Error general:', err);
  process.exit(1);
});
