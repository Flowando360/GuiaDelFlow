-- ============================================================================
-- 0007_flow_links_envio_correo_opcional.sql
--
-- flow_links_envio.correo_destino deja de ser obligatorio. En la práctica
-- nunca se usó para mandar correos (eso quedó obsoleto desde 0006: el
-- correo final siempre va al dueño de la cuenta o se retiene en modo
-- 'acompanado', ver comentario en /api/generar-carta/route.ts) — es solo
-- un dato de referencia para que la superusuaria identifique el link antes
-- de que la persona se registre, y casi siempre lo crea sin tener todavía
-- el correo del paciente. Basta con la etiqueta (nombre del paciente).
-- ============================================================================

alter table public.flow_links_envio
  alter column correo_destino drop not null;

comment on column public.flow_links_envio.correo_destino is 'Opcional — solo referencia interna para la superusuaria (no se usa para enviar nada). Casi siempre se crea el link sin este dato todavía; basta con la etiqueta.';
