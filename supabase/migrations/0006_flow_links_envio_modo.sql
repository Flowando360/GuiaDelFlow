-- ============================================================================
-- 0006_flow_links_envio_modo.sql
--
-- Dashboard de superusuaria para Guía del Flow: cada link de envío
-- (flow_links_envio, ver 0005) ahora tiene un MODO que define cómo llegan
-- los resultados de quien se registre con ese link:
--
--   'directo'    — la Guía y la Carta le llegan a la persona por correo tal
--                   como siempre (comportamiento por defecto, sin link).
--   'acompanado' — NO se manda correo automático al terminar. La
--                   superusuaria revisa primero desde /panel y decide
--                   cuándo "liberar" — ahí sí se manda el correo (con los
--                   PDF ya generados, sin volver a llamar a Claude) y la
--                   persona también puede descargarlo desde /resultado.
--
-- En AMBOS modos, cualquier cuenta registrada con un link (envio_link_id no
-- nulo en flow_perfiles) queda visible/descargable para la superusuaria
-- desde /panel — eso no depende del modo, es automático por venir de un
-- link suyo.
-- ============================================================================

alter table public.flow_links_envio
  add column modo text not null default 'directo' check (modo in ('directo', 'acompanado'));

comment on column public.flow_links_envio.modo is '''directo'': la persona recibe sus documentos de inmediato por correo. ''acompanado'': se retienen hasta que la superusuaria los libera desde /panel.';

-- Marca cuándo se liberaron los documentos de un cuestionario en modo
-- 'acompanado' — null = todavía retenidos (o modo 'directo', donde este
-- campo no aplica). Vive en flow_cuestionarios (no en flow_documentos)
-- porque la liberación cubre Guía + Carta juntas, no cada PDF por separado.
alter table public.flow_cuestionarios
  add column liberado_at timestamptz;

-- Consentimiento explícito al registrarse con un link de envío — mismo
-- patrón que autorizacion_circulo_en (0001/0004): quien se registra con
-- ?envio= debe marcar una casilla aceptando que quien compartió el link
-- puede ver su Guía completa (modo 'directo': la ve además de la persona;
-- modo 'acompanado': la ve primero). Null = no vino de un link de envío.
alter table public.flow_perfiles
  add column autorizacion_envio_en timestamptz;

comment on column public.flow_perfiles.autorizacion_envio_en is 'Cuándo la persona aceptó explícitamente que quien le compartió su link de envío pueda ver su Guía del Flow completa.';
