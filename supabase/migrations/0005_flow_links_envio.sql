-- ============================================================================
-- 0005_flow_links_envio.sql
--
-- Links de envío configurable: el dueño de FlowAndo puede crear un link
-- (con scripts/crear-link-envio.ts) que manda la Guía y la Carta por correo
-- a un destinatario predeterminado (ej. la empresa/persona que comparte el
-- link con varios candidatos) en vez de al correo de quien diligencia el
-- cuestionario, que sigue siendo el comportamiento por defecto sin link.
--
-- El token en la URL de registro (?envio=<id>) ES el id de esta tabla. Se
-- vincula a la cuenta en flow_perfiles.envio_link_id al registrarse (igual
-- patrón que colaborador_circulo_id, ver 0004) y de ahí lo lee
-- /api/generar-carta al decidir a quién mandar el correo final.
-- ============================================================================

create table if not exists public.flow_links_envio (
  id uuid primary key default gen_random_uuid(),
  correo_destino text not null,
  etiqueta text,
  creado_at timestamptz not null default now()
);

comment on table public.flow_links_envio is 'Links que redirigen el correo final (Guía+Carta) a un destinatario fijo en vez de al de quien diligencia. Se crean con scripts/crear-link-envio.ts.';

alter table public.flow_perfiles
  add column envio_link_id uuid references public.flow_links_envio (id) on delete set null;

comment on column public.flow_perfiles.envio_link_id is 'Si la cuenta se creó desde un link de envío configurado (?envio=), acá queda cuál — null = comportamiento normal, correo al dueño de la cuenta.';

-- Solo el service_role toca esta tabla (crear el link, leer el destino al
-- enviar el correo) — no hay policy para usuarios normales a propósito: el
-- correo destino de un link no es algo que ningún usuario final deba poder
-- leer ni listar.
alter table public.flow_links_envio enable row level security;
