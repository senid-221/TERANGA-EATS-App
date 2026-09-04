-- TERANGAEATS DRIVER SYSTEM
-- Run once in Supabase SQL Editor.

create table if not exists public.drivers (
  id text primary key,
  full_name text not null,
  phone text not null default '',
  email text,
  photo_url text,
  vehicle_type text not null default 'Moto',
  vehicle_plate text not null default '',
  password_hash text not null,
  rating numeric(3,2) not null default 5.0 check (rating between 0 and 5),
  total_deliveries integer not null default 0 check (total_deliveries >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists drivers_active_idx on public.drivers(active);
create index if not exists drivers_phone_idx on public.drivers(phone);

alter table public.orders add column if not exists driver_id text;
create index if not exists orders_driver_id_idx on public.orders(driver_id);

alter table public.drivers enable row level security;

create or replace function public.set_driver_on_order_assignment()
returns trigger language plpgsql as $$
begin
  if new.driver_id is not null then
    new.order_status = case when new.order_status in ('pending','accepted','preparing','ready') then 'assigned' else new.order_status end;
    new.driver = jsonb_build_object('id', new.driver_id);
  end if;
  return new;
end;
$$;

drop trigger if exists orders_driver_assignment on public.orders;
create trigger orders_driver_assignment before update of driver_id on public.orders
for each row execute function public.set_driver_on_order_assignment();
