/**
 * Rutas públicas de las imágenes de marca para la UI web (distinto del
 * loader en src/lib/pdf/guia/imagenes.ts, que las carga como base64 para
 * incrustarlas en el PDF). Acá alcanza con la ruta pública normal, ya que
 * Next.js sirve todo lo que está en public/ tal cual.
 *
 * Se usan solo los nombres de archivo SIN espacios para no lidiar con
 * URL-encoding en el src de las imágenes.
 */
const BASE = '/images/flow-optimizado';

export const IMG = {
  logo: `${BASE}/LogoFlowAndoOficial.png`,
  eureka: `${BASE}/Flowa_Eureka.jpg`,
  medita: `${BASE}/Flowi_Medita.jpg`,
  escribe: `${BASE}/FlowiEscribiendo.jpg`,
  ilumina: `${BASE}/FlowiIluminaFlowe.jpg`,
  triste: `${BASE}/Flowi_TristeBueno.jpg`,
  puente: `${BASE}/FlowA_Puente.jpg`,
  compu: `${BASE}/Flowi_Compu.jpg`,
  p2: `${BASE}/Personajes2.jpg`,
  p3: `${BASE}/Personajes3.jpg`,
  p5: `${BASE}/Personajes5.jpg`,
  p6: `${BASE}/Personajes6.jpg`,
  pmundo: `${BASE}/PersonajesMundo.jpg`,
  edificio: `${BASE}/EdificioFlow.jpg`,
} as const;

export type ClaveImagenWeb = keyof typeof IMG;
