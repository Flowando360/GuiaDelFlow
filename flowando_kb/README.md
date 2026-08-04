# Flowando — Base de Conocimiento Normalizada

Generado a partir de `BC_MADRE.xlsx` (32 hojas originales). Este paquete convierte
esa base de Google-Sheets-style a JSON limpio para que Claude Code no tenga que
parsear Excel en producción.

## Contenido

- `knowledge_base/*.json` — un archivo por aspecto (30 aspectos; se excluyó
  `Aspectos_ValorUnico` por ser un duplicado legacy de `Inteligencias`).
- `knowledge_base/_index.json` — índice rápido: tipo de cálculo y cantidad de
  resultados por aspecto.
- `questionnaire.json` — las 89 preguntas codificadas (C9–C97) + 12 campos
  demográficos/abiertos, extraídos de `ArquitecturaCuestionario.xlsx`.
- `calculation_order.json` — el orden OBLIGATORIO de ejecución (ver más abajo,
  es el punto más importante de todo el paquete).

## Los 5 tipos de cálculo (`tipo_calculo` en cada JSON)

| tipo_calculo | Qué significa | Ejemplo |
|---|---|---|
| `suma_likert` | Suma de 3-5 preguntas Likert, cae en un rango [min,max] | Recursividad (C78-C82) |
| `pregunta_unica_umbral` | Una sola pregunta Likert, se activa si respuesta ≥3 | Inteligencias (C64-C72) |
| `formula_fecha_residuo_elemento` | año%12 + elemento zodiacal | TALENTO_UNICO (48 combos) |
| `formula_fecha_residuo` | año%12 solamente | TEMPERAMENTO (12 combos) |
| `formula_fecha_identificador` | signo zodiacal o "septenio" (edad/7) | CARACTER, ETAPA_FLOW |
| `formula_numerologica` | reducción numerológica de dígitos de fecha | Talento_Innato, Talento_Potenciar, Proposito_1 |
| `formula_numerologica_compuesta` | reducción numerológica QUE DEPENDE de otro aspecto ya calculado | Proposito_2, Desafio_Libera, CualidadesPotencia, Integra, Niñez, DesafioInterior, Desafio_Sanacion |

⚠️ Nota: `DesafioInterior` y `Desafio_Sanacion` quedaron clasificados como
`formula_numerologica_compuesta` por tener la misma forma de columnas que los
verdaderos compuestos, pero en realidad son cálculos DIRECTOS de fecha (día y
mes respectivamente) — no dependen de otro aspecto. El único que de verdad
usa `letra_frecuente` (Niñez) quedó con esa misma forma de columnas por
coincidencia de formato en la hoja original; su cálculo real es "letra más
frecuente entre C93-C97" tal como se documentó en la conversación con el
cliente, no una suma numerológica. **Revisar `calculation_order.json` para la
lógica real, no solo el campo `tipo_calculo`.**

## Orden de ejecución — CRÍTICO

`calculation_order.json` documenta que el motor NO puede correr los 32
aspectos en paralelo. Hay 4 aspectos "compuestos" que necesitan que otros ya
estén calculados:

```
Paso 1 (directos)  →  Paso 2 (compuestos simples)  →  Paso 3 (doble compuesto)
                       Proposito_2                     Integra
                       Desafio_Libera                  (depende de Proposito_2)
                       CualidadesPotencia
```

## Esquema de cada archivo de aspecto

```json
{
  "sheet": "Recursividad",
  "tipo_calculo": "suma_likert",
  "preambulo": [ "Recursividad - Creatividad y resolución en acción", "Suma C78-C82" ],
  "num_resultados": 3,
  "resultados": [
    { "min": 5.0, "max": 10.0, "titulo": "...", "descripcion": "...", ... }
  ]
}
```

Los aspectos de fecha/numerología (TALENTO_UNICO, CARACTER, etc.) tienen un
`preambulo` más rico con pares `{"campo": ..., "valor": ...}` porque esas
hojas documentan la fórmula de cálculo explícitamente en las celdas.

