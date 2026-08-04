#!/usr/bin/env python3
"""
FlowAndo — Generador de Guía del Flow
Uso: python3 generar_guia.py <ruta_al_pdf>
Genera un PDF rediseñado, condensado y listo para imprimir en media carta.
"""

import sys, os, json, base64, subprocess, textwrap
from weasyprint import HTML

# ── CONFIGURACIÓN ────────────────────────────────────────────────
IMG_DIR = "/mnt/project"
OUTPUT_DIR = "/mnt/user-data/outputs"

# Imágenes disponibles con su "mood" para asignación inteligente
IMAGES = {
    "logo":      f"{IMG_DIR}/LogoFlowAndoOficial.jpg",
    "flowi":     f"{IMG_DIR}/flowi_1.jpg",           # energía, propósito
    "flowa":     f"{IMG_DIR}/flowa__principalpng.jpg",# planificación, organización
    "flowe":     f"{IMG_DIR}/flowe__Editada.jpg",     # camino, exploración
    "eureka":    f"{IMG_DIR}/Flowa_Eureka.jpg",       # descubrimiento, talento
    "medita":    f"{IMG_DIR}/Flowi_Medita.jpg",       # calma, equilibrio
    "enseña":    f"{IMG_DIR}/FlowiEnseña.jpg",        # liderazgo, inspirar
    "escribe":   f"{IMG_DIR}/FlowiEscribiendo.jpg",   # comunicación, expresión
    "ilumina":   f"{IMG_DIR}/FlowiIluminaFlowe.jpg",  # apoyo, emociones
    "triste":    f"{IMG_DIR}/Flowi_TristeBueno.jpg",  # desafíos, vulnerabilidad
    "furioso":   f"{IMG_DIR}/Flowi_Furioso_Encajando.jpg", # retos, frustración
    "puente":    f"{IMG_DIR}/FlowA_Puente.jpg",       # conexión, pertenencia
    "profe":     f"{IMG_DIR}/FlowaProfesor.jpg",      # conocimiento, inteligencias
    "engrana":   f"{IMG_DIR}/FloweEngrana.jpg",       # trabajo en equipo
    "sube":      f"{IMG_DIR}/SubiendoMontaña.jpg",    # crecimiento, desafíos
    "tesoro":    f"{IMG_DIR}/Tesoro.jpg",             # propósito, infancia
    "p4":        f"{IMG_DIR}/Personajes4.jpg",        # grupo planificando
    "p5":        f"{IMG_DIR}/Personajes5.jpg",        # grupo trabajando
    "p6":        f"{IMG_DIR}/Personajes6.jpg",        # celebración
    "escena3":   f"{IMG_DIR}/escena_3.jpg",           # conversación cálida
    "escena5":   f"{IMG_DIR}/escena_5.jpg",           # abrazo, comunidad
    "valentin":  f"{IMG_DIR}/San_Valentin.jpg",       # amor, relaciones
}

def load_b64(path):
    with open(path, "rb") as f:
        return "data:image/jpg;base64," + base64.b64encode(f.read()).decode()

def extract_text(pdf_path):
    """Extrae texto del PDF con pdftotext."""
    result = subprocess.run(
        ["pdftotext", "-layout", pdf_path, "-"],
        capture_output=True, text=True
    )
    return result.stdout

