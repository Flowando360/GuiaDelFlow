-- ============================================================================
-- 0009_flow_estados_manuales.sql
--
-- Estado manual por colaborador, para el caso de gente que ya tenía su
-- Guía del Flow resuelta POR FUERA de este sistema (ej. el equipo
-- comercial, Talento Humano y la gerente de Mármoles y Servicios, que la
-- hicieron antes de que este aplicativo existiera) -- Diana lo pidió el
-- 2026-08-31, como capacidad general para cualquier empresa cliente, no
-- solo esta.
--
-- No depende de que exista una cuenta en flow_perfiles -- colaborador_id
-- es lo único que hace falta, así que cubre gente que nunca se va a
-- registrar acá porque su Guía ya se resolvió de otra forma.
-- ============================================================================

create table if not exists public.flow_estados_manuales (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null unique references colaboradores(id) on delete cascade,
  estado text not null,
  nota text,
  creado_at timestamptz not null default now(),
  actualizado_at timestamptz not null default now()
);

comment on table public.flow_estados_manuales is 'Estado de la Guía del Flow puesto a mano desde /panel/estados-manuales, para colaboradores cuya Guía se resolvió por fuera del sistema (antes de existir, en persona, etc.) -- no depende de flow_perfiles.';
comment on column public.flow_estados_manuales.estado is 'Ej. "entregada_gestionada". Texto libre a propósito -- ver ESTADOS_MANUALES en src/lib/panel/estadosManuales.ts para la lista curada que ofrece la UI.';

-- Solo el service_role toca esta tabla (se administra desde /panel, ya
-- gateado por esAdmin) -- mismo criterio que flow_links_envio (ver 0005).
alter table public.flow_estados_manuales enable row level security;
