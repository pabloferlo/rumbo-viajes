-- Rumbo: esquema inicial de Supabase.
-- Ejecuta este archivo en Supabase Dashboard > SQL Editor.
-- Las políticas RLS son obligatorias: la anon key del navegador NO sustituye permisos.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  destination text,
  start_date date,
  end_date date,
  currency text not null default 'EUR',
  emoji text default '🌍',
  budget numeric(12,2),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint trips_dates_check check (end_date is null or start_date is null or end_date >= start_date)
);

create table if not exists public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'member' check (role in ('owner','member')),
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz not null default now(),
  constraint trip_member_identity check (user_id is not null or display_name <> ''),
  constraint trip_members_user_unique unique (trip_id, user_id)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  category text not null default 'Otros',
  expense_date date not null default current_date,
  paid_by_name text not null,
  split_names text[] not null default '{}',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null,
  day_number integer not null default 1 check (day_number > 0),
  start_time time,
  location text,
  category text not null default 'Visita',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.packing_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  category text not null default 'General',
  is_checked boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.trip_groups (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.trip_groups(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists trip_members_user_id_idx on public.trip_members(user_id);
create index if not exists trip_members_trip_id_idx on public.trip_members(trip_id);
create index if not exists expenses_trip_id_date_idx on public.expenses(trip_id, expense_date desc);
create index if not exists activities_trip_day_idx on public.activities(trip_id, day_number, start_time);
create index if not exists packing_items_trip_id_idx on public.packing_items(trip_id);
create index if not exists trip_groups_trip_id_idx on public.trip_groups(trip_id);
create index if not exists group_members_group_id_idx on public.group_members(group_id);

-- Helper security-definer avoids recursive RLS when checking trip membership.
create or replace function public.is_trip_member(target_trip uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.trip_members tm
    where tm.trip_id = target_trip and tm.user_id = auth.uid()
  );
$$;

create or replace function public.is_trip_owner(target_trip uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.trip_members tm
    where tm.trip_id = target_trip and tm.user_id = auth.uid() and tm.role = 'owner'
  );
$$;

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.expenses enable row level security;
alter table public.activities enable row level security;
alter table public.packing_items enable row level security;
alter table public.trip_groups enable row level security;
alter table public.group_members enable row level security;

drop policy if exists "profiles read self or trip mates" on public.profiles;
create policy "profiles read self or trip mates" on public.profiles for select to authenticated
using (id = auth.uid() or exists (
  select 1 from public.trip_members mine
  join public.trip_members theirs on theirs.trip_id = mine.trip_id
  where mine.user_id = auth.uid() and theirs.user_id = profiles.id
));
drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update self" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "profiles insert self" on public.profiles;
create policy "profiles insert self" on public.profiles for insert to authenticated with check (id = auth.uid());

drop policy if exists "trips read members" on public.trips;
create policy "trips read members" on public.trips for select to authenticated using (public.is_trip_member(id));
drop policy if exists "trips create by creator" on public.trips;
create policy "trips create by creator" on public.trips for insert to authenticated with check (created_by = auth.uid());
drop policy if exists "trips update owners" on public.trips;
create policy "trips update owners" on public.trips for update to authenticated using (public.is_trip_owner(id)) with check (public.is_trip_owner(id));
drop policy if exists "trips delete owners" on public.trips;
create policy "trips delete owners" on public.trips for delete to authenticated using (public.is_trip_owner(id));

drop policy if exists "members read trip" on public.trip_members;
create policy "members read trip" on public.trip_members for select to authenticated using (public.is_trip_member(trip_id));
drop policy if exists "members add self as owner" on public.trip_members;
create policy "members add self as owner" on public.trip_members for insert to authenticated
with check (
  (user_id = auth.uid() and role = 'owner' and exists(select 1 from public.trips t where t.id = trip_id and t.created_by = auth.uid()))
  or public.is_trip_owner(trip_id)
);
drop policy if exists "members update owners" on public.trip_members;
create policy "members update owners" on public.trip_members for update to authenticated using (public.is_trip_owner(trip_id)) with check (public.is_trip_owner(trip_id));
drop policy if exists "members delete owners or self" on public.trip_members;
create policy "members delete owners or self" on public.trip_members for delete to authenticated using (public.is_trip_owner(trip_id) or user_id = auth.uid());

-- Shared trip data: members can read/write. Owner-only administration is above.
drop policy if exists "expenses members read" on public.expenses;
create policy "expenses members read" on public.expenses for select to authenticated using (public.is_trip_member(trip_id));
drop policy if exists "expenses members add" on public.expenses;
create policy "expenses members add" on public.expenses for insert to authenticated with check (public.is_trip_member(trip_id));
drop policy if exists "expenses members update" on public.expenses;
create policy "expenses members update" on public.expenses for update to authenticated using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));
drop policy if exists "expenses members delete" on public.expenses;
create policy "expenses members delete" on public.expenses for delete to authenticated using (public.is_trip_member(trip_id));

