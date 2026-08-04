# Guía del Flow

### FlowAndo · El Lab del Talento

App web de autoconocimiento: la persona completa un cuestionario de 89
preguntas y recibe automáticamente dos documentos personalizados en PDF:

1. **La Guía del Flow** — informe largo (16-18 páginas media carta) con sus
   ~30 aspectos de personalidad/talento/propósito.
2. **La Carta** — mensaje corto (5 páginas carta) escrito como si fuera de
   Flowi, su amiga cercana, respondiendo a 3 cuestionamientos que la persona
   comparte. Se genera **después** de la Guía, porque la usa como contexto.

## Stack

| Capa | Herramienta |
|---|---|
| Frontend | Next.js (App Router) + TypeScript + Tailwind |
| Base de datos / Auth / Storage | Supabase (proyecto **compartido** con Círculo de Crecimiento — tablas con prefijo `flow_`, bucket propio) |
| Generación de contenido | Claude API |
| Despliegue | Vercel (team `flow-ando360`) |

## Estructura

```
flowando_kb/          ← base de conocimiento normalizada (cuestionario,
                         orden de cálculo, resultados por aspecto) — JSON
                         limpio, generado a partir de BC_MADRE.xlsx
Codigo/                ← prototipos originales (Python/WeasyPrint) que
                         definen el diseño real de la Guía y la Carta;
                         referencia para portar el diseño a la app, no se
                         ejecutan en producción
public/images/flow-optimizado/  ← imágenes de marca (Flowi/Flowa/Flowe),
                         comprimidas para PDF (~2MB en total, vs. 51MB de
                         las originales) — ver scripts/optimizar-imagenes.ts
scripts/               ← utilidades de mantenimiento (ej. re-optimizar
                         imágenes si se agregan nuevas a Imagenes_Flow/)
src/                   ← la app
```

`Docs/` e `Imagenes_Flow/` (material fuente: Excel originales, PDFs de
ejemplo con nombres reales, imágenes sin optimizar) quedan **fuera del
repo** a propósito — ver `.gitignore`. Si se agrega una imagen nueva a
`Imagenes_Flow/`, correr `npx tsx scripts/optimizar-imagenes.ts` para
regenerar `public/images/flow-optimizado/` con todas las imágenes
comprimidas (no solo la nueva).

## Cuentas de este proyecto

- GitHub: `Flowando360` (org)
- Vercel: team `flow-ando360`
- Supabase: proyecto compartido con Círculo de Crecimiento (ref
  `zmpggzrmsuudxyjtobzy`) — solo se comparte la base de datos, el código y
  el despliegue son independientes.

## Desarrollo

```bash
npm install
npm run dev
```
