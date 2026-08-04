-- ============================================================================
-- 0001_flow_schema.sql
-- Esquema propio de "Guía del Flow", con prefijo flow_ para convivir en el
-- MISMO proyecto de Supabase que Círculo de Crecimiento (ref
-- zmpggzrmsuudxyjtobzy) sin chocar con sus tablas. No toca ni lee ninguna
-- tabla existente de ese proyecto.
-- ============================================================================

-- ── Perfil (1:1 con auth.users) ──────────────────────────────────────────
create table if not exists public.flow_perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre_completo text not null,
  email text not null,
  fecha_nacimiento date,
  created_at timestamptz not null default now()
);

-- ── Un intento de cuestionario por persona (se permite rehacer) ─────────
create table if not exists public.flow_cuestionarios (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.flow_perfiles (id) on delete cascade,
  -- { "C9": "...", ..., "C97": "...", + campos demográficos de questionnaire.json }
  respuestas jsonb not null default '{}'::jsonb,
  completado_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Resultado del motor de cálculo (los ~30 aspectos) ────────────────────
create table if not exists public.flow_resultados (
  id uuid primary key default gen_random_uuid(),
  cuestionario_id uuid not null references public.flow_cuestionarios (id) on delete cascade,
  -- { "CARACTER": {...}, "TALENTO_UNICO": {...}, "Niñez": {...}, ... }
  aspectos jsonb not null,
  calculado_at timestamptz not null default now()
);

-- ── Los 3 cuestionamientos + razón, para la Carta ─────────────────────────
create table if not exists public.flow_carta_intake (
  id uuid primary key default gen_random_uuid(),
  cuestionario_id uuid not null references public.flow_cuestionarios (id) on delete cascade,
  razon text not null,
  cuestionamiento_1 text not null,
  cuestionamiento_2 text not null,
  cuestionamiento_3 text not null,
  created_at timestamptz not null default now()
);

-- ── Los 2 PDFs generados ──────────────────────────────────────────────────
do $$ begin
  create type flow_documento_tipo as enum ('guia', 'carta');
exception when duplicate_object then null; end $$;

do $$ begin
  create type flow_documento_estado as enum ('pendiente', 'generando', 'listo', 'error');
exception when duplicate_object then null; end $$;

create table if not exists public.flow_documentos (
  id uuid primary key default gen_random_uuid(),
  cuestionario_id uuid not null references public.flow_cuestionarios (id) on delete cascade,
  tipo flow_documento_tipo not null,
  estado flow_documento_estado not null default 'pendiente',
  storage_path text,
  error_detalle text,
  generado_at timestamptz,
  created_at timestamptz not null default now(),
  unique (cuestionario_id, tipo)
);

-- ── Row Level Security ────────────────────────────────────────────────────
alter table public.flow_perfiles enable row level security;
alter table public.flow_cuestionarios enable row level security;
alter table public.flow_resultados enable row level security;
alter table public.flow_carta_intake enable row level security;
alter table public.flow_documentos enable row level security;

create policy "flow_perfiles: cada quien ve/edita el suyo" on public.flow_perfiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "flow_cuestionarios: cada quien ve/edita los suyos" on public.flow_cuestionarios
  for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

-- flow_resultados y flow_documentos: SOLO lectura para el dueño. Los
-- escribe el motor de cálculo / el generador de PDFs desde el servidor
-- con service_role (se salta RLS a propósito) — no hay policy de
-- insert/update para usuarios normales.
create policy "flow_resultados: solo lectura del dueño" on public.flow_resultados
  for select using (
    exists (
      select 1 from public.flow_cuestionarios c
      where c.id = cuestionario_id and c.usuario_id = auth.uid()
    )
  );

create policy "flow_carta_intake: cada quien ve/edita lo suyo" on public.flow_carta_intake
  for all using (
    exists (
      select 1 from public.flow_cuestionarios c
      where c.id = cuestionario_id and c.usuario_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.flow_cuestionarios c
      where c.id = cuestionario_id and c.usuario_id = auth.uid()
    )
  );

create policy "flow_documentos: solo lectura del dueño" on public.flow_documentos
  for select using (
    exists (
      select 1 from public.flow_cuestionarios c
      where c.id = cuestionario_id and c.usuario_id = auth.uid()
    )
  );

-- ── Alta automática de perfil al registrarse ──────────────────────────────
create or replace function public.flow_handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.flow_perfiles (id, nombre_completo, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nombre_completo', ''), new.email);
  return new;
end;
$$;

drop trigger if exists flow_on_auth_user_created on auth.users;
create trigger flow_on_auth_user_created
  after insert on auth.users
  for each row execute function public.flow_handle_new_user();

-- ── Storage: bucket privado para los PDFs ─────────────────────────────────
-- Ruta de archivo: "usuario_id/cuestionario_id/guia.pdf" o ".../carta.pdf".
-- Nombre distinto del bucket "guias-flow" que ya existe en este mismo
-- proyecto para otra función de Círculo de Crecimiento (no lo tocamos).
insert into storage.buckets (id, name, public)
values ('guia-del-flow', 'guia-del-flow', false)
on conflict (id) do nothing;

create policy "guia-del-flow: dueño lee su archivo" on storage.objects for select
  using (
    bucket_id = 'guia-del-flow'
    and (storage.foldername(name)) [1] = auth.uid()::text
  );

-- Nadie inserta/actualiza/borra desde el cliente: solo el service_role
-- (que se salta RLS) sube los PDFs ya generados.