def call_claude(text):
    """Llama a la API de Claude para condensar y estructurar la guía."""
    import urllib.request

    prompt = f"""Eres el asistente de FlowAndo. Te doy el texto completo de una Guía del Flow personalizada.
Tu tarea es condensarla en JSON estructurado para generar un PDF bonito de 16-18 páginas en media carta.

REGLAS CRÍTICAS:
- Conserva el nombre de la persona y la fecha exacta del PDF
- Mantén la esencia emocional de cada mensaje: que llegue al corazón
- Elimina repeticiones y frases genéricas de relleno
- Cada texto condensado debe ser fluido, humano, directo
- Usa máximo 3-4 oraciones por bloque de texto
- Los bloques "recuerda" (dos columnas) máximo 2 oraciones cada uno
- Responde SOLO con el JSON, sin explicaciones ni markdown

ESTRUCTURA JSON REQUERIDA:
{{
  "nombre": "string (solo el nombre, ej: ADRI)",
  "fecha": "string (ej: 30/05/2026)",
  "origen": "string (fecha de nacimiento, ej: 06/06/1972)",
  "talento_unico": {{
    "titulo_sello": "string (ej: Eres el visionario que nunca se detiene)",
    "texto": "string (3-4 oraciones condensadas)"
  }},
  "talentos": [
    {{
      "seccion": "string (ej: Carácter)",
      "subtitulo": "string (ej: Mente ágil, curiosidad y cambio constante)",
      "texto": "string (3-4 oraciones)",
      "recuerda_izq": "string (2 oraciones)",
      "recuerda_der": "string (2 oraciones)"
    }},
    ... (incluir: Temperamento, Talentos innatos, Talentos para potenciar, Propósito-Intuición, Propósito-Equilibrio, Liderazgo-Inspirar, Liderazgo-Transformacional, Comunicación, Inteligencia musical, Inteligencia naturaleza, Inteligencia expresiva, Ecos infancia)
  ],
  "emociones": [
    {{
      "seccion": "string (ej: El pasado)",
      "subtitulo": "string",
      "texto": "string (3-4 oraciones)",
      "recuerda_izq": "string",
      "recuerda_der": "string"
    }},
    ... (incluir: Tolerancia frustración, Estabilidad emocional, Felicidad)
  ],
  "pertenencia": [
    {{
      "seccion": "string",
      "subtitulo": "string",
      "texto": "string (3-4 oraciones)",
      "recuerda_izq": "string",
      "recuerda_der": "string"
    }},
    ... (incluir: Dependencia, Pertenencia, Trabajo en equipo, Responsabilidad)
  ],
  "desafios": [
    {{
      "seccion": "string",
      "subtitulo": "string",
      "texto": "string (3-4 oraciones)",
      "recuerda_izq": "string",
      "recuerda_der": "string"
    }},
    ... (incluir: Etapa del Flow, Retos internos, Desafíos sanación, Balance, Tu mente faro, Compromiso, Adaptación al cambio, Negociación, Recursividad)
  ],
  "frase_cierre": "string (la frase motivacional final del documento)"
}}

TEXTO DE LA GUÍA:
{text[:15000]}
"""

    body = json.dumps({
        "model": "claude-sonnet-4-20250514",
        "max_tokens": 4000,
        "messages": [{"role": "user", "content": prompt}]
    }).encode()

    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=body,
        headers={
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
        },
        method="POST"
    )

    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())

    raw = data["content"][0]["text"]
    # Limpiar posibles bloques de markdown
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
        raw = raw.rsplit("```", 1)[0]
    return json.loads(raw)

# ── CSS GLOBAL ────────────────────────────────────────────────────
def get_css():
    return """
@import url('https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&display=swap');

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
.chapter-icon { font-size: 28pt; margin-bottom: 8pt; }
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

/* colores por capítulo */
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

/* ── HEADER DE PÁGINA ── */
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

/* ── DIVISOR ── */
.divider {
    height: 1.5pt;
    border-radius: 1pt;
    margin: 0 0 9pt 0;
}
.div-talento { background: linear-gradient(90deg,#7c3aed,#ddd6fe,transparent); }
.div-emocion { background: linear-gradient(90deg,#f97316,#fed7aa,transparent); }
.div-pertene { background: linear-gradient(90deg,#22c55e,#bbf7d0,transparent); }
.div-desafio { background: linear-gradient(90deg,#ef4444,#fecaca,transparent); }

/* ── CUERPO DE TEXTO ── */
.body-text {
    font-size: 10.5pt;
    line-height: 1.58;
    color: #1e1b4b;
    text-align: justify;
    margin-bottom: 8pt;
}

/* ── BLOQUE RECUERDA ── */
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

/* ── PIE ── */
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

/* ── PÁGINA CIERRE ── */
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
.closing img.cl-logo { height: 32pt; margin-bottom: 20pt; }
.closing img.cl-char { max-height: 160pt; margin-bottom: 20pt; object-fit: contain; }
.closing-quote {
    font-size: 12pt;
    font-weight: 700;
    color: #4c1d95;
    line-height: 1.7;
    font-style: italic;
    max-width: 4in;
    margin-bottom: 20pt;
}
.closing-bar {
    width: 120pt;
    height: 3pt;
    background: linear-gradient(90deg,#7c3aed,#a855f7);
    border-radius: 2pt;
    margin: 0 auto 14pt;
}
.closing-flowi img { max-height: 80pt; object-fit: contain; }
.closing-fecha {
    font-size: 8.5pt;
    color: #7c3aed;
    font-weight: 700;
    margin-top: 12pt;
    letter-spacing: 0.5pt;
}
"""

