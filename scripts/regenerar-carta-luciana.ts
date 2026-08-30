/**
 * Uso puntual (no pensado para reuso): reemplaza La Carta de Luciana Agudelo
 * por una versión reescrita a mano por Claude junto con la superusuaria,
 * incorporando lo hablado en la Primera Reunión (además de la Guía), sin
 * mencionar carreras y sin tocar ningún dato sensible de esa reunión.
 * No pasa por generarCartaCondensada (no se llama a Claude vía API) — el
 * texto ya viene aprobado, solo se renderiza a PDF con generarPdfCarta.
 *
 * Uso:
 *   npx tsx scripts/regenerar-carta-luciana.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database.types';
import { generarPdfCarta } from '../src/lib/pdf/carta/generar';
import type { CartaCondensada } from '../src/lib/pdf/carta/tipos';

process.loadEnvFile(path.join(process.cwd(), '.env.local'));

const admin = createSupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const CUESTIONARIO_ID = 'a29f21f0-1f12-4c3e-90ce-38957ae91783';
const USUARIO_ID = '2dbc7ea2-d01a-453e-8028-21f393032c86';

const carta: CartaCondensada = {
  nombre: 'Agudelo',
  fecha: '25/08/2026',
  frase_portada:
    'Tu futuro está esperando que empieces a escucharte. Y fluirás en él mientras descubres que el camino no siempre se encuentra: también se construye.',
  intro: {
    parrafo_1:
      'Estás haciendo esta Guía para saber qué quieres para tu futuro, y la forma en que llegaste a esta conversación ya dice mucho de ti: te tomaste el tiempo de contarnos tu historia completa, no solo lo que "debías" decir. Esa seriedad para buscar claridad, antes de decidir a la ligera, es exactamente lo que tu Guía llama tu inteligencia existencial — esa que no se conforma con respuestas simples.',
    parrafo_2:
      'Según tu Guía, eres pura fuerza bien dirigida: disciplina, pasión y enfoque que convierten cada reto en posibilidad. Tienes un carácter de alma libre en búsqueda constante, un propósito de enseñar que transforma vidas —incluida la tuya—, y un liderazgo que no necesita protagonismo para generar impacto real. Y eso no se queda en el papel: ya lo vives. Cuando estás en tu terreno, algo cambia — te vuelves quien guía, quien comunica claro, quien el equipo sigue. Esa misma persona sigue existiendo aunque fuera de ahí prefieras ser más reservada.',
    parrafo_3:
      'Con todo eso claro sobre ti, quiero hablarte de las tres cosas que te están dando vueltas: no saber qué quieres para tu futuro, tu rendimiento académico y la responsabilidad con lo académico. No te las voy a responder desde afuera, te las voy a responder desde lo que ya sé de ti.',
  },
  cuestionamiento_1: {
    pregunta: 'No saber que quiero de verdad para mi futuro',
    respuesta: [
      'Agudelo, quiero que sepas algo primero: no saber todavía qué quieres del todo no es un defecto tuyo, es parte de tu naturaleza. Tu carácter es el de un alma libre en búsqueda constante, un espíritu que no soporta las jaulas, ni físicas ni mentales. Tú no vives buscando UNA verdad fija, vives explorando, y eso hace que la pregunta "¿qué quiero?" se sienta más grande de lo normal, porque tú sí te la haces en serio.',
      'Pero dentro tuyo hay algo que no es indeciso para nada: tu propósito de enseñar. Ya lo hemos visto — en cómo animas a otras cuando algo no les sale, en cómo diriges sin gritar, en cómo tu equipo confía en que vas a estar ahí. Esa misma inteligencia intrapersonal profunda, esa brújula que nace por dentro, te permite observarte y decidir alineada con tu esencia, no con lo que otros esperan. No sabes el "qué" exacto todavía, pero ya tienes el "cómo".',
      'Y ojo con algo importante de tu Guía: buscas el sentido profundo de las cosas, no te conformas con respuestas simples. Por eso una decisión elegida a la ligera no te va a llenar. No se trata de tener la respuesta ya, se trata de seguir escuchando esa curiosidad tuya como brújula.',
    ],
    cierre:
      'No tener el camino 100% claro no te aleja de tu futuro, te acerca a construirlo con honestidad, que es justo lo tuyo.',
  },
  cuestionamiento_2: {
    pregunta: 'Mi rendimiento académico',
    respuesta: [
      'Hablemos claro de esto, porque en tu Guía hay algo que contradice cualquier miedo de "no ser suficiente": tienes talentos que combinan tierra y espíritu, decides con claridad y avanzas con enfoque cuando conectas con lo que te importa. Eso ya lo demuestras — nadie te tiene que empujar a entrenar o a dar el máximo cuando algo te importa de verdad. Si tu rendimiento en algunas materias no refleja esa misma fuerza, probablemente no es falta de capacidad, es que ahí todavía no encuentras ese mismo hilo.',
      'También sé, por tu Guía, que tu cuerpo es una extensión de tu mente: aprendes mejor haciendo, moviéndote, que memorizando quieta y en silencio. Si el rendimiento académico se mide solo con notas en un cuaderno, puede que no esté capturando toda tu forma real de aprender — y no es casualidad que en las materias donde puedes expresarte, como escribir, te sientas distinta. Eso no es excusa, es información valiosa sobre cómo estudiar de un modo que sí te funcione.',
      'Y hay otra pieza clave: tu compromiso nace del propósito, no de la motivación externa. Por eso cuando no ves el sentido de una materia, cuesta el doble comprometerte. La clave no es forzarte más, es encontrar el hilo entre lo que estudias y lo que de verdad te mueve, aunque sea una conexión pequeña al inicio.',
    ],
    pie_foto: 'El rendimiento crece cuando lo que haces se conecta con lo que te mueve.',
  },
  cuestionamiento_3: {
    pregunta: 'La responsabilidad con lo académico',
    respuesta: [
      'Tu Guía es clara en algo hermoso: tienes una conciencia real de que tus decisiones impactan tu vida, no buscas culpables, buscas caminos. Eso es responsabilidad genuina, no impuesta. El reto no es que te falte carácter para comprometerte —ya lo demuestras cada vez que no fallas a tu equipo— sino aprender a sostener ese mismo compromiso en las materias donde el propósito todavía no se ve tan claro.',
      'También vi en tu Guía que sabes cerrar ciclos, que tienes disciplina y foco cuando algo te importa de verdad. La responsabilidad académica, para ti, no se trata de exigirte más desde el miedo, sino de recordarte seguido el para qué — ese futuro que estás construyendo con intención, con esa misma seriedad con la que te tomaste esta conversación.',
      'Y hay algo del pasado que quiero nombrarte con cariño: tu Guía habla de recuerdos o pesos que a veces influyen más de lo que quisieras. Si la responsabilidad se siente pesada, pregúntate si estás cargando expectativas viejas que ya no son tuyas. Tu historia no termina donde dolió o donde fallaste una vez, comienza donde decides, con toda tu fuerza auténtica, seguir construyendo.',
    ],
    cierre_1:
      'Agudelo, todo lo que respondiste hoy no son problemas sueltos, son piezas de la misma búsqueda: la de encontrarte a ti misma mientras decides qué estudiar. Y tienes algo que muy pocas personas tienen tan claro: fuerza, propósito de enseñar, disciplina real y una capacidad enorme de reflexionar sobre ti misma.',
    cierre_2:
      'No necesitas tener todo resuelto hoy. Necesitas seguir escuchándote como lo estás haciendo ahora, con esa mezcla de fuego y calma que te define. Cuando te abrazas completa, avanzas liviana, auténtica y en armonía con tu propósito — y eso, más que cualquier examen o nota, es lo que de verdad te va a llevar lejos.',
  },
};

async function main() {
  console.log('Renderizando el PDF de la Carta reescrita...');
  const pdf = await generarPdfCarta(carta);

  const rutaArchivo = `${USUARIO_ID}/${CUESTIONARIO_ID}/carta.pdf`;
  const { error: errorSubida } = await admin.storage.from('guia-del-flow').upload(rutaArchivo, pdf, {
    contentType: 'application/pdf',
    upsert: true,
  });
  if (errorSubida) throw errorSubida;

  await admin
    .from('flow_documentos')
    .update({ generado_at: new Date().toISOString() })
    .eq('cuestionario_id', CUESTIONARIO_ID)
    .eq('tipo', 'carta');

  const rutaLocal = path.join(process.cwd(), 'pdfs-generados', 'LucianaAgudelo', 'CartaDelFlow_LucianaAgudelo.pdf');
  fs.writeFileSync(rutaLocal, pdf);

  console.log(`Listo. Carta actualizada en Supabase Storage (${rutaArchivo}) y guardada localmente en ${rutaLocal}.`);
}

main();
