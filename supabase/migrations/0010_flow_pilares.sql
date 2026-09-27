-- ============================================================================
-- 0010_flow_pilares.sql
--
-- "Los 4 Pilares": mini-juego público de autoconocimiento (inspirado en la
-- charla de Emily Esfahani Smith), pensado como puerta de entrada abierta —
-- sin cuenta, sin contraseña, sin depender de una empresa — que termina en
-- un PDF corto enviado por correo. Ver Diseno-Juego-4-Pilares.md (repo
-- espiralcrecimiento360) para el diseño completo.
--
-- A propósito NO usa auth.users ni flow_perfiles: a diferencia del resto de
-- este esquema, este juego es 100% anónimo — nombre y correo se piden en el
-- propio juego, no hay login. El id de la sesión (uuid impredecible) es el
-- único "token" de acceso a su resultado, mismo modelo de confianza que
-- flow_links_envio.id en la URL de registro (?envio=). Por eso RLS queda
-- habilitado sin ninguna policy para el rol anon/authenticated: todo acceso
-- pasa por el service_role desde server actions / route handlers, que
-- filtran por ese id.
-- ============================================================================

-- ── Link de campaña, reutilizable por muchas personas (a diferencia de
-- flow_links_envio, que es 1 link = 1 persona) ──────────────────────────────
create table if not exists public.flow_pilares_links (
  id uuid primary key default gen_random_uuid(),
  etiqueta text not null,
  activo boolean not null default true,
  creado_at timestamptz not null default now()
);

comment on table public.flow_pilares_links is 'Link de campaña reutilizable para "Los 4 Pilares" — una sola URL (/pilares/<id>) que puede jugar cualquier cantidad de personas. Se crea desde /panel/pilares.';

do $$ begin
  create type flow_pilares_estado as enum ('generando', 'listo', 'error');
exception when duplicate_object then null; end $$;

create table if not exists public.flow_pilares_sesiones (
  id uuid primary key default gen_random_uuid(),
  link_id uuid references public.flow_pilares_links (id) on delete set null,
  nombre text not null,
  correo text not null,
  -- { "<id_tarjeta>": "pertenencia" | "proposito" | "trascendencia" | "narracion" }
  clasificacion jsonb not null default '{}'::jsonb,
  -- { "<id_pregunta>": "lo que escribió la persona" } — ver src/lib/pilares/contenido.ts, PREGUNTAS_PILARES
  reflexiones jsonb not null default '{}'::jsonb,
  -- { "momento_antes": "...", "momento_despues": "...", "titulo": "..." }
  historia jsonb not null default '{}'::jsonb,
  -- Salida completa de Claude (PilaresCondensado, incluye pilar_mas_vivo),
  -- guardada para poder regenerar el PDF sin volver a llamar al modelo, y
  -- para que /panel/pilares lea de ahí el pilar más vivo de cada persona.
  resultado jsonb,
  estado flow_pilares_estado not null default 'generando',
  storage_path text,
  error_detalle text,
  correo_enviado_at timestamptz,
  correo_error text,
  creado_at timestamptz not null default now()
);

comment on table public.flow_pilares_sesiones is 'Una persona que jugó "Los 4 Pilares". Sin cuenta: el id de la fila es el único token de acceso a su resultado (/pilares/resultado/<id>).';

create index if not exists flow_pilares_sesiones_link_id_idx on public.flow_pilares_sesiones (link_id);

alter table public.flow_pilares_links enable row level security;
alter table public.flow_pilares_sesiones enable row level security;
-- Sin policies a propósito (ver comentario de cabecera): solo el
-- service_role lee/escribe estas dos tablas.

-- ── Storage: bucket privado para los PDFs de "Los 4 Pilares" ────────────────
-- Bucket propio (no el de "guia-del-flow") porque la ruta de archivo no
-- puede anclarse a un auth.uid() -- acá no hay usuarios. Ruta:
-- "<sesion_id>/pilares.pdf". Nadie lee/escribe desde el cliente: el
-- service_role sube el PDF ya generado y lo sirve /api/pilares/descargar.
insert into storage.buckets (id, name, public)
values ('pilares-del-flow', 'pilares-del-flow', false)
on conflict (id) do nothing;