# ── BUILDERS HTML ─────────────────────────────────────────────────

def b64_all():
    """Carga todas las imágenes como base64."""
    return {k: load_b64(v) for k, v in IMAGES.items()}

def cover_html(g, imgs):
    return f"""
<div class="cover">
  <div class="cover-top">
    <img class="cover-logo" src="{imgs['logo']}" alt="FlowAndo"/>
    <div class="cover-greeting">¡Hola</div>
    <div class="cover-name">{g['nombre']}!</div>
    <div class="cover-welcome">Bienvenida al Flow</div>
  </div>
  <div class="cover-img-wrap">
    <img src="{imgs['eureka']}" alt="Flowa Eureka"/>
  </div>
  <div class="cover-bottom">
    <div class="cover-dates">
      Origen del Flow: {g.get('origen','—')} &nbsp;·&nbsp; {g['fecha']}
    </div>
    <div class="cover-bar"></div>
    <div class="cover-tagline">El Lab del Talento &nbsp;·&nbsp; Descubre quién eres realmente.</div>
  </div>
</div>"""

def chapter_header_inline(label, title, subtitle, bg_cls, c_cls, img_key, imgs):
    """Encabezado de capítulo como bloque dentro del flujo (no página separada)."""
    return f"""
<div class="pg">
  <div class="chapter-break {bg_cls} {c_cls}" style="min-height:0;padding:0.25in 0.2in;border-radius:10pt;margin-bottom:0;">
    <img class="chapter-img" src="{imgs[img_key]}" style="max-height:130pt;" alt="{title}"/>
    <div class="chapter-label">{label}</div>
    <div class="chapter-title" style="font-size:22pt;">{title}</div>
    <div class="chapter-sub">{subtitle}</div>
    <div class="chapter-deco"></div>
  </div>
</div>"""

def content_page(badge_cls, badge_txt, title, subtitle, sub_cls,
                 div_cls, body, label_nombre, rl_cls, cb_cls,
                 izq, der, logo_b64, nombre, fecha, img_b64=None):
    img_block = ""
    if img_b64:
        img_block = f'<div class="pg-header-img"><img src="{img_b64}"/></div>'

    return f"""
<div class="pg">
  <div class="pg-header">
    <div class="pg-header-text">
      <span class="pg-badge {badge_cls}">{badge_txt}</span>
      <div class="pg-title">{title}</div>
      <div class="pg-subtitle {sub_cls}">{subtitle}</div>
    </div>
    {img_block}
  </div>
  <div class="divider {div_cls}"></div>
  <div class="body-text">{body}</div>
  <div class="recuerda-label {rl_cls}">{nombre}, siempre ten presente...</div>
  <div class="two-col">
    <div class="col-box {cb_cls}"><p>{izq}</p></div>
    <div class="col-box {cb_cls}"><p>{der}</p></div>
  </div>
  <div class="footer">
    <span>El Lab del Talento</span>
    <img src="{logo_b64}" alt="FlowAndo"/>
    <span>{fecha}</span>
  </div>
</div>"""

