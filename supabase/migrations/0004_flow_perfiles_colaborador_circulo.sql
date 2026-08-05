-- ============================================================================
-- 0004_flow_perfiles_colaborador_circulo.sql
--
-- Cuando alguien se registra con un link de invitación (ver
-- guia_del_flow_invitaciones en Círculo de Crecimiento, mismo proyecto de
-- Supabase), src/lib/circulo/invitacion.ts deja acá a qué colaborador
-- corresponde su cuenta — así sincronizar.ts ya no tiene que adivinar por
-- correo, tiene la respuesta directa.
--
-- null = cuenta genérica, sin invitación (alguien que se registró solo con
-- el link público) — sincronizar.ts cae de vuelta al emparejamiento por
-- correo en ese caso, igual que hoy.
-- ============================================================================

alter table public.flow_perfiles
  add column colaborador_circulo_id uuid references colaboradores(id) on delete set null;

comment on column public.flow_perfiles.colaborador_circulo_id is 'Colaborador de Círculo de Crecimiento vinculado por invitación (ver guia_del_flow_invitaciones, tabla de ese otro proyecto en la misma base). Null = sin invitación, se sigue emparejando por correo.';
