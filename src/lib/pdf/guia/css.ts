/**
 * CSS de la Guía del Flow, portado casi tal cual del prototipo
 * `Codigo/Generar_Guia.py` (validado visualmente en las muestras
 * GuíaDelFlow_Tatiana.pdf / GuiaDelFlow_PaolaJimenez.pdf) — mismos
 * nombres de clase, mismos colores, mismo layout en media carta.
 */
export const CSS_GUIA = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap');

@page {
    size: 5.5in 8.5in;
    margin: 0.32in 0.35in 0.35in 0.35in;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
    font-family: 'Nunito', Georgia, sans-serif;
    font-size: 10.5pt;
    line-height: 1.55;
    color: #1a1a2e;
    background: white;
}

/* ── PORTADA ── */
.cover {
    page-break-after: always;
    min-height: 7.7in;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 0.1in 0.2in 0.15in;
    background: linear-gradient(175deg, #faf5ff 0%, #ede9fe 40%, #ddd6fe 100%);
    border-radius: 12pt;
}
.cover-top { text-align: center; }
.cover-logo { height: 34pt; margin-bottom: 12pt; }
.cover-greeting {
    font-size: 13pt;
    color: #5b21b6;
    font-weight: 600;
    letter-spacing: 0.5pt;
    margin-bottom: 2pt;
}
.cover-name {
    font-size: 32pt;
    font-weight: 800;
    color: #4c1d95;
    letter-spacing: 2pt;
    line-height: 1.1;
    margin-bottom: 4pt;
}
.cover-welcome {
    font-size: 14pt;
    color: #7c3aed;
    font-weight: 600;
    font-style: italic;
}
.cover-img-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10pt 0;
}
.cover-img-wrap img { max-height: 170pt; object-fit: contain; }
.cover-bottom { text-align: center; }
.cover-dates {
    font-size: 9pt;
    color: #6d28d9;
    font-weight: 600;
    letter-spacing: 0.5pt;
    margin-bottom: 6pt;
}
.cover-bar {
    background: linear-gradient(90deg, #7c3aed, #a855f7, #7c3aed);
    height: 3pt;
    border-radius: 2pt;
    width: 180pt;
    margin: 0 auto 6pt;
}
.cover-tagline {
    font-size: 9pt;
    color: #5b21b6;
    font-style: italic;
}

/* ── SEPARADOR DE CAPÍTULO ── */
.chapter-break {
    page-break-before: always;
    page-break-after: always;
    min-height: 7.7in;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 0.2in;
}
.chapter-bg-talento  { background: linear-gradient(160deg, #faf5ff, #ede9fe, #c4b5fd); }
.chapter-bg-emocion  { background: linear-gradient(160deg, #fff7ed, #fed7aa, #fb923c22); }
.chapter-bg-pertene  { background: linear-gradient(160deg, #f0fdf4, #bbf7d0, #4ade8022); }
.chapter-bg-desafio  { background: linear-gradient(160deg, #fef2f2, #fecaca, #f8717122); }

.chapter-break img.chapter-img { max-height: 190pt; margin-bottom: 16pt; object-fit: contain; }
.chapter-label {
    font-size: 9pt;
    font-weight: 800;
    letter-spacing: 3pt;
    text-transform: uppercase;
    margin-bottom: 6pt;
    opacity: 0.7;
}
.chapter-title {
    font-size: 28pt;
    font-weight: 800;
    line-height: 1.15;
    margin-bottom: 8pt;
}
.chapter-sub {
    font-size: 11pt;
    font-style: italic;
    opacity: 0.75;
    max-width: 3.8in;
    line-height: 1.5;
}
.chapter-deco {
    width: 60pt;
    height: 3pt;
    border-radius: 2pt;
    margin: 14pt auto 0;
}

.c-talento .chapter-label  { color: #5b21b6; }
.c-talento .chapter-title  { color: #4c1d95; }
.c-talento .chapter-sub    { color: #5b21b6; }
.c-talento .chapter-deco   { background: linear-gradient(90deg,#7c3aed,#a855f7); }

.c-emocion .chapter-label  { color: #c2410c; }
.c-emocion .chapter-title  { color: #9a3412; }
.c-emocion .chapter-sub    { color: #c2410c; }
.c-emocion .chapter-deco   { background: linear-gradient(90deg,#f97316,#fb923c); }

.c-pertene .chapter-label  { color: #166534; }
.c-pertene .chapter-title  { color: #14532d; }
.c-pertene .chapter-sub    { color: #166534; }
.c-pertene .chapter-deco   { background: linear-gradient(90deg,#22c55e,#4ade80); }

.c-desafio .chapter-label  { color: #991b1b; }
.c-desafio .chapter-title  { color: #7f1d1d; }
.c-desafio .chapter-sub    { color: #991b1b; }
.c-desafio .chapter-deco   { background: linear-gradient(90deg,#ef4444,#f87171); }

/* ── PÁGINAS DE CONTENIDO ── */
.pg { page-break-after: always; }
.pg:last-child { page-break-after: avoid; }

.pg-header {
    display: flex;
    align-items: flex-start;
    gap: 10pt;
    margin-bottom: 9pt;
    padding-bottom: 7pt;
}
.pg-header-text { flex: 1; }
.pg-header-img img {
    max-height: 72pt;
    object-fit: contain;
    border-radius: 8pt;
}
.pg-badge {
    display: inline-block;
    font-size: 7.5pt;
    font-weight: 800;
    letter-spacing: 1.5pt;
    text-transform: uppercase;
    padding: 2pt 7pt;
    border-radius: 20pt;
    margin-bottom: 4pt;
}
.badge-talento { background:#ede9fe; color:#5b21b6; }
.badge-emocion { background:#fff7ed; color:#c2410c; }
.badge-pertene { background:#f0fdf4; color:#166534; }
.badge-desafio { background:#fef2f2; color:#991b1b; }

.pg-title {
    font-size: 13.5pt;
    font-weight: 800;
    color: #1a1a2e;
    line-height: 1.2;
    margin-bottom: 1pt;
}
.pg-subtitle {
    font-size: 10pt;
    font-weight: 600;
    font-style: italic;
    color: #7c3aed;
    line-height: 1.3;
}
.pg-subtitle.s-emocion { color: #ea580c; }
.pg-subtitle.s-pertene { color: #16a34a; }
.pg-subtitle.s-desafio { color: #dc2626; }

.divider {
    height: 1.5pt;
    border-radius: 1pt;
    margin: 0 0 9pt 0;
}
.div-talento { background: linear-gradient(90deg,#7c3aed,#ddd6fe,transparent); }
.div-emocion { background: linear-gradient(90deg,#f97316,#fed7aa,transparent); }
.div-pertene { background: linear-gradient(90deg,#22c55e,#bbf7d0,transparent); }
.div-desafio { background: linear-gradient(90deg,#ef4444,#fecaca,transparent); }

.body-text {
    font-size: 10.5pt;
    line-height: 1.58;
    color: #1e1b4b;
    text-align: justify;
    margin-bottom: 8pt;
}

.recuerda-label {
    text-align: center;
    font-size: 8.5pt;
    font-weight: 800;
    letter-spacing: 0.8pt;
    margin-bottom: 5pt;
    font-style: italic;
}
.rl-talento { color: #7c3aed; }
.rl-emocion { color: #ea580c; }
.rl-pertene { color: #16a34a; }
.rl-desafio { color: #dc2626; }

.two-col {
    display: flex;
    gap: 7pt;
    margin-bottom: 6pt;
}
.col-box {
    flex: 1;
    border-radius: 7pt;
    padding: 7pt 9pt;
}
.col-box p {
    font-size: 9.5pt;
    line-height: 1.5;
    font-style: italic;
    margin: 0;
    text-align: left;
}
.cb-talento { background: #f5f0ff; border-top: 2.5pt solid #a855f7; }
.cb-emocion { background: #fff7ed; border-top: 2.5pt solid #fb923c; }
.cb-pertene { background: #f0fdf4; border-top: 2.5pt solid #4ade80; }
.cb-desafio { background: #fef2f2; border-top: 2.5pt solid #f87171; }
.col-box p { color: #3b0764; }
.cb-emocion p { color: #7c2d12; }
.cb-pertene p { color: #14532d; }
.cb-desafio p { color: #7f1d1d; }

.footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 0.75pt solid #e9d5ff;
    padding-top: 4pt;
    margin-top: 6pt;
}
.footer img { height: 14pt; }
.footer span { font-size: 7.5pt; color: #a0a0a0; font-weight: 600; }

.closing {
    page-break-before: always;
    min-height: 7.7in;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    background: linear-gradient(160deg, #faf5ff 0%, #ede9fe 50%, #ddd6fe 100%);
    border-radius: 12pt;
    padding: 0.3in 0.3in;
}
.closing img.cl-logo { height: 28pt; margin-bottom: 14pt; }
.closing img.cl-char { max-height: 130pt; margin-bottom: 14pt; object-fit: contain; }
.closing-quote {
    font-size: 12pt;
    font-weight: 700;
    color: #4c1d95;
    line-height: 1.6;
    font-style: italic;
    max-width: 4in;
    margin-bottom: 14pt;
}
.closing-bar {
    width: 120pt;
    height: 3pt;
    background: linear-gradient(90deg,#7c3aed,#a855f7);
    border-radius: 2pt;
    margin: 0 auto 10pt;
}
/* Margen defensivo: la frase_cierre que redacta Claude varía de largo;
   estos tamaños ya traen colchón para que quepa en una sola página
   incluso si sale un poco más larga de lo pedido. */
.closing-flowi img { max-height: 60pt; object-fit: contain; }
.closing-fecha {
    font-size: 8.5pt;
    color: #7c3aed;
    font-weight: 700;
    margin-top: 12pt;
    letter-spacing: 0.5pt;
}
`;