def closing_html(g, frase, imgs):
    return f"""
<div class="closing">
  <img class="cl-logo" src="{imgs['logo']}" alt="FlowAndo"/>
  <img class="cl-char" src="{imgs['p6']}" alt="celebración"/>
  <div class="closing-quote">{frase}</div>
  <div class="closing-bar"></div>
  <div class="closing-flowi">
    <img src="{imgs['flowi']}" alt="Flowi"/>
  </div>
  <div class="closing-fecha">
    Con amor, Flowi ❤ &nbsp;·&nbsp; {g['fecha']}
  </div>
</div>"""

# Asignación inteligente de imágenes por sección
SECTION_IMAGES = {
    "Carácter":              "flowi",
    "Temperamento":          "furioso",
    "Talentos innatos":      "tesoro",
    "Talentos para potenciar": "sube",
    "Propósito-Intuición":   "medita",
    "Propósito-Equilibrio":  "flowa",
    "Liderazgo-Inspirar":    "enseña",
    "Liderazgo-Transformacional": "profe",
    "Comunicación":          "escribe",
    "Inteligencia musical":  "escena3",
    "Inteligencia naturaleza": "puente",
    "Inteligencia expresiva": "escribe",
    "Ecos infancia":         "tesoro",
    # Emociones
    "El pasado":             "medita",
    "Tolerancia frustración": "triste",
    "Estabilidad emocional": "ilumina",
    "Felicidad":             "eureka",
    # Pertenencia
    "Dependencia":           "flowi",
    "Pertenencia":           "escena5",
    "Trabajo en equipo":     "engrana",
    "Responsabilidad":       "sube",
    # Desafíos
    "Etapa del Flow":        "flowe",
    "Retos internos":        "triste",
    "Desafíos sanación":     "valentin",
    "Balance":               "medita",
    "Tu mente faro":         "eureka",
    "Compromiso":            "p5",
    "Adaptación al cambio":  "flowe",
    "Negociación":           "escena3",
    "Recursividad":          "furioso",
}

def get_img(section_name, imgs):
    key = SECTION_IMAGES.get(section_name, "flowi")
    return imgs.get(key)

def section_block(item, badge_cls, badge_prefix, sub_cls, div_cls, rl_cls, cb_cls, nombre, show_divider=True):
    """HTML de UNA sección sin wrapper de página ni footer."""
    sec = item.get("seccion", "")
    div = f'<div class="divider {div_cls}" style="margin-bottom:6pt;"></div>' if show_divider else ""
    return f"""
  <div style="margin-bottom:5pt;">
    <span class="pg-badge {badge_cls}" style="margin-bottom:2pt;display:inline-block;">{badge_prefix} · {sec}</span>
    <div class="pg-title" style="font-size:11.5pt;line-height:1.2;">{item.get('subtitulo', sec)}</div>
    <div class="pg-subtitle {sub_cls}" style="font-size:8.5pt;">{sec}</div>
  </div>
  {div}
  <div class="body-text" style="font-size:10pt;margin-bottom:5pt;">{item.get('texto','')}</div>
  <div class="recuerda-label {rl_cls}" style="font-size:8pt;">{nombre}, siempre ten presente...</div>
  <div class="two-col" style="margin-bottom:3pt;">
    <div class="col-box {cb_cls}"><p style="font-size:9pt;">{item.get('recuerda_izq','')}</p></div>
    <div class="col-box {cb_cls}"><p style="font-size:9pt;">{item.get('recuerda_der','')}</p></div>
  </div>"""