drop policy if exists "activities members read" on public.activities;
create policy "activities members read" on public.activities for select to authenticated using (public.is_trip_member(trip_id));
drop policy if exists "activities members add" on public.activities;
create policy "activities members add" on public.activities for insert to authenticated with check (public.is_trip_member(trip_id));
drop policy if exists "activities members update" on public.activities;
create policy "activities members update" on public.activities for update to authenticated using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));
drop policy if exists "activities members delete" on public.activities;
create policy "activities members delete" on public.activities for delete to authenticated using (public.is_trip_member(trip_id));

drop policy if exists "packing members read" on public.packing_items;
create policy "packing members read" on public.packing_items for select to authenticated using (public.is_trip_member(trip_id));
drop policy if exists "packing members add" on public.packing_items;
create policy "packing members add" on public.packing_items for insert to authenticated with check (public.is_trip_member(trip_id));
drop policy if exists "packing members update" on public.packing_items;
create policy "packing members update" on public.packing_items for update to authenticated using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));
drop policy if exists "packing members delete" on public.packing_items;
create policy "packing members delete" on public.packing_items for delete to authenticated using (public.is_trip_member(trip_id));

drop policy if exists "groups members read" on public.trip_groups;
create policy "groups members read" on public.trip_groups for select to authenticated using (public.is_trip_member(trip_id));
drop policy if exists "groups members add" on public.trip_groups;
create policy "groups members add" on public.trip_groups for insert to authenticated with check (public.is_trip_member(trip_id));
drop policy if exists "groups members update" on public.trip_groups;
create policy "groups members update" on public.trip_groups for update to authenticated using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));
drop policy if exists "groups members delete" on public.trip_groups;
create policy "groups members delete" on public.trip_groups for delete to authenticated using (public.is_trip_member(trip_id));

drop policy if exists "group members read" on public.group_members;
create policy "group members read" on public.group_members for select to authenticated using (
  exists(select 1 from public.trip_groups g where g.id = group_id and public.is_trip_member(g.trip_id))
);
drop policy if exists "group members add" on public.group_members;
create policy "group members add" on public.group_members for insert to authenticated with check (
  exists(select 1 from public.trip_groups g where g.id = group_id and public.is_trip_member(g.trip_id))
);
drop policy if exists "group members update" on public.group_members;
create policy "group members update" on public.group_members for update to authenticated using (
  exists(select 1 from public.trip_groups g where g.id = group_id and public.is_trip_member(g.trip_id))
) with check (
  exists(select 1 from public.trip_groups g where g.id = group_id and public.is_trip_member(g.trip_id))
);
drop policy if exists "group members delete" on public.group_members;
create policy "group members delete" on public.group_members for delete to authenticated using (
  exists(select 1 from public.trip_groups g where g.id = group_id and public.is_trip_member(g.trip_id))
);

-- Keep profiles in sync with Supabase Auth metadata.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles(id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- NOTE: RLS lets a trip owner add members. This starter's UI adds participants by name
-- without an auth account; for true multi-account invitations, implement invite flow
-- via Supabase Edge Function and email verification before linking user_id.
