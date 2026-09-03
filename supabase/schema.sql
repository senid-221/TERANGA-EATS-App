-- ============================================================
-- TERANGAEATS — COMPLETE PRODUCTION SUPABASE DATABASE
-- ============================================================
-- Run this file once in Supabase SQL Editor.
-- Safe to re-run: tables, indexes, triggers and policies use IF EXISTS patterns.
-- Money is stored as integer FCFA/CFA-style units.
-- Admin authentication is handled by the application server cookie, not Clerk.
-- The Supabase service-role key must remain server-side only.

create extension if not exists pgcrypto;

-- ============================================================
-- UPDATED_AT FUNCTION
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
-- ORDER TOTAL VALIDATION FUNCTION
-- Must exist BEFORE the orders RLS policy references it.
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
  min_order integer not null default 500 check (min_order >= 0),
  address text not null default '',
  neighborhood text not null default '',
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

alter table public.restaurants add column if not exists description_fr text not null default '';
alter table public.restaurants add column if not exists description_en text not null default '';
alter table public.restaurants add column if not exists cuisine text not null default '';
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
-- PRODUCTS
-- ============================================================
create table if not exists public.products (
  id text primary key,
  restaurant_id text references public.restaurants(id) on update cascade on delete restrict,
  restaurant_name text not null default '',
  category_id text references public.categories(id) on update cascade on delete set null,
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
alter table public.products add column if not exists name text not null default '';
alter table public.products add column if not exists name_fr text not null default '';
alter table public.products add column if not exists name_en text not null default '';
alter table public.products add column if not exists description text not null default '';
alter table public.products add column if not exists description_fr text not null default '';
alter table public.products add column if not exists description_en text not null default '';
alter table public.products add column if not exists original_price integer;
alter table public.products add column if not exists rating numeric(3,2) not null default 4.9;
alter table public.products add column if not exists review_count integer not null default 0;
alter table public.products add column if not exists prep_time_minutes integer not null default 20;
alter table public.products add column if not exists preparation_time text not null default '15-20 min';
alter table public.products add column if not exists is_popular boolean not null default false;
alter table public.products add column if not exists is_signature boolean not null default false;
alter table public.products add column if not exists ingredients_fr jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists ingredients_en jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists options jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists updated_at timestamptz not null default now();

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
-- CUSTOMER / STAFF PROFILES
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
  customer_email text,
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

alter table public.orders add column if not exists customer_email text;
alter table public.orders add column if not exists estimated_delivery_time text not null default '25–35 min';
alter table public.orders add column if not exists updated_at timestamptz not null default now();

create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_restaurant_id_idx on public.orders(restaurant_id);
create index if not exists orders_status_idx on public.orders(order_status);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_customer_phone_idx on public.orders(customer_phone);

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
-- TRIGGERS
-- ============================================================
drop trigger if exists restaurants_set_updated_at on public.restaurants;
create trigger restaurants_set_updated_at before update on public.restaurants for each row execute function public.set_updated_at();

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at before update on public.categories for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();

drop trigger if exists promotions_set_updated_at on public.promotions;
create trigger promotions_set_updated_at before update on public.promotions for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders for each row execute function public.set_updated_at();

drop trigger if exists table_bookings_set_updated_at on public.table_bookings;
create trigger table_bookings_set_updated_at before update on public.table_bookings for each row execute function public.set_updated_at();

-- ============================================================
-- RLS
-- ============================================================
alter table public.restaurants enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.promotions enable row level security;
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.table_bookings enable row level security;

do $$
declare r record;
begin
  for r in select tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('restaurants','categories','products','promotions','profiles','orders','table_bookings')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

create policy restaurants_public_read on public.restaurants
for select to anon, authenticated using (true);

create policy categories_public_read on public.categories
for select to anon, authenticated using (true);

create policy products_public_read on public.products
for select to anon, authenticated using (true);

create policy promotions_public_read on public.promotions
for select to anon, authenticated
using (is_active = true and (valid_until is null or valid_until >= now()));

create policy orders_public_insert on public.orders
for insert to anon, authenticated
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

create policy bookings_public_insert on public.table_bookings
for insert to anon, authenticated
with check (
  id is not null
  and user_id is not null
  and restaurant_id is not null
  and customer_name <> ''
  and customer_phone <> ''
  and guests between 1 and 100
);

-- Profiles, order reads/updates/deletes and booking reads/updates/deletes remain
-- server-only. The application server uses the Supabase service-role key.

-- ============================================================
-- REALTIME
-- ============================================================
do $$
begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null;
end $$;

-- ============================================================
-- TERANGA RESTAURANT
-- ============================================================
insert into public.restaurants (
  id, name, description_fr, description_en, cuisine, cuisine_types, tags,
  rating, review_count, delivery_time, estimated_delivery_time, delivery_fee,
  min_order, address, neighborhood, is_halal, is_partner, is_open, is_featured
)
values (
  'teranga-restaurant',
  'TerangaRestaurant',
  'Cuisine sénégalaise et plats populaires d’Afrique de l’Ouest.',
  'Senegalese cuisine and popular West African dishes.',
  'Sénégalaise',
  '["Senegalese","West African"]'::jsonb,
  '["Halal","Popular","Delivery"]'::jsonb,
  4.8, 0, '20–30 min', '20–30 min', 500, 500,
  '', '', true, true, true, true
)
on conflict (id) do update set
  name = excluded.name,
  description_fr = excluded.description_fr,
  description_en = excluded.description_en,
  cuisine = excluded.cuisine,
  cuisine_types = excluded.cuisine_types,
  tags = excluded.tags,
  delivery_time = excluded.delivery_time,
  estimated_delivery_time = excluded.estimated_delivery_time,
  delivery_fee = excluded.delivery_fee,
  min_order = excluded.min_order,
  is_halal = excluded.is_halal,
  is_partner = excluded.is_partner,
  is_open = excluded.is_open,
  is_featured = excluded.is_featured;

-- ============================================================
-- CATEGORIES
-- ============================================================
insert into public.categories (id, name_fr, name_en, icon_name, sort_order)
values
  ('cat-plats', 'Plats', 'Main Dishes', 'Utensils', 1),
  ('cat-grillades', 'Grillades', 'Grilled', 'Flame', 2),
  ('cat-snacks', 'Snacks', 'Snacks', 'Sandwich', 3),
  ('cat-boissons', 'Boissons', 'Drinks', 'CupSoda', 4),
  ('cat-accompagnements', 'Accompagnements', 'Sides', 'Soup', 5)
on conflict (id) do update set
  name_fr = excluded.name_fr,
  name_en = excluded.name_en,
  icon_name = excluded.icon_name,
  sort_order = excluded.sort_order;

-- ============================================================
-- 10 STARTER PRODUCTS — PRICES 500–1500 FCFA
-- ============================================================
insert into public.products (
  id, restaurant_id, restaurant_name, category_id,
  name, name_fr, name_en, description, description_fr, description_en,
  image_url, price, available, rating, review_count, prep_time_minutes,
  preparation_time, is_spicy, is_popular, is_signature, is_vegetarian,
  ingredients_fr, ingredients_en
)
values
(
  'prod-jollof-poulet', 'teranga-restaurant', 'TerangaRestaurant', 'cat-plats',
  'Jollof Rice au Poulet', 'Jollof Rice au Poulet', 'Chicken Jollof Rice',
  'Riz jollof parfumé servi avec poulet tendre.',
  'Riz jollof parfumé servi avec poulet tendre.',
  'Fragrant jollof rice served with tender chicken.',
  'https://images.unsplash.com/photo-1664992960082-0ea299a9c53e?auto=format&fit=crop&w=900&q=85',
  1500, true, 4.9, 0, 20, '20 min', false, true, true, false,
  '["Riz","Poulet","Tomate","Oignon","Épices"]'::jsonb,
  '["Rice","Chicken","Tomato","Onion","Spices"]'::jsonb
),
(
  'prod-yassa-poulet', 'teranga-restaurant', 'TerangaRestaurant', 'cat-plats',
  'Yassa Poulet', 'Yassa Poulet', 'Chicken Yassa',
  'Poulet mariné aux oignons et citron.',
  'Poulet mariné aux oignons et citron.',
  'Chicken marinated with onions and lemon.',
  'https://images.unsplash.com/photo-1665400808116-f0e6339b7e9a?auto=format&fit=crop&w=900&q=85',
  1500, true, 4.9, 0, 25, '25 min', false, true, true, false,
  '["Poulet","Oignon","Citron","Moutarde","Épices"]'::jsonb,
  '["Chicken","Onion","Lemon","Mustard","Spices"]'::jsonb
),
(
  'prod-thieboudienne', 'teranga-restaurant', 'TerangaRestaurant', 'cat-plats',
  'Thiéboudienne au Poisson', 'Thiéboudienne au Poisson', 'Senegalese Fish Rice',
  'Riz au poisson et légumes façon sénégalaise.',
  'Riz au poisson et légumes façon sénégalaise.',
  'Senegalese-style fish rice with vegetables.',
  'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=85',
  1500, true, 4.8, 0, 25, '25 min', false, true, true, false,
  '["Poisson","Riz","Carotte","Chou","Tomate"]'::jsonb,
  '["Fish","Rice","Carrot","Cabbage","Tomato"]'::jsonb
),
(
  'prod-mafe-poulet', 'teranga-restaurant', 'TerangaRestaurant', 'cat-plats',
  'Mafé au Poulet', 'Mafé au Poulet', 'Chicken Mafe',
  'Poulet mijoté dans une sauce crémeuse aux arachides.',
  'Poulet mijoté dans une sauce crémeuse aux arachides.',
  'Chicken simmered in a rich peanut sauce.',
  'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=900&q=85',
  1400, true, 4.8, 0, 25, '25 min', false, false, true, false,
  '["Poulet","Arachide","Tomate","Oignon","Riz"]'::jsonb,
  '["Chicken","Peanut","Tomato","Onion","Rice"]'::jsonb
),
(
  'prod-poisson-grille', 'teranga-restaurant', 'TerangaRestaurant', 'cat-grillades',
  'Poisson Grillé', 'Poisson Grillé', 'Grilled Fish',
  'Poisson grillé avec assaisonnement maison.',
  'Poisson grillé avec assaisonnement maison.',
  'Grilled fish with house seasoning.',
  'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=900&q=85',
  1500, true, 4.8, 0, 20, '20 min', false, false, false, false,
  '["Poisson","Citron","Ail","Épices"]'::jsonb,
  '["Fish","Lemon","Garlic","Spices"]'::jsonb
),
(
  'prod-poulet-braise', 'teranga-restaurant', 'TerangaRestaurant', 'cat-grillades',
  'Poulet Braisé', 'Poulet Braisé', 'Grilled Chicken',
  'Poulet braisé et mariné aux épices.',
  'Poulet braisé et mariné aux épices.',
  'Char-grilled chicken marinated with spices.',
  'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=900&q=85',
  1500, true, 4.9, 0, 25, '25 min', false, true, false, false,
  '["Poulet","Oignon","Ail","Paprika","Épices"]'::jsonb,
  '["Chicken","Onion","Garlic","Paprika","Spices"]'::jsonb
),
(
  'prod-samosa-viande', 'teranga-restaurant', 'TerangaRestaurant', 'cat-snacks',
  'Samosa Viande', 'Samosa Viande', 'Beef Samosa',
  'Samosa croustillant farci à la viande épicée.',
  'Samosa croustillant farci à la viande épicée.',
  'Crispy samosa filled with seasoned meat.',
  'https://images.unsplash.com/photo-1572099107898-46f22b3af4f9?auto=format&fit=crop&w=900&q=85',
  800, true, 4.7, 0, 10, '10 min', false, false, false, false,
  '["Pâte","Viande","Oignon","Épices"]'::jsonb,
  '["Pastry","Beef","Onion","Spices"]'::jsonb
),
(
  'prod-frites-maison', 'teranga-restaurant', 'TerangaRestaurant', 'cat-accompagnements',
  'Frites Maison', 'Frites Maison', 'Homemade Fries',
  'Frites croustillantes préparées maison.',
  'Frites croustillantes préparées maison.',
  'Crispy homemade French fries.',
  'https://images.unsplash.com/photo-1529259266118-cf22737f713f?auto=format&fit=crop&w=900&q=85',
  700, true, 4.7, 0, 10, '10 min', false, false, false, true,
  '["Pomme de terre","Huile","Sel"]'::jsonb,
  '["Potato","Oil","Salt"]'::jsonb
),
(
  'prod-burger-poulet', 'teranga-restaurant', 'TerangaRestaurant', 'cat-snacks',
  'Burger Poulet', 'Burger Poulet', 'Chicken Burger',
  'Burger au poulet avec légumes frais et sauce maison.',
  'Burger au poulet avec légumes frais et sauce maison.',
  'Chicken burger with fresh vegetables and house sauce.',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58ab?auto=format&fit=crop&w=900&q=85',
  1500, true, 4.8, 0, 15, '15 min', false, true, false, false,
  '["Pain","Poulet","Laitue","Tomate","Sauce"]'::jsonb,
  '["Bun","Chicken","Lettuce","Tomato","Sauce"]'::jsonb
),
(
  'prod-bissap', 'teranga-restaurant', 'TerangaRestaurant', 'cat-boissons',
  'Jus de Bissap', 'Jus de Bissap', 'Hibiscus Juice',
  'Boisson fraîche à base de fleurs d’hibiscus.',
  'Boisson fraîche à base de fleurs d’hibiscus.',
  'Refreshing drink made from hibiscus flowers.',
  'https://images.unsplash.com/photo-1599390719602-2874f553a716?auto=format&fit=crop&w=900&q=85',
  500, true, 4.8, 0, 5, '5 min', false, true, false, true,
  '["Bissap","Sucre","Eau","Citron"]'::jsonb,
  '["Hibiscus","Sugar","Water","Lemon"]'::jsonb
)
on conflict (id) do update set
  restaurant_id = excluded.restaurant_id,
  restaurant_name = excluded.restaurant_name,
  category_id = excluded.category_id,
  name = excluded.name,
  name_fr = excluded.name_fr,
  name_en = excluded.name_en,
  description = excluded.description,
  description_fr = excluded.description_fr,
  description_en = excluded.description_en,
  image_url = excluded.image_url,
  price = excluded.price,
  prep_time_minutes = excluded.prep_time_minutes,
  preparation_time = excluded.preparation_time,
  is_popular = excluded.is_popular,
  is_signature = excluded.is_signature,
  is_vegetarian = excluded.is_vegetarian,
  ingredients_fr = excluded.ingredients_fr,
  ingredients_en = excluded.ingredients_en,
  updated_at = now();

-- Keep category dish counts synchronized with the actual product catalog.
update public.categories c
set dish_count = (
  select count(*) from public.products p where p.category_id = c.id
), updated_at = now();

-- ============================================================
-- FINAL NOTES
-- ============================================================
-- 1. Public catalog: SELECT restaurants/categories/products/promotions.
-- 2. Public checkout: INSERT orders only.
-- 3. Public table reservation: INSERT table_bookings only.
-- 4. Admin reads/writes happen through the trusted Node server using
--    SUPABASE_SERVICE_ROLE_KEY and the server-side admin session cookie.
-- 5. Never place the service-role key in VITE_* variables.
-- 6. Customer location should be stored in orders.delivery_address as JSON,
--    including latitude/longitude when available, so the server can create
--    a Google Maps delivery link for WhatsApp notifications.
