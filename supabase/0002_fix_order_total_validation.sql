-- TERANGAEATS — Fix order RLS validation function ordering
-- Run this after supabase/schema.sql if the main schema was already installed.
-- This migration is safe to run repeatedly.

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

drop policy if exists orders_public_insert on public.orders;

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
