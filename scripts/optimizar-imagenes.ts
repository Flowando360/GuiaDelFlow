import { mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Fuente: las imágenes originales sin comprimir, fuera del repo (ver
// .gitignore) — hay que tener la carpeta Imagenes_Flow/ en la raíz del
// proyecto para poder correr este script.
const ORIGEN = path.join(process.cwd(), 'Imagenes_Flow');
const DESTINO = path.join(process.cwd(), 'public', 'images', 'flow-optimizado');

// El logo necesita mantener transparencia; el resto son fotos/ilustraciones
// sobre fondo blanco, JPEG les baja muchísimo el peso sin pérdida visible.
const MANTENER_PNG = new Set(['LogoFlowAndoOficial.png']);

async function main() {
  await mkdir(DESTINO, { recursive: true });
  const archivos = await readdir(ORIGEN);

  let totalOriginal = 0;
  let totalNuevo = 0;

  for (const archivo of archivos) {
    const rutaOrigen = path.join(ORIGEN, archivo);
    const info = await stat(rutaOrigen);
    if (!info.isFile()) continue;
    totalOriginal += info.size;

    const esPng = MANTENER_PNG.has(archivo);
    const nombreSalida = esPng ? archivo : archivo.replace(/\.(png|PNG|jpg|jpeg)$/, '.jpg');
    const rutaDestino = path.join(DESTINO, nombreSalida);

    let pipeline = sharp(rutaOrigen).resize({
      width: 900,
      height: 900,
      fit: 'inside',
      withoutEnlargement: true,
    });

    if (esPng) {
      pipeline = pipeline.png({ quality: 85, compressionLevel: 9 });
    } else {
      // JPEG no soporta transparencia — sin "flatten" explícito, sharp
      // rellena las zonas transparentes de NEGRO por defecto. Todas las
      // imágenes originales tienen canal alpha (aunque sea solo por el
      // antialiasing de los bordes), así que esto es obligatorio, no
      // opcional: sin esto, cualquier imagen con fondo realmente
      // transparente (no blanco) sale con un rectángulo negro feo.
      pipeline = pipeline.flatten({ background: '#ffffff' }).jpeg({ quality: 82 });
    }

    await pipeline.toFile(rutaDestino);
    const nuevoInfo = await stat(rutaDestino);
    totalNuevo += nuevoInfo.size;
    console.log(
      `${archivo} -> ${nombreSalida}: ${(info.size / 1024).toFixed(0)}KB -> ${(nuevoInfo.size / 1024).toFixed(0)}KB`
    );
  }

  console.log(`\nTotal: ${(totalOriginal / 1024 / 1024).toFixed(1)}MB -> ${(totalNuevo / 1024 / 1024).toFixed(1)}MB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
