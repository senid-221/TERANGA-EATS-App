-- Production payment state for Wave / Orange Money integrations.
-- Run in Supabase SQL Editor before enabling online payment providers.

alter table public.orders
  add column if not exists payment_provider text,
  add column if not exists payment_reference text,
  add column if not exists payment_checkout_url text,
  add column if not exists payment_error text;

create index if not exists orders_payment_reference_idx
  on public.orders(payment_reference)
  where payment_reference is not null;

create index if not exists orders_payment_provider_idx
  on public.orders(payment_provider)
  where payment_provider is not null;
