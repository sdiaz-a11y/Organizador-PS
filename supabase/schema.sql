-- Ejecuta este archivo completo en Supabase > SQL Editor.

create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tareas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text not null default '',
  estado text not null default 'idea'
    check (estado in ('idea','analisis','desarrollo','pruebas','hecho')),
  prioridad text not null default 'media' check (prioridad in ('alta','media','baja')),
  tipo text not null default 'idea'
    check (tipo in ('idea','bug','mejora','automatizacion','documentacion')),
  responsable uuid references public.perfiles(id) on delete set null,
  orden double precision not null default (extract(epoch from now()) * 1000),
  creado_por uuid references public.perfiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notas (
  id uuid primary key default gen_random_uuid(),
  tarea_id uuid not null references public.tareas(id) on delete cascade,
  autor uuid references public.perfiles(id) on delete set null default auth.uid(),
  texto text not null,
  sistema boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notas_tarea_idx on public.notas(tarea_id, created_at);

-- Perfil automático al registrarse (el nombre viene del formulario de registro).
create or replace function public.crear_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'nombre',''), split_part(new.email,'@',1)));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.crear_perfil();

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists tareas_touch on public.tareas;
create trigger tareas_touch before update on public.tareas
  for each row execute function public.touch_updated_at();

-- Seguridad: solo usuarios con sesión; todo el equipo ve y edita todo.
alter table public.perfiles enable row level security;
alter table public.tareas enable row level security;
alter table public.notas enable row level security;

drop policy if exists perfiles_leer on public.perfiles;
create policy perfiles_leer on public.perfiles for select to authenticated using (true);
drop policy if exists perfiles_editar_propio on public.perfiles;
create policy perfiles_editar_propio on public.perfiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists tareas_todo on public.tareas;
create policy tareas_todo on public.tareas for all to authenticated using (true) with check (true);
drop policy if exists notas_todo on public.notas;
create policy notas_todo on public.notas for all to authenticated using (true) with check (true);

-- Tiempo real
alter publication supabase_realtime add table public.tareas;
alter publication supabase_realtime add table public.notas;
alter publication supabase_realtime add table public.perfiles;
