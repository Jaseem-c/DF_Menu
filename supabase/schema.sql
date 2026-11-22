-- Diet Factory digital menu: database schema, RLS policies and storage.
-- Run this whole file once in the Supabase SQL editor (safe to re-run).

------------------------------------------------------------------ tables

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 60),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sort_order  integer not null default 0,
  is_visible  boolean not null default true
);

create table if not exists public.menu_items (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name          text not null check (char_length(name) between 1 and 120),
  category      text not null references public.categories (slug)
                  on update cascade on delete restrict,
  description   text check (char_length(description) <= 500),
  price         integer not null check (price >= 0),   -- whole rupees (INR)
  image_url     text,
  ingredients   text[] not null default '{}',
  tags          text[] not null default '{}',
  allergens     text[] not null default '{}',
  serving_size  text check (char_length(serving_size) <= 60),
  -- Nutrition values are estimates; verify against IFCT or USDA FoodData Central.
  calories      integer      check (calories >= 0),
  protein       numeric(5,1) check (protein >= 0),
  carbs         numeric(5,1) check (carbs >= 0),
  fat           numeric(5,1) check (fat >= 0),
  fiber         numeric(5,1) check (fiber >= 0),
  sugar         numeric(5,1) check (sugar >= 0),
  is_available  boolean not null default true,
  is_popular    boolean not null default false,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists menu_items_category_sort_idx
  on public.menu_items (category, sort_order);

-- Single-row table (id is always 1).
create table if not exists public.settings (
  id                    integer primary key default 1 check (id = 1),
  business_name         text not null default 'Diet Factory',
  phone                 text,
  whatsapp_number       text,
  announcement_text     text check (char_length(announcement_text) <= 200),
  announcement_enabled  boolean not null default false
);

insert into public.settings (id) values (1) on conflict (id) do nothing;

-- Admin accounts. Users are created in Supabase Auth, then added here (see README).
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade
);

------------------------------------------------------------------ helpers

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists menu_items_set_updated_at on public.menu_items;
create trigger menu_items_set_updated_at
  before update on public.menu_items
  for each row execute function public.set_updated_at();

------------------------------------------------------------------ RLS

alter table public.categories  enable row level security;
alter table public.menu_items  enable row level security;
alter table public.settings    enable row level security;
alter table public.admin_users enable row level security;

-- Public (anon) can read menu data; sold-out items stay readable on purpose.
drop policy if exists "Public reads visible categories" on public.categories;
create policy "Public reads visible categories" on public.categories
  for select using (is_visible or public.is_admin());

drop policy if exists "Public reads menu items" on public.menu_items;
create policy "Public reads menu items" on public.menu_items
  for select using (true);

drop policy if exists "Public reads settings" on public.settings;
create policy "Public reads settings" on public.settings
  for select using (true);

-- Only admins can write.
drop policy if exists "Admins write categories" on public.categories;
create policy "Admins write categories" on public.categories
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins write menu items" on public.menu_items;
create policy "Admins write menu items" on public.menu_items
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins write settings" on public.settings;
create policy "Admins write settings" on public.settings
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- A signed-in user can only see their own admin row (used for the role check).
-- Nobody can write admin_users through the API; add admins with SQL (see README).
drop policy if exists "Users read own admin row" on public.admin_users;
create policy "Users read own admin row" on public.admin_users
  for select to authenticated
  using (user_id = (select auth.uid()));

------------------------------------------------------------------ storage

-- Public bucket for item images: 300 KB cap, images only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-images', 'menu-images', true, 307200,
        array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public buckets serve files by URL without a policy; these let admins manage them.
drop policy if exists "Admins read menu images" on storage.objects;
create policy "Admins read menu images" on storage.objects
  for select to authenticated
  using (bucket_id = 'menu-images' and public.is_admin());

drop policy if exists "Admins upload menu images" on storage.objects;
create policy "Admins upload menu images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'menu-images' and public.is_admin());

drop policy if exists "Admins update menu images" on storage.objects;
create policy "Admins update menu images" on storage.objects
  for update to authenticated
  using (bucket_id = 'menu-images' and public.is_admin());

drop policy if exists "Admins delete menu images" on storage.objects;
create policy "Admins delete menu images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'menu-images' and public.is_admin());