def chapter_banner(label, title, subtitle, bg_cls, c_cls, img_key, imgs):
    """Banner de capítulo compacto para incluir al inicio de la primera página de contenido."""
    return f"""
  <div class="{bg_cls} {c_cls}" style="
    display:flex; align-items:center; gap:10pt;
    padding:8pt 10pt; border-radius:10pt; margin-bottom:9pt;">
    <img src="{imgs[img_key]}" style="height:55pt;object-fit:contain;border-radius:6pt;"/>
    <div style="flex:1;">
      <div class="chapter-label" style="font-size:7pt;margin-bottom:2pt;">{label}</div>
      <div class="chapter-title" style="font-size:16pt;margin-bottom:2pt;">{title}</div>
      <div class="chapter-sub" style="font-size:9pt;">{subtitle}</div>
      <div class="chapter-deco" style="width:40pt;height:2.5pt;margin-top:5pt;"></div>
    </div>
  </div>"""

def build_section_pages(items, badge_cls, badge_prefix,
                        sub_cls, div_cls, rl_cls, cb_cls,
                        logo_b64, nombre, fecha, imgs,
                        chapter_banner_html=None):
    """Agrupa de a 2 secciones por página. El banner de capítulo va en la primera página."""
    pages = []
    i = 0
    page_idx = 0
    while i < len(items):
        item_a = items[i]
        item_b = items[i+1] if i+1 < len(items) else None

        img_b64 = get_img(item_a.get("seccion",""), imgs) if page_idx % 3 == 0 and not chapter_banner_html else None
        img_block = f'<div class="pg-header-img"><img src="{img_b64}"/></div>' if img_b64 else ""

        sep = '<div style="border-top:1pt dashed #e0d4f7;margin:7pt 0;"></div>' if item_b else ""

        block_a = section_block(item_a, badge_cls, badge_prefix, sub_cls, div_cls, rl_cls, cb_cls, nombre, show_divider=True)
        block_b = section_block(item_b, badge_cls, badge_prefix, sub_cls, div_cls, rl_cls, cb_cls, nombre, show_divider=False) if item_b else ""

        banner = chapter_banner_html if page_idx == 0 and chapter_banner_html else ""

        pages.append(f"""
<div class="pg">
  {banner}
  <div style="display:flex;align-items:flex-start;gap:8pt;">
    <div style="flex:1;">{block_a}</div>
    {img_block}
  </div>
  {sep}
  {block_b}
  <div class="footer">
    <span>El Lab del Talento</span>
    <img src="{logo_b64}" alt="FlowAndo"/>
    <span>{fecha}</span>
  </div>
</div>""")
        i += 2
        page_idx += 1
    return pages

# ── MAIN ──────────────────────────────────────────────────────────

