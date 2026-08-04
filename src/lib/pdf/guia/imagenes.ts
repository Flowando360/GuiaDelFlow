import { readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Imágenes de marca disponibles en public/images/flow/, con una clave
 * semántica por "mood" (igual idea que el diccionario IMAGES del
 * prototipo Python) para poder asignarlas por sección. Ojo: el set de
 * imágenes actual en el repo es más chico que el que usaba el prototipo
 * original (varias — flowi_1, FlowiEnseña, Flowi_Furioso_Encajando,
 * FlowaProfesor, FloweEngrana, SubiendoMontaña, Tesoro, Personajes4,
 * San_Valentin — ya no existen), así que esta lista usa solo lo que
 * REALMENTE está en el repo y reutiliza imágenes donde hace falta.
 */
const ARCHIVOS: Record<string, string> = {
  logo: 'LogoFlowAndoOficial.png',
  flowi: 'flowi principal.jpg',
  flowa: 'flowa - principalpng.jpg',
  flowe: 'flowe - Editada.jpg',
  eureka: 'Flowa_Eureka.jpg',
  medita: 'Flowi_Medita.jpg',
  escribe: 'FlowiEscribiendo.jpg',
  ilumina: 'FlowiIluminaFlowe.jpg',
  triste: 'Flowi_TristeBueno.jpg',
  puente: 'FlowA_Puente.jpg',
  compu: 'Flowi_Compu.jpg',
  p2: 'Personajes2.jpg',
  p3: 'Personajes3.jpg',
  p5: 'Personajes5.jpg',
  p6: 'Personajes6.jpg',
  pmundo: 'PersonajesMundo.jpg',
  edificio: 'EdificioFlow.jpg',
  escena1: 'escena 1A- Editada.jpg',
  escena2: 'escena 2 pp.jpg',
  escena3: 'escena 3.jpg',
  escena4: 'escena 4.jpg',
  escena5: 'escena 5.jpg',
  escenafutbol: 'escena FUTBOL.jpg',
  carticas: 'FlowiCarticas.jpg',
};

export type ClaveImagen = keyof typeof ARCHIVOS;

const CARPETA = path.join(process.cwd(), 'public', 'images', 'flow-optimizado');
const cache = new Map<string, string>();

function mime(archivo: string): string {
  const ext = path.extname(archivo).toLowerCase();
  return ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
}

async function cargarBase64(archivo: string): Promise<string> {
  if (cache.has(archivo)) return cache.get(archivo)!;
  const buffer = await readFile(path.join(CARPETA, archivo));
  const data = `data:${mime(archivo)};base64,${buffer.toString('base64')}`;
  cache.set(archivo, data);
  return data;
}

/** Carga TODAS las imágenes de marca como data URIs base64 (una sola vez, con caché en memoria). */
export async function cargarImagenes(): Promise<Record<ClaveImagen, string>> {
  const entradas = await Promise.all(
    Object.entries(ARCHIVOS).map(async ([clave, archivo]) => [clave, await cargarBase64(archivo)] as const)
  );
  return Object.fromEntries(entradas) as Record<ClaveImagen, string>;
}
