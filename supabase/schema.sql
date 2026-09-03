-- ============================================================
-- TERANGAEATS — COMPLETE SUPABASE DATABASE
-- ============================================================
-- Run in Supabase SQL Editor.
-- This migration is intentionally idempotent where practical.
-- Currency amounts are stored as integer FCFA/CFA-style units.
-- The application currently uses Clerk IDs as TEXT, not Supabase auth UUIDs.
--
-- SECURITY ARCHITECTURE:
-- * Public users may READ the food catalog.
-- * Public users may CREATE an order/booking because the current app uses Clerk
--   on the frontend and has not yet mapped Clerk JWTs into Supabase Auth.
-- * Public users CANNOT read/update/delete orders or bookings through these policies.
-- * Admin CRUD/status changes must use the trusted server/service-role path after
--   Clerk server-token verification is added.
-- * Never expose SUPABASE_SERVICE_ROLE_KEY in VITE_* variables.

create extension if not exists pgcrypto;

-- ============================================================
-- COMMON TRIGGER
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- RESTAURANTS
-- ============================================================
create table if not exists public.restaurants (
  id text primary key,
  name text not null,
  description_fr text not null default '',
  description_en text not null default '',
  cuisine text not null default '',
  cuisine_types jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  rating numeric(3,2) not null default 4.8 check (rating between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  delivery_time text not null default '25–35 min',
  estimated_delivery_time text not null default '25–35 min',
  delivery_fee integer not null default 500 check (delivery_fee >= 0),
  min_order integer not null default 2000 check (min_order >= 0),
  address text not null default '',
  neighborhood text not null default 'Dakar Plateau',
  latitude numeric(10,7),
  longitude numeric(10,7),
  phone text not null default '',
  cover_image_url text,
  logo_url text,
  is_halal boolean not null default true,
  is_popular boolean not null default false,
  is_promoted boolean not null default false,
  is_partner boolean not null default true,
  is_open boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add newer app fields to an older existing installation.
alter table public.restaurants add column if not exists description_fr text not null default '';
alter table public.restaurants add column if not exists description_en text not null default '';
alter table public.restaurants add column if not exists cuisine_types jsonb not null default '[]'::jsonb;
alter table public.restaurants add column if not exists tags jsonb not null default '[]'::jsonb;
alter table public.restaurants add column if not exists estimated_delivery_time text not null default '25–35 min';
alter table public.restaurants add column if not exists is_open boolean not null default true;
alter table public.restaurants add column if not exists is_featured boolean not null default false;
alter table public.restaurants add column if not exists updated_at timestamptz not null default now();

-- ============================================================
-- CATEGORIES
-- ============================================================
create table if not exists public.categories (
  id text primary key,
  name_fr text not null,
  name_en text not null,
  image_url text,
  icon_name text,
  sort_order integer not null default 0,
  dish_count integer not null default 0 check (dish_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- PRODUCTS / DISHES
-- ============================================================
create table if not exists public.products (
  id text primary key,
  restaurant_id text references public.restaurants(id) on update cascade on delete restrict,
  restaurant_name text not null default '',
  category_id text,
  name text not null default '',
  name_fr text not null default '',
  name_en text not null default '',
  name_wo text,
  description text not null default '',
  description_fr text not null default '',
  description_en text not null default '',
  description_wo text,
  image_url text not null default '',
  price integer not null default 0 check (price >= 0),
  original_price integer check (original_price is null or original_price >= 0),
  available boolean not null default true,
  rating numeric(3,2) not null default 4.9 check (rating between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  prep_time_minutes integer not null default 20 check (prep_time_minutes >= 0),
  preparation_time text not null default '15-20 min',
  is_spicy boolean not null default false,
  is_popular boolean not null default false,
  is_signature boolean not null default false,
  is_vegetarian boolean not null default false,
  ingredients_fr jsonb not null default '[]'::jsonb,
  ingredients_en jsonb not null default '[]'::jsonb,
  options jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products add column if not exists restaurant_name text not null default '';
alter table public.products add column if not exists name_fr text not null default '';
alter table public.products add column if not exists name_en text not null default '';
alter table public.products add column if not exists description_fr text not null default '';
alter table public.products add column if not exists description_en text not null default '';
alter table public.products add column if not exists original_price integer;
alter table public.products add column if not exists rating numeric(3,2) not null default 4.9;
alter table public.products add column if not exists review_count integer not null default 0;
alter table public.products add column if not exists prep_time_minutes integer not null default 20;
alter table public.products add column if not exists is_popular boolean not null default false;
alter table public.products add column if not exists is_signature boolean not null default false;
alter table public.products add column if not exists ingredients_fr jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists ingredients_en jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists updated_at timestamptz not null default now();

-- Foreign key is added only when the old installation has no equivalent constraint.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'products_category_id_fkey'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_category_id_fkey
      foreign key (category_id) references public.categories(id)
      on update cascade on delete set null;
  end if;
exception when undefined_column then null;
end $$;

create index if not exists products_restaurant_id_idx on public.products(restaurant_id);
create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_available_idx on public.products(available);
create index if not exists products_popular_idx on public.products(is_popular);

-- ============================================================
-- PROMOTIONS
-- ============================================================
create table if not exists public.promotions (
  id text primary key,
  code text not null unique,
  title_fr text not null,
  title_en text not null,
  description_fr text not null default '',
  description_en text not null default '',
  image_url text,
  discount_type text not null default 'percentage' check (discount_type in ('percentage','fixed')),
  discount_value numeric(12,2) not null default 0 check (discount_value >= 0),
  min_order_value integer not null default 0 check (min_order_value >= 0),
  valid_until timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists promotions_active_idx on public.promotions(is_active, valid_until);

-- ============================================================
-- PROFILES / USERS
-- ============================================================
create table if not exists public.profiles (
  id text primary key,
  full_name text not null default '',
  email text,
  phone text,
  role text not null default 'customer' check (role in ('customer','restaurant','driver','admin')),
  language text not null default 'fr' check (language in ('fr','en')),
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);

-- ============================================================
-- ORDERS
-- ============================================================
create table if not exists public.orders (
  id text primary key,
  user_id text not null,
  customer_name text not null,
  customer_phone text not null,
  restaurant_id text not null references public.restaurants(id) on update cascade on delete restrict,
  restaurant_name text not null default '',
  restaurant_logo text,
  restaurant_phone text,
  restaurant_address text,
  driver jsonb,
  items jsonb not null default '[]'::jsonb,
  subtotal integer not null default 0 check (subtotal >= 0),
  delivery_fee integer not null default 0 check (delivery_fee >= 0),
  discount integer not null default 0 check (discount >= 0),
  promo_code text,
  total integer not null default 0 check (total >= 0),
  payment_method text not null default 'cash_on_delivery',
  payment_status text not null default 'pending',
  order_status text not null default 'pending',
  delivery_address jsonb not null default '{}'::jsonb,
  status_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  estimated_delivery_time text not null default '25–35 min',
  updated_at timestamptz not null default now()
);

alter table public.orders add column if not exists estimated_delivery_time text not null default '25–35 min';
alter table public.orders add column if not exists updated_at timestamptz not null default now();

create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_restaurant_id_idx on public.orders(restaurant_id);
create index if not exists orders_status_idx on public.orders(order_status);
create index if not exists orders_created_at_idx on public.orders(created_at desc);

-- ============================================================
-- TABLE BOOKINGS
-- ============================================================
create table if not exists public.table_bookings (
  id text primary key,
  user_id text not null,
  restaurant_id text not null references public.restaurants(id) on update cascade on delete restrict,
  restaurant_name text not null default '',
  restaurant_address text not null default '',
  restaurant_image text,
  restaurant_phone text,
  restaurant_neighborhood text,
  date text not null,
  time text not null,
  guests integer not null default 2 check (guests > 0 and guests <= 100),
  seating_area text not null default 'indoor_ac',
  special_requests text,
  occasion text,
  customer_name text not null default '',
  customer_phone text not null default '',
  customer_email text,
  confirmation_code text not null default '',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.table_bookings add column if not exists restaurant_neighborhood text;
alter table public.table_bookings add column if not exists occasion text;
alter table public.table_bookings add column if not exists updated_at timestamptz not null default now();

create index if not exists table_bookings_user_id_idx on public.table_bookings(user_id);
create index if not exists table_bookings_restaurant_id_idx on public.table_bookings(restaurant_id);
create index if not exists table_bookings_date_idx on public.table_bookings(date);
create index if not exists table_bookings_status_idx on public.table_bookings(status);

-- ============================================================
-- UPDATED-AT TRIGGERS
-- ============================================================
drop trigger if exists restaurants_set_updated_at on public.restaurants;
create trigger restaurants_set_updated_at before update on public.restaurants
for each row execute function public.set_updated_at();

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists promotions_set_updated_at on public.promotions;
create trigger promotions_set_updated_at before update on public.promotions
for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists table_bookings_set_updated_at on public.table_bookings;
create trigger table_bookings_set_updated_at before update on public.table_bookings
for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.restaurants enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.promotions enable row level security;
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.table_bookings enable row level security;

-- Remove the old insecure "USING (true) FOR ALL" policies if they exist.
do $$
declare r record;
begin
  for r in
    select tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('restaurants','categories','products','promotions','profiles','orders','table_bookings')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- PUBLIC CATALOG READ.
create policy restaurants_public_read
on public.restaurants for select to anon, authenticated
using (true);

create policy categories_public_read
on public.categories for select to anon, authenticated
using (true);

create policy products_public_read
on public.products for select to anon, authenticated
using (true);

create policy promotions_public_read
on public.promotions for select to anon, authenticated
using (is_active = true and (valid_until is null or valid_until >= now()));

-- ORDER CREATION ONLY.
-- No browser SELECT/UPDATE/DELETE policy is granted.
create policy orders_public_insert
on public.orders for insert to anon, authenticated
with check (
  id is not null
  and user_id is not null
  and customer_name <> ''
  and customer_phone <> ''
  and subtotal >= 0
  and delivery_fee >= 0
  and discount >= 0
  and total >= 0
  and public.order_total_is_valid(subtotal, delivery_fee, discount, total)
);

-- BOOKING CREATION ONLY.
create policy bookings_public_insert
on public.table_bookings for insert to anon, authenticated
with check (
  id is not null
  and user_id is not null
  and restaurant_id is not null
  and customer_name <> ''
  and customer_phone <> ''
  and guests between 1 and 100
);

-- Profiles remain closed to the browser until Clerk JWT -> Supabase identity
-- mapping is implemented. Trusted backend/service-role operations bypass RLS.

-- ============================================================
-- VALIDATION HELPERS
-- ============================================================
create or replace function public.order_total_is_valid(
  p_subtotal integer,
  p_delivery_fee integer,
  p_discount integer,
  p_total integer
)
returns boolean
language sql
immutable
as $$
  select p_subtotal >= 0
     and p_delivery_fee >= 0
     and p_discount >= 0
     and p_total = greatest(0, p_subtotal + p_delivery_fee - p_discount);
$$;

-- ============================================================
-- REALTIME FOR LIVE ADMIN ORDER MONITORING
-- ============================================================
do $$
begin
  alter publication supabase_realtime add table public.orders;
exception
  when duplicate_object then null;
end $$;

-- ============================================================
-- STARTER CATEGORIES
-- ============================================================
insert into public.categories (id, name_fr, name_en, icon_name, sort_order)
values
  ('cat-popular', 'Populaires', 'Popular', 'Flame', 1),
  ('cat-senegalais', 'Plats Sénégalais', 'Senegalese Dishes', 'Utensils', 2),
  ('cat-grillades', 'Grillades', 'Grilled', 'Beef', 3),
  ('cat-poissons', 'Poissons & Fruits de mer', 'Fish & Seafood', 'Fish', 4),
  ('cat-boissons', 'Boissons', 'Drinks', 'CupSoda', 5),
  ('cat-desserts', 'Desserts', 'Desserts', 'IceCream', 6)
on conflict (id) do nothing;

-- ============================================================
-- IMPORTANT NEXT SECURITY STEP
-- ============================================================
-- The SQL intentionally does NOT grant admin browser access. The next application
-- change must add a trusted server API that:
--   1) verifies the Clerk session/JWT,
--   2) checks the exact admin User ID or publicMetadata.role = 'admin',
--   3) uses the Supabase service-role key only on the server,
--   4) handles product CRUD and order-status updates,
--   5) sends WhatsApp notifications only after server-side authorization.
