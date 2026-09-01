-- ============================================================================
-- 0008_flow_cuestionarios_correo_estado.sql
--
-- Registra si el correo final (Guía + Carta adjuntas) se logró mandar o no.
-- Hasta ahora ese resultado solo quedaba en console.error/console.log de la
-- función serverless (ver src/lib/generacion/carta.ts) -- nada persistía en
-- la base, así que no había forma de saber desde /panel si a alguien
-- realmente le llegó su correo o si Resend falló en silencio.
--
-- correo_documentos_enviado_at: cuándo se confirmó el envío (null = nunca
-- se intentó, o se intentó y falló -- ver correo_documentos_error).
-- correo_documentos_error: mensaje de Resend/excepción si el último intento
-- falló. Se limpia (null) en un intento exitoso.
-- ============================================================================

alter table public.flow_cuestionarios
  add column if not exists correo_documentos_enviado_at timestamptz,
  add column if not exists correo_documentos_error text;

comment on column public.flow_cuestionarios.correo_documentos_enviado_at is 'Cuándo se confirmó el envío del correo con Guía+Carta adjuntas. Null = nunca se intentó o el último intento falló.';
comment on column public.flow_cuestionarios.correo_documentos_error is 'Mensaje del último intento fallido de envío (Resend o excepción). Null si el último intento fue exitoso o nunca se intentó.';
