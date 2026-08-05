-- ============================================================================
-- 0003_flow_documentos_contenido.sql
-- La Carta necesita el contenido YA ESCRITO de la Guía (no solo el PDF)
-- para poder responder los 3 cuestionamientos conectándolos con lo que
-- dice la Guía real de la persona — no con el resultado crudo del motor
-- de cálculo. En vez de volver a llamar a Claude para "releer" el PDF
-- (como hacía el prototipo original), se guarda acá el JSON que ya se le
-- pidió a Claude al generar la Guía, para reusarlo directo.
-- ============================================================================

alter table public.flow_documentos
  add column if not exists contenido jsonb;

comment on column public.flow_documentos.contenido is
  'Para tipo=guia: el JSON condensado (GuiaCondensada) que se usó para armar el PDF — lo reusa la Carta como contexto. Para tipo=carta: no se usa.';