def main(pdf_path):
    print(f"\n🌊 FlowAndo — Generando guía para: {pdf_path}")

    # 1. Extraer texto
    print("  📄 Extrayendo texto del PDF...")
    text = extract_text(pdf_path)
    if not text.strip():
        print("  ❌ No se pudo extraer texto del PDF.")
        sys.exit(1)
    print(f"  ✅ {len(text)} caracteres extraídos.")

    # 2. Llamar a Claude para estructurar y condensar
    print("  🤖 Condensando con IA...")
    g = call_claude(text)
    nombre = g.get("nombre", "PERSONA")
    fecha = g.get("fecha", "2026")
    print(f"  ✅ Guía estructurada para: {nombre}")

    # 3. Cargar imágenes
    print("  🖼  Cargando imágenes...")
    imgs = b64_all()
    logo_b64 = imgs["logo"]

    # 4. Construir HTML
    print("  🎨 Construyendo diseño...")
    parts = []

    # Portada
    parts.append(cover_html(g, imgs))

    # Talento Único (página especial sin sección)
    tu = g.get("talento_unico", {})
    parts.append(f"""
<div class="pg">
  <div class="pg-header">
    <div class="pg-header-text">
      <span class="pg-badge badge-talento">Tu Esencia</span>
      <div class="pg-title">TIENES UN TALENTO ÚNICO</div>
      <div class="pg-subtitle">{tu.get('titulo_sello','')}</div>
    </div>
    <div class="pg-header-img"><img src="{imgs['eureka']}"/></div>
  </div>
  <div class="divider div-talento"></div>
  <div class="body-text">{tu.get('texto','')}</div>
  <div style="text-align:center;margin-top:10pt;">
    <img src="{imgs['flowi']}" style="max-height:110pt;object-fit:contain;"/>
  </div>
  <div class="footer">
    <span>El Lab del Talento</span>
    <img src="{logo_b64}" alt="FlowAndo"/>
    <span>{fecha}</span>
  </div>
</div>""")

    # ── CAPÍTULO: TALENTOS ──
    parts.append(chapter_html(
        "Tu Sello", "TALENTOS\nPODEROSOS",
        "Las fortalezas que nos hacen únicos y nos impulsan hacia el éxito",
        "✦", "chapter-bg-talento", "c-talento",
        "p4", imgs, "#7c3aed"
    ))
    parts += build_section_pages(
        g.get("talentos", []),
        "badge-talento", "Talentos",
        "", "div-talento", "rl-talento", "cb-talento",
        logo_b64, nombre, fecha, imgs
    )

    # ── CAPÍTULO: EMOCIONES ──
    parts.append(chapter_html(
        "Tu Mundo Interior", "EMOCIONES",
        "La energía interna que nos impulsa o nos desafía",
        "♡", "chapter-bg-emocion", "c-emocion",
        "ilumina", imgs, "#f97316"
    ))
    parts += build_section_pages(
        g.get("emociones", []),
        "badge-emocion", "Emociones",
        "s-emocion", "div-emocion", "rl-emocion", "cb-emocion",
        logo_b64, nombre, fecha, imgs
    )

    # ── CAPÍTULO: PERTENENCIA ──
    parts.append(chapter_html(
        "Tus Vínculos", "PERTENENCIA\nY COMPROMISO",
        "Los lazos que nos fortalecen y nos dan propósito colectivo",
        "◈", "chapter-bg-pertene", "c-pertene",
        "escena5", imgs, "#22c55e"
    ))
    parts += build_section_pages(
        g.get("pertenencia", []),
        "badge-pertene", "Pertenencia",
        "s-pertene", "div-pertene", "rl-pertene", "cb-pertene",
        logo_b64, nombre, fecha, imgs
    )

    # ── CAPÍTULO: DESAFÍOS ──
    parts.append(chapter_html(
        "Tu Evolución", "DESAFÍOS",
        "Los retos que nos impulsan a evolucionar y transformarnos",
        "◆", "chapter-bg-desafio", "c-desafio",
        "sube", imgs, "#ef4444"
    ))
    parts += build_section_pages(
        g.get("desafios", []),
        "badge-desafio", "Desafíos",
        "s-desafio", "div-desafio", "rl-desafio", "cb-desafio",
        logo_b64, nombre, fecha, imgs
    )

    # Página de cierre
    frase = g.get("frase_cierre", "El verdadero crecimiento no es un destino, sino una aventura en constante evolución.")
    parts.append(closing_html(g, frase, imgs))

    # 5. Generar PDF
    html = f"""<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/>
<style>{get_css()}</style>
</head>
<body>{''.join(parts)}</body>
</html>"""

    base = os.path.splitext(os.path.basename(pdf_path))[0]
    out_path = os.path.join(OUTPUT_DIR, f"{base}_Rediseñada.pdf")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("  📐 Generando PDF...")
    HTML(string=html).write_pdf(out_path)
    print(f"\n  ✅ ¡Listo! → {out_path}\n")
    return out_path

