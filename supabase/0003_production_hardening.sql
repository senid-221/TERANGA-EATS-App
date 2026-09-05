-- TERANGAEATS PRODUCTION HARDENING
-- Run after schema.sql and driver_migration.sql.
-- Safe to re-run.

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

alter table public.orders add column if not exists driver_id text;
alter table public.orders add column if not exists idempotency_key text;
create index if not exists orders_driver_id_idx on public.orders(driver_id);
create unique index if not exists orders_idempotency_key_uidx
  on public.orders(idempotency_key)
  where idempotency_key is not null;

create table if not exists public.order_notifications (
  id bigserial primary key,
  order_id text not null references public.orders(id) on delete cascade,
  channel text not null check (channel in ('whatsapp')),
  event text not null check (event in ('new_order','driver_accepted')),
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  attempts integer not null default 0 check (attempts >= 0),
  provider_message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  unique(order_id, channel, event)
);

create index if not exists order_notifications_status_idx
  on public.order_notifications(status, updated_at);
create index if not exists order_notifications_order_idx
  on public.order_notifications(order_id);

drop trigger if exists drivers_set_updated_at on public.drivers;
create trigger drivers_set_updated_at before update on public.drivers
for each row execute function public.set_updated_at();

drop trigger if exists order_notifications_set_updated_at on public.order_notifications;
create trigger order_notifications_set_updated_at before update on public.order_notifications
for each row execute function public.set_updated_at();

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists app_settings_set_updated_at on public.app_settings;
create trigger app_settings_set_updated_at before update on public.app_settings
for each row execute function public.set_updated_at();

insert into public.app_settings(key, value)
values
  ('app_name', '{"value":"TerangaEats"}'::jsonb),
  ('admin_whatsapp', '{"value":"+250726969060"}'::jsonb),
  ('default_currency', '{"value":"FCFA"}'::jsonb)
on conflict (key) do nothing;

alter table public.drivers enable row level security;
alter table public.order_notifications enable row level security;
alter table public.app_settings enable row level security;

revoke all on table public.drivers from anon, authenticated;
revoke all on table public.order_notifications from anon, authenticated;
revoke all on table public.app_settings from anon, authenticated;
revoke all on sequence public.order_notifications_id_seq from anon, authenticated;

-- These objects are server-only. service_role bypasses RLS.