## Resuelto — 2026-08-04

1. **Niñez**: se definieron las 5 opciones de respuesta (A-E) para cada una
   de las 5 preguntas (C93-C97), con mapeo fijo de letra a perfil/valor
   (A=1 acción-aventura, B=2 creatividad, C=3 liderazgo, D=4 colaboración,
   E=5 análisis — los mismos 5 títulos que ya estaban redactados en
   `knowledge_base/Niñez.json`). El algoritmo es: contar la letra más
   repetida entre las 5 respuestas; en caso de empate, se revisan las
   respuestas en el orden C93 → C95 → C94 → C96 → C97 y gana la primera
   letra empatada que aparezca en ese recorrido (de la pregunta más
   conductual/concreta a la más aspiracional). Detalle completo y ejemplo
   de desempate en `calculation_order.json` → `detalle_calculo_ninez`; las
   opciones en sí están en `questionnaire.json` → cada pregunta C93-C97
   tiene ahora un array `opciones`, más el mapeo `perfil_letra_valor_ninez`.
   **Pendiente real remanente**: esto es una propuesta razonada a partir de
   los 5 títulos ya existentes, no una regla que estuviera escrita en el
   Excel — Flowando debería confirmarla (o ajustar el texto de las
   opciones) antes de mostrarla a usuarios finales.
2. **DesafioInterior**: confirmado que el rango 1-11 está completo sin
   huecos. El día de nacimiento (1-31) tiene máximo 2 dígitos, así que la
   suma de sus dígitos en una sola pasada nunca supera 11 y no necesita una
   segunda reducción; recorriendo los 31 días posibles se obtienen
   exactamente los valores {1..11} (los días 19 y 28 dan 10, el día 29 da
   11). Ver `calculation_order.json` →
   `resuelto_2026_08_04_rango_desafio_interior`.
3. Las preguntas C93-C97 en `questionnaire.json` ya no son texto libre:
   tienen opción múltiple A-E siguiendo la propuesta del punto 1.
4. **Regla de reducción numerológica para los aspectos compuestos**
   (`Proposito_2`, `Desafio_Libera`, `CualidadesPotencia`, `Integra`): la
   regla ya documentada (sumar dígitos repetidamente hasta ≤11, sin
   excepción para 10/11 porque esos valores ya cumplen la condición de
   parada) queda confirmada por el texto fuente — las 4 hojas de
   `BC_MADRE.xlsx` usan la misma frase literal "se reduce a un número
   menor o igual a 11". Además, calculando el rango real de cada
   compuesto a partir de los rangos ya confirmados de sus aspectos base
   (todos 1-11, salvo `TALENTO_UNICO.residuo` que es 0-11), se determinó
   que solo `Proposito_2` y `CualidadesPotencia` pueden necesitar una
   segunda pasada en la práctica, y únicamente cuando la suma intermedia
   da exactamente 39 (3+9=12 → 1+2=3). `Desafio_Libera` e `Integra` nunca
   la necesitan. Ver `calculation_order.json` →
   `resuelto_2026_08_04_reduccion_numerologica_compuestos`.

## Pendientes reales que quedan abiertos

- Validación de Flowando sobre la propuesta de opciones A-E de Niñez (punto
  1 arriba) — el cálculo ya es ejecutable, pero el copy de las opciones es
  una interpretación razonable, no un dato extraído del Excel.

## Lo que NO se incluyó (intencional)

- `CALCULADORA1` / `CALCULADORA2` de `BC_MADRE.xlsx`: son un log histórico de
  resultados ya calculados para usuarios reales (contienen emails), no reglas
  de negocio. Útiles como *casos de prueba* para validar que el motor nuevo
  reproduce los mismos resultados que el sistema anterior, pero no se
  normalizaron aquí.
- El motor de "La Carta" (generación con IA vía Flowi): eso no vive en esta
  base de conocimiento determinística — es un prompt aparte que consume el
  resultado ya calculado de estos JSON como contexto.
