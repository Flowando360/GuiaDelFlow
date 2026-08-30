/**
 * Uso puntual (no pensado para reuso automático, aunque se deja como plantilla
 * reusable — ver comentario de regenerar-carta-luciana.ts): genera "IMAGINA TU
 * PROFESIÓN", un cuadernillo en tamaño media carta (5.5in x 8.5in) para que
 * Luciana Agudelo se imagine viviendo 5 profesiones posibles y escriba a mano
 * sus sensaciones después de cada una.
 *
 * Las 5 profesiones y su contenido salen de cruzar:
 *  - Su Guía del Flow completa (GuiaDelFlow_LucianaAgudelo.pdf)
 *  - Su Carta reescrita a mano (CartaDelFlow_LucianaAgudelo.pdf / carta.ts de
 *    regenerar-carta-luciana.ts)
 *  - Su Primera Reunión (PrimeraReunion_LucianaAgudelo.docx): quiere ser
 *    Profesional en Deportes por su entrenador de voleibol, lidera en la
 *    cancha aunque es tímida socialmente, se le dificultan matemáticas /
 *    biología / química / física, le fluye escribir y le va bien en español.
 *  - El análisis de orientación vocacional dado en el chat de esta sesión.
 *
 * A propósito NO se menciona la relación sentimental que aparece en la
 * transcripción de la Primera Reunión (privada, irrelevante para esto).
 *
 * No pasa por Claude API — el texto de las 5 historias ya viene escrito a
 * mano (igual filosofía que la Carta reescrita: contenido sensible/personal
 * que se redacta con cuidado humano, no generado).
 *
 * Uso:
 *   npx tsx scripts/generar-imagina-profesion-luciana.ts
 *
 * No sube nada a Supabase (no hay un tipo de documento para esto en
 * flow_documentos todavía) — solo guarda el PDF localmente para imprimir e
 * incluir en la caja física.
 */
import fs from 'node:fs';
import path from 'node:path';
import { cargarImagenes } from '../src/lib/pdf/guia/imagenes';
import { htmlsAPdfUnido } from '../src/lib/pdf/navegador';

const FECHA = '30/08/2026';
const NOMBRE = 'Agudelo';

const FUENTES = `@import url('https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=Playfair+Display:ital,wght@0,600;0,700;1,600;1,700&display=swap');`;

const ANCHO = 5.5;
const ALTO = 8.5;

/** Paleta por profesión, para que cada una se sienta como "un mundo" distinto pero reconocible. */
const PALETA = {
  violeta: { color: '#7c3aed', claro: '#e9d5ff', oscuro: '#4c1d95', fondo: '#faf5ff' },
  naranja: { color: '#ea580c', claro: '#fed7aa', oscuro: '#9a3412', fondo: '#fff7ed' },
  teal: { color: '#0d9488', claro: '#99f6e4', oscuro: '#115e59', fondo: '#f0fdfa' },
  rosa: { color: '#db2777', claro: '#fbcfe8', oscuro: '#831843', fondo: '#fdf2f8' },
  azul: { color: '#2563eb', claro: '#bfdbfe', oscuro: '#1e3a8a', fondo: '#eff6ff' },
};

function estiloBase(p: (typeof PALETA)[keyof typeof PALETA]) {
  return `
    ${FUENTES}
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: ${ANCHO}in ${ALTO}in; margin: 0; }
    body {
      width: ${ANCHO}in; height: ${ALTO}in;
      font-family: 'Nunito', Georgia, sans-serif;
      color: #2e1065; background: white; position: relative; overflow: hidden;
    }
    .contenido { padding: 0.38in 0.42in 0.5in; }
    .header {
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1pt solid ${p.claro}; padding-bottom: 6pt; margin-bottom: 12pt;
    }
    .header img { height: 15pt; }
    .header-etq { font-size: 7pt; font-weight: 800; letter-spacing: 1pt; text-transform: uppercase; color: ${p.color}; }
    .titulo {
      font-family: 'Playfair Display', Georgia, serif; font-weight: 700;
      font-size: 16.5pt; color: ${p.oscuro}; line-height: 1.2; margin-bottom: 3pt;
    }
    .subtitulo { font-style: italic; color: ${p.color}; font-size: 9pt; margin-bottom: 9pt; }
    .linea { width: 42pt; height: 2pt; background: linear-gradient(90deg, ${p.color}, ${p.oscuro}); border-radius: 2pt; margin-bottom: 9pt; }
    .img-wrap { text-align: center; margin: 6pt 0 10pt; }
    .img-wrap img { max-height: 1.35in; max-width: 3.5in; object-fit: contain; }
    p.texto { font-size: 8.9pt; line-height: 1.48; text-align: justify; color: #3b0764; margin-bottom: 7pt; }
    .footer {
      position: absolute; bottom: 0.16in; left: 0.42in; right: 0.42in;
      display: flex; justify-content: space-between;
      font-size: 6.3pt; color: ${p.claro}; font-weight: 700; letter-spacing: 0.4pt; text-transform: uppercase;
    }
    .renglon { border-bottom: 0.75pt solid ${p.claro}; height: 18pt; margin-bottom: 5pt; }
    .pregunta { font-size: 8.6pt; font-weight: 700; color: ${p.oscuro}; margin: 10pt 0 4pt; }
    .escala { display: flex; justify-content: space-between; margin-top: 14pt; }
    .escala-item { display: flex; flex-direction: column; align-items: center; width: 19%; }
    .escala-circulo { width: 15pt; height: 15pt; border-radius: 50%; border: 1.3pt solid ${p.color}; margin-bottom: 4pt; }
    .escala-label { font-size: 6.3pt; text-align: center; color: ${p.oscuro}; font-weight: 700; }
  `;
}

function pagina(html: string, estilo: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${estilo}</style></head><body>${html}</body></html>`;
}

function header(logo: string, etiqueta: string): string {
  return `<div class="header"><img src="${logo}" /><span class="header-etq">${etiqueta}</span></div>`;
}

function footer(pieDerecha: string): string {
  return `<div class="footer"><span>Imagina tu Profesión</span><span>${pieDerecha}</span></div>`;
}

interface Profesion {
  clave: string;
  paleta: (typeof PALETA)[keyof typeof PALETA];
  numero: string;
  titulo: string;
  subtitulo: string;
  imagenClave: string;
  parrafos: string[];
  cierrePuente: string;
}

const PREGUNTAS_REFLEXION = [
  '¿Cómo se sintió tu cuerpo imaginando este día? (¿se emocionó, se cansó solo de leerlo, se puso ansioso?)',
  '¿Qué parte de esta historia te dio más ganas de vivirla de verdad?',
  '¿Qué parte te dio miedo, pereza o dudas?',
  'Si mañana amanecieras viviendo esto de verdad, ¿cómo te sentirías al abrir los ojos?',
];

async function main() {
  const img = await cargarImagenes();

  const profesiones: Profesion[] = [
    {
      clave: 'entrenadora',
      paleta: PALETA.naranja,
      numero: '1 DE 5',
      titulo: 'Entrenadora de Alto Rendimiento',
      subtitulo: 'Donde ya te sientes fuerte: la cancha',
      imagenClave: 'escenafutbol',
      parrafos: [
        'Cierra los ojos. Son las 6:00 a.m. y ya estás en la cancha, silbato en mano, viendo entrenar a un equipo que confía en ti tanto como tú confiaste en tu entrenador de voleibol. Lideras: decides quién juega, cómo se entrena, qué se corrige después de cada error. Ese liderazgo que ya sientes en la cancha —el que te hace hablar claro y dirigir sin miedo, aunque seas tímida fuera de ella— es tu día entero, no solo un rato después de clases.',
        'Físicamente, tu cuerpo es tu herramienta de trabajo: vas a estar de pie, moviéndote, sosteniendo el ritmo de cada sesión, muchas veces bajo sol o bajo lluvia, con el cuerpo cansado incluso cuando la mente todavía quiere seguir. Mentalmente, vas a tomar decisiones rápidas bajo presión —quién sale, quién entra, qué se dice en el minuto exacto en que un equipo se está desmoronando— y a sostener la calma de otros incluso cuando por dentro tú también dudas.',
        'Un reto real: en el alto rendimiento, muchas veces vas a ser la única mujer dirigiendo en una sala llena de entrenadores hombres, o vas a tener que ganarte un respeto que a un colega hombre a veces se le da por defecto. Puede pasar que cuestionen una decisión tuya que a otro no le cuestionarían. Vas a tener que sostener tu voz ahí, aunque tiemble.',
        'Y hay sacrificios: mientras tus amigas tienen el sábado libre, tú vas a estar en un torneo; mientras otros duermen hasta tarde, tú vas a estar calentando para el entrenamiento de las 6. A cambio, tendrás algo que pocos trabajos dan: ver crecer a alguien bajo tu guía, igual que tú creciste bajo la de tu entrenador.',
      ],
      cierrePuente: 'Cierra los ojos 10 segundos. Estás ahí, con el silbato en la mano. ¿Qué sientes?',
    },
    {
      clave: 'fisioterapia',
      paleta: PALETA.teal,
      numero: '2 DE 5',
      titulo: 'Licenciada en Ciencias del Deporte y Rehabilitación',
      subtitulo: 'Cerca de la cancha, desde otro lugar',
      imagenClave: 'ilumina',
      parrafos: [
        'Imagina otra versión de ti, todavía cerca del deporte, pero desde otro lugar: eres quien ayuda a que un deportista lesionado vuelva a jugar. No diriges el equipo desde la banca, lo acompañas desde la camilla o la sala de rehabilitación. Ese "canal de sanación" que tu Guía te reconoce —esa mezcla entre cuerpo y espíritu— tiene aquí un lugar natural: te vuelves puente entre el dolor de alguien y su regreso a moverse.',
        'Físicamente, vas a estar de pie horas, con las manos trabajando en el cuerpo de otra persona, con precisión y paciencia, no con la adrenalina del partido sino con la calma de quien repara. Mentalmente, la exigencia es distinta a la de entrenar: vas a tener que entender cómo funciona un cuerpo por dentro —músculos, huesos, movimiento— y eso, seamos honestas, suele pasar por materias como biología o anatomía, las mismas que hoy se te atraviesan.',
        'Eso no es una razón para descartarlo: es información real para investigar bien el plan de estudios antes de decidir, y para saber que tocaría fortalecer esa base con tiempo y apoyo, no de un día para otro.',
        'El sacrificio aquí es distinto al de la cancha: mientras el equipo celebra un triunfo bajo las luces, tú puede que estés celebrando algo más silencioso —que alguien vuelva a caminar sin dolor—. Menos aplausos públicos, pero un impacto que se siente igual de profundo.',
      ],
      cierrePuente: 'Cierra los ojos 10 segundos. Tus manos están ayudando a que alguien vuelva a moverse. ¿Qué sientes?',
    },
    {
      clave: 'educacion',
      paleta: PALETA.violeta,
      numero: '3 DE 5',
      titulo: 'Licenciada en Educación Física / Formadora Deportiva',
      subtitulo: 'Tu cancha se vuelve un salón, o un patio',
      imagenClave: 'p6',
      parrafos: [
        'Ahora imagina que tu cancha es un salón de clases, o mejor, un patio: eres profesora de educación física, o formadora de un semillero deportivo para niñas y niños que recién empiezan. Aquí tu liderazgo no se trata de ganar un campeonato, se trata de enseñar —esa misma capacidad que tu Guía nombra como tu forma de inspirar: conectar con otros con autenticidad, no solo con autoridad. Vas a estar formando el amor por el movimiento en generaciones que apenas empiezan, muchas veces sin que nadie te lo agradezca en el momento.',
        'Físicamente, seguirás activa —demostrando ejercicios, corriendo con tus estudiantes, de pie casi toda la jornada— aunque con menos exigencia de alto rendimiento que en la competencia. Mentalmente, el reto es distinto: manejar un grupo grande, sostener la disciplina sin perder la calidez, y encontrar paciencia incluso los días en que no tienes ganas.',
        'Vas a tener que sacrificar algo de la intensidad y el brillo de la competencia de alto nivel —no vas a estar en un estadio lleno mientras otras entrenadoras sí— pero vas a tener algo que dura más: que alguna de esas niñas, dentro de unos años, se acuerde de ti como tú te acuerdas hoy de tu entrenador.',
      ],
      cierrePuente: 'Cierra los ojos 10 segundos. Un grupo entero de niñas te está mirando, esperando la instrucción de hoy. ¿Qué sientes?',
    },
    {
      clave: 'psicologia',
      paleta: PALETA.rosa,
      numero: '4 DE 5',
      titulo: 'Psicóloga Deportiva',
      subtitulo: 'Al lado de la cancha, escuchando',
      imagenClave: 'escena2',
      parrafos: [
        'Imagina que en lugar de estar en la cancha dirigiendo el juego, estás al lado de ella, escuchando a un deportista antes de salir a jugar, ayudándole a manejar los nervios, la presión o el miedo a fallar. Tu Guía dice que eres un puente entre corazones, que entiendes lo que otros sienten incluso sin que lo digan —eso, en este camino, se vuelve tu herramienta de trabajo diaria—. Y hay algo tuyo que encaja perfecto acá: tú misma vives esa mezcla de timidez fuera de la cancha y seguridad total dentro de ella. Nadie mejor que tú para entender a un deportista que necesita encontrar esa misma seguridad en otras áreas de su vida.',
        'Físicamente, esta es la más tranquila de las cinco profesiones: pasarás más tiempo sentada, conversando, escuchando, que corriendo. Mentalmente, es de las más exigentes: vas a cargar, con cuidado, las frustraciones y los miedos de otros sin que se te vuelvan tuyos, sesión tras sesión.',
        'El sacrificio aquí es silencioso: mientras el entrenador recibe el aplauso público cuando el equipo gana, tu trabajo casi nunca se ve en las cámaras —se ve en que un deportista que estaba a punto de rendirse, no se rindió—. Eso, aunque nadie lo aplauda, también es liderar.',
      ],
      cierrePuente: 'Cierra los ojos 10 segundos. Alguien te está contando su miedo antes de salir a jugar. ¿Qué sientes?',
    },
    {
      clave: 'comunicacion',
      paleta: PALETA.azul,
      numero: '5 DE 5',
      titulo: 'Comunicadora Social y/o Periodista Deportiva',
      subtitulo: 'Contarle al mundo lo que pasa en la cancha',
      imagenClave: 'escribe',
      parrafos: [
        'Última parada de este viaje imaginario: en vez de estar en la cancha o al lado de ella, estás contándole al mundo lo que pasa ahí. Eres periodista o creadora de contenido deportivo —narras un partido, escribes la crónica del torneo, entrevistas al equipo ganador o al que perdió pero dio todo—. Esto conecta con algo muy tuyo que ya nos mostraste en nuestra primera conversación: escribes bien, te gusta hacerlo, y en español es donde más te fluye. Aquí ese talento no es un "además", es el centro del trabajo.',
        'Físicamente, es la más liviana de las cinco: no vas a entrenar tu cuerpo para esto, vas a entrenar tu forma de contar historias. Mentalmente, la exigencia es escribir bajo presión de tiempo, encontrar las palabras exactas minuto a minuto, y a veces trabajar mientras el resto del mundo celebra o duerme.',
        'Un reto real: el periodismo y la narración deportiva siguen siendo, hoy, un terreno con muchos más hombres que mujeres al micrófono o firmando la nota. Puede pasar que duden de que sepas tanto de deporte como un colega hombre, o que te pregunten cosas que a él no le preguntarían. Vas a tener que demostrar, con hechos, lo que a otros se les da por sentado.',
        'El sacrificio: menos cancha, menos adrenalina física directa. A cambio, tu voz llega a mucha más gente que la de cualquier entrenador.',
      ],
      cierrePuente: 'Cierra los ojos 10 segundos. Acabas de escribir la última línea de tu crónica del partido. ¿Qué sientes?',
    },
  ];

  const paginas: string[] = [];

  // ── Portada ──
  paginas.push(
    pagina(
      `
      <div style="width:${ANCHO}in;height:${ALTO}in;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:0.5in 0.4in;background:linear-gradient(160deg,#faf5ff 0%,#ede9fe 50%,#f5d0fe 100%);text-align:center;">
        <div style="width:100%;display:flex;justify-content:flex-start;"><img src="${img.logo}" style="height:22pt;" /></div>
        <div>
          <div style="font-size:8pt;font-weight:700;letter-spacing:2pt;text-transform:uppercase;color:#7c3aed;margin-top:0.2in;">Para Agudelo, antes de decidir</div>
          <div style="font-family:'Playfair Display',Georgia,serif;font-size:30pt;font-weight:700;color:#4c1d95;line-height:1.15;margin-top:8pt;">IMAGINA TU<br/>PROFESIÓN</div>
          <div style="width:60pt;height:2pt;background:linear-gradient(90deg,#7c3aed,#a855f7);border-radius:2pt;margin:12pt auto;"></div>
          <div style="font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:11pt;color:#4c1d95;max-width:3.6in;line-height:1.5;">Un cuadernillo para vivir cinco vidas posibles con los ojos cerrados, antes de elegir una con los ojos abiertos.</div>
        </div>
        <div style="flex:1;display:flex;align-items:center;justify-content:center;min-height:0;"><img src="${img.flowi}" style="max-height:1.9in;max-width:2.6in;object-fit:contain;" /></div>
        <div style="font-size:7.5pt;color:#7c3aed;font-weight:700;letter-spacing:0.5pt;">Basado en tu Guía del Flow, tu Carta y nuestra primera conversación · ${FECHA}</div>
      </div>
      `,
      `${FUENTES} * { box-sizing:border-box; margin:0; padding:0; } @page { size:${ANCHO}in ${ALTO}in; margin:0; } body { font-family:'Nunito',Georgia,sans-serif; }`
    )
  );

  // ── Instrucciones ──
  paginas.push(
    pagina(
      `
      <div class="contenido">
        ${header(img.logo, 'CÓMO USAR ESTE CUADERNILLO')}
        <div class="titulo">Antes de empezar</div>
        <div class="linea"></div>
        <div class="img-wrap"><img src="${img.medita}" /></div>
        <p class="texto">${NOMBRE}, esto no es un examen ni una guía más para leer rápido. Es un viaje. En las próximas páginas te voy a invitar a imaginarte, de verdad, viviendo cinco profesiones distintas — todas construidas cruzando tu Guía del Flow completa, la Carta que te escribí, y lo que ya nos contaste en nuestra primera conversación. No las inventé al azar: cada una nace de algo real en ti.</p>
        <p class="pregunta">Cómo hacerlo:</p>
        <p class="texto">1. Lee la historia completa de cada profesión, despacio.<br/>
        2. Cuando termines, cierra los ojos 10 segundos y quédate ahí, en esa vida, sin apurarte a juzgarla.<br/>
        3. Abre los ojos y escribe en la página siguiente lo primero que sentiste — no lo que "deberías" sentir. Marca también la carita/círculo que más se parezca a lo que viviste.<br/>
        4. Sigue con la siguiente historia, hasta terminar las cinco.<br/>
        5. Al final, vas a comparar lo que sentiste en cada una — eso es lo que le vas a llevar a tu próxima conversación con Lab De Talento Innovador, no una respuesta cerrada, sino información real sobre ti.</p>
        <p class="texto" style="font-style:italic;color:#7c3aed;">Ninguna de estas historias es exactamente como será tu vida real — es un ensayo con los ojos cerrados, no una predicción. Sirve para sentir, no para decidir sola hoy.</p>
      </div>
      ${footer(FECHA)}
      `,
      estiloBase(PALETA.violeta)
    )
  );

  // ── Profesiones: narrativa + reflexión ──
  for (const p of profesiones) {
    paginas.push(
      pagina(
        `
        <div class="contenido">
          ${header(img.logo, p.numero)}
          <div class="titulo">Imagina que eres...<br/>${p.titulo}</div>
          <div class="subtitulo">${p.subtitulo}</div>
          <div class="linea"></div>
          <div class="img-wrap"><img src="${(img as Record<string, string>)[p.imagenClave]}" /></div>
          ${p.parrafos.map((t) => `<p class="texto">${t}</p>`).join('\n')}
        </div>
        ${footer(FECHA)}
        `,
        estiloBase(p.paleta)
      )
    );

    paginas.push(
      pagina(
        `
        <div class="contenido">
          ${header(img.logo, `${p.numero} · TUS SENSACIONES`)}
          <div class="titulo">${p.titulo}</div>
          <div class="subtitulo" style="font-style:normal;">${p.cierrePuente}</div>
          <div class="linea"></div>
          ${PREGUNTAS_REFLEXION.map(
            (q) => `<div class="pregunta">${q}</div><div class="renglon"></div><div class="renglon"></div>`
          ).join('\n')}
          <div class="escala">
            ${['Nada', 'Poco', 'Algo', 'Mucho', '¡Totalmente!']
              .map((label) => `<div class="escala-item"><div class="escala-circulo"></div><div class="escala-label">${label}</div></div>`)
              .join('\n')}
          </div>
          <p class="texto" style="margin-top:6pt;font-size:7.8pt;text-align:center;">¿Qué tan feliz te imaginaste viviendo esto? Marca un círculo.</p>
        </div>
        ${footer(FECHA)}
        `,
        estiloBase(p.paleta)
      )
    );
  }

  // ── Cierre ──
  paginas.push(
    pagina(
      `
      <div class="contenido">
        ${header(img.logo, 'ANTES DE CERRAR EL CUADERNO')}
        <div class="titulo">Vuelve a mirar lo que sentiste</div>
        <div class="linea"></div>
        <div class="img-wrap"><img src="${img.puente}" /></div>
        <p class="texto">${NOMBRE}, vuelve un momento a las cinco páginas que acabas de marcar. Fíjate en dónde el círculo quedó en "Mucho" o "¡Totalmente!", y en dónde quedó en "Nada" o "Poco". Fíjate también en qué escribiste con la mano más rápida, casi sin pensar, y en dónde te costó encontrar las palabras.</p>
        <p class="texto">Esto no es un test que se califica con una respuesta correcta. Es información tuya, sobre ti, que antes no tenías en un papel. Guarda estas páginas y llévalas a tu próxima conversación con Lab De Talento Innovador — juntos van a mirar qué de todo esto se conecta con lo que ya sueñas (ser Profesional en Deportes) y qué te abrió una puerta que quizás no habías visto.</p>
        <p class="texto">No tienes que salir de este cuaderno con la respuesta final. Tienes que salir con más de ti misma que la que tenías al empezar — y eso, como ya te dije en tu Carta, es lo que de verdad te va a llevar lejos.</p>
        <p class="texto" style="text-align:center;font-family:'Playfair Display',Georgia,serif;font-style:italic;color:#7c3aed;font-size:11pt;margin-top:14pt;">Con cariño, Flowi · ${FECHA}</p>
      </div>
      `,
      estiloBase(PALETA.violeta)
    )
  );

  console.log(`Renderizando ${paginas.length} páginas...`);
  const pdf = await htmlsAPdfUnido(paginas, { anchoPulgadas: ANCHO, altoPulgadas: ALTO });

  const rutaLocal = path.join(process.cwd(), 'pdfs-generados', 'LucianaAgudelo', 'ImaginaTuProfesion_LucianaAgudelo.pdf');
  fs.writeFileSync(rutaLocal, pdf);
  console.log(`Listo. Guardado en ${rutaLocal}`);
}

main();
