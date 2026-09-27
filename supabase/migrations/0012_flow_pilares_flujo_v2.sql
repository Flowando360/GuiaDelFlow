-- ============================================================================
-- 0012_flow_pilares_flujo_v2.sql
--
-- Ajustes al flujo de "Los 4 Pilares" según
-- espiralcrecimiento360/Especificacion_Juego_4_Pilares_FlowAndo.docx (v1.0,
-- 27/09/2026): el correo ahora se pide SOLO al final (antes de generar el
-- PDF), no en la landing -- así que la sesión se crea desde el principio
-- (con solo el nombre) para poder medir abandono por etapa (sección 17/19
-- del documento), y se completa progresivamente. Requiere que
-- 0011_flow_pilares_estados.sql ya se haya aplicado y comiteado antes.
-- ============================================================================

alter table public.flow_pilares_sesiones
  alter column correo drop not null;

alter table public.flow_pilares_sesiones
  alter column estado set default 'jugando';

-- Compromiso opcional del experimento de 24h (sección 13/17 del documento).
alter table public.flow_pilares_sesiones
  add column if not exists compromiso_24h text;

comment on column public.flow_pilares_sesiones.compromiso_24h is 'Lo que la persona escribió que va a hacer en las próximas 24h (opcional, pantalla final del juego).';
