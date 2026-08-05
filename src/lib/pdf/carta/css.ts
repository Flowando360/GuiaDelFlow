/**
 * CSS de la Carta, portado de la especificación en
 * Codigo/Generar_Carta.txt (paleta, tipografías y tamaños exactos).
 *
 * Diferencia a propósito respecto al original: el spec pedía footers vía
 * @page { @bottom-left / @bottom-right } (soporte de WeasyPrint). Chromium
 * (que es lo que usa Puppeteer acá) no soporta bien el contenido de los
 * márgenes de @page, así que el footer se pone como un <div> con
 * position:absolute dentro de cada página — mismo resultado visual, sin
 * depender de una feature que Chromium renderiza mal.
 */
export const CSS_CARTA = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=Playfair+Display:ital,wght@0,600;0,700;1,600;1,700&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }
body {
    font-family: 'Nunito', Georgia, sans-serif;
    font-size: 12pt;
    line-height: 1.75;
    color: #2e1065;
    background: white;
}

/* ── PORTADA (página 1) ── */
@page portada { size: 8.5in 11in; margin: 0; }
.portada {
    width: 8.5in;
    height: 11in;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 0.6in 0.7in;
    background: linear-gradient(160deg, #faf5ff 0%, #ede9fe 50%, #f5d0fe 100%);
    text-align: center;
}
.portada-top { width: 100%; display: flex; justify-content: flex-start; }
.portada-top img { height: 30pt; }
.portada-tag {
    margin-top: 0.5in;
    font-size: 10pt;
    font-weight: 700;
    letter-spacing: 2pt;
    text-transform: uppercase;
    color: #7c3aed;
}
.portada-nombre {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 62pt;
    font-weight: 700;
    color: #4c1d95;
    line-height: 1.1;
    margin-top: 10pt;
}
.portada-estrella { font-size: 22pt; color: #a855f7; margin-top: 12pt; }
.portada-linea {
    width: 90pt;
    height: 2.5pt;
    background: linear-gradient(90deg, #7c3aed, #a855f7);
    border-radius: 2pt;
    margin: 14pt auto;
}
.portada-frase {
    font-family: 'Playfair Display', Georgia, serif;
    font-style: italic;
    font-size: 16pt;
    color: #4c1d95;
    max-width: 5in;
    line-height: 1.5;
}
.portada-img-wrap { flex: 1; display: flex; align-items: center; justify-content: center; min-height: 0; }
.portada-img-wrap img { max-height: 2.6in; max-width: 4in; object-fit: contain; }
.portada-fecha { font-size: 9pt; color: #7c3aed; font-weight: 700; letter-spacing: 0.5pt; }

/* ── PÁGINAS INTERNAS (2-5) ── */
@page interna { size: 8.5in 11in; margin: 0.55in 0.65in; }
.pagina-interna {
    width: 7.2in;
    min-height: 9.9in;
    position: relative;
    padding-bottom: 0.4in;
}
.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1pt solid #e9d5ff;
    padding-bottom: 8pt;
    margin-bottom: 18pt;
}
.header img { height: 20pt; }
.header-titulo { font-size: 9pt; font-weight: 700; letter-spacing: 1pt; color: #a855f7; text-transform: uppercase; }
.header-numero { font-size: 9pt; font-weight: 700; color: #a855f7; }

.saludo {
    font-family: 'Playfair Display', Georgia, serif;
    font-style: italic;
    font-size: 14pt;
    color: #7c3aed;
    margin-bottom: 4pt;
}
.titulo-grande {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 26pt;
    font-weight: 700;
    color: #4c1d95;
    line-height: 1.2;
    margin-bottom: 10pt;
}
.linea-decorativa {
    width: 60pt;
    height: 2.5pt;
    background: linear-gradient(90deg, #7c3aed, #a855f7);
    border-radius: 2pt;
    margin-bottom: 16pt;
}
.parrafo { font-size: 12pt; line-height: 1.75; color: #2e1065; margin-bottom: 14pt; text-align: justify; }

.bloque-cuestionamiento {
    background: #faf5ff;
    border-left: 4pt solid #7c3aed;
    border-radius: 4pt;
    padding: 16pt 18pt;
    margin-bottom: 16pt;
}
.bloque-etiqueta {
    font-size: 8pt;
    font-weight: 800;
    letter-spacing: 1.5pt;
    text-transform: uppercase;
    color: #a855f7;
    margin-bottom: 8pt;
}
.bloque-pregunta {
    font-family: 'Playfair Display', Georgia, serif;
    font-style: italic;
    font-size: 14pt;
    color: #4c1d95;
    margin-bottom: 12pt;
    line-height: 1.4;
}
.bloque-respuesta p {
    font-size: 11.5pt;
    line-height: 1.74;
    color: #3b0764;
    text-align: justify;
    margin-bottom: 8pt;
}
.bloque-respuesta p:last-child { margin-bottom: 0; }

.pie-foto-wrap { text-align: center; margin-top: 14pt; }
.pie-foto-wrap img { max-width: 82%; max-height: 1.7in; border-radius: 8pt; object-fit: cover; }
.pie-foto {
    font-family: 'Playfair Display', Georgia, serif;
    font-style: italic;
    font-size: 10pt;
    color: #a78bfa;
    margin-top: 8pt;
}

.firma-wrap { text-align: center; margin-top: 12pt; }
.firma-label { font-size: 9pt; font-weight: 800; letter-spacing: 1.5pt; color: #a855f7; margin-bottom: 4pt; }
.firma-nombre {
    font-family: 'Playfair Display', Georgia, serif;
    font-style: italic;
    font-size: 22pt;
    color: #7c3aed;
    margin-bottom: 4pt;
}
.firma-pie { font-size: 8.5pt; color: #a78bfa; letter-spacing: 0.3pt; }

.footer-pagina {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    font-size: 7.5pt;
    color: #d8b4fe;
    font-weight: 700;
    letter-spacing: 0.5pt;
    text-transform: uppercase;
}
`;