def main_from_json(json_path):
    """Genera el PDF directamente desde un JSON ya procesado (sin llamar a la API)."""
    print(f"\n🌊 FlowAndo — Generando desde JSON: {json_path}")
    with open(json_path) as f:
        g = json.load(f)
    nombre = g.get("nombre", "PERSONA")
    fecha = g.get("fecha", "2026")
    print(f"  ✅ JSON cargado para: {nombre}")

    print("  🖼  Cargando imágenes...")
    imgs = b64_all()
    logo_b64 = imgs["logo"]

    print("  🎨 Construyendo diseño...")
    parts = []
    parts.append(cover_html(g, imgs))

    tu = g.get("talento_unico", {})
    parts.append(f"""
<div class="pg">
  <div class="pg-header">
    <div class="pg-header-text">
      <span class="pg-badge badge-talento">Tu Esencia</span>
      <div class="pg-title">TIENES UN TALENTO ÚNICO</div>
      <div class="pg-subtitle">{tu.get('titulo_sello','')}</div>
    </div>
    <div class="pg-header-img"><img src="{imgs['eureka']}"/></div>
  </div>
  <div class="divider div-talento"></div>
  <div class="body-text">{tu.get('texto','')}</div>
  <div style="text-align:center;margin-top:10pt;">
    <img src="{imgs['flowi']}" style="max-height:105pt;object-fit:contain;"/>
  </div>
  <div class="footer">
    <span>El Lab del Talento</span>
    <img src="{logo_b64}" alt="FlowAndo"/>
    <span>{fecha}</span>
  </div>
</div>""")

    b_talentos = chapter_banner("Tu Sello", "TALENTOS PODEROSOS",
        "Las fortalezas que nos hacen únicos y nos impulsan hacia el éxito",
        "chapter-bg-talento", "c-talento", "p4", imgs)
    parts += build_section_pages(g.get("talentos", []),
        "badge-talento", "Talentos", "", "div-talento", "rl-talento", "cb-talento",
        logo_b64, nombre, fecha, imgs, chapter_banner_html=b_talentos)

    b_emociones = chapter_banner("Tu Mundo Interior", "EMOCIONES",
        "La energía interna que nos impulsa o nos desafía",
        "chapter-bg-emocion", "c-emocion", "ilumina", imgs)
    parts += build_section_pages(g.get("emociones", []),
        "badge-emocion", "Emociones", "s-emocion", "div-emocion", "rl-emocion", "cb-emocion",
        logo_b64, nombre, fecha, imgs, chapter_banner_html=b_emociones)

    b_pertene = chapter_banner("Tus Vínculos", "PERTENENCIA Y COMPROMISO",
        "Los lazos que nos fortalecen y nos dan propósito colectivo",
        "chapter-bg-pertene", "c-pertene", "escena5", imgs)
    parts += build_section_pages(g.get("pertenencia", []),
        "badge-pertene", "Pertenencia", "s-pertene", "div-pertene", "rl-pertene", "cb-pertene",
        logo_b64, nombre, fecha, imgs, chapter_banner_html=b_pertene)

    b_desafios = chapter_banner("Tu Evolución", "DESAFÍOS",
        "Los retos que nos impulsan a evolucionar y transformarnos",
        "chapter-bg-desafio", "c-desafio", "sube", imgs)
    parts += build_section_pages(g.get("desafios", []),
        "badge-desafio", "Desafíos", "s-desafio", "div-desafio", "rl-desafio", "cb-desafio",
        logo_b64, nombre, fecha, imgs, chapter_banner_html=b_desafios)

    frase = g.get("frase_cierre", "El verdadero crecimiento no es un destino, sino una aventura en constante evolución.")
    parts.append(closing_html(g, frase, imgs))

    html = f"""<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/>
<style>{get_css()}</style>
</head>
<body>{''.join(parts)}</body>
</html>"""

    base = os.path.splitext(os.path.basename(json_path))[0]
    out_path = os.path.join(OUTPUT_DIR, f"GuiaDelFlow_{nombre}_Rediseñada.pdf")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print("  📐 Generando PDF...")
    HTML(string=html).write_pdf(out_path)
    print(f"\n  ✅ ¡Listo! → {out_path}\n")
    return out_path

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso:")
        print("  python3 generar_guia.py <ruta.pdf>        — extrae texto y llama a la API")
        print("  python3 generar_guia.py <ruta.json>       — usa JSON ya procesado")
        sys.exit(1)
    path = sys.argv[1]
    if path.endswith(".json"):
        main_from_json(path)
    else:
        main(path)