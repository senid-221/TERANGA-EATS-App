-- Restore production order idempotency protection.
-- Safe to run even if the column/index already exists.

alter table public.orders
  add column if not exists idempotency_key text;

create unique index if not exists orders_idempotency_key_uidx
  on public.orders(idempotency_key)
  where idempotency_key is not null;

create index if not exists orders_idempotency_key_idx
  on public.orders(idempotency_key)
  where idempotency_key is not null;
