-- TERANGAEATS ORDER STATUS HARDENING
-- Run after 0003_production_hardening.sql.
-- Safe to re-run.

create or replace function public.validate_order_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_status text := coalesce(old.order_status, 'pending');
  new_status text := coalesce(new.order_status, old_status);
  valid_transition boolean := false;
begin
  if tg_op <> 'UPDATE' or old.order_status is not distinct from new.order_status then
    return new;
  end if;

  valid_transition := case old_status
    when 'pending' then new_status in ('accepted', 'cancelled')
    when 'accepted' then new_status in ('preparing', 'cancelled')
    when 'preparing' then new_status in ('ready', 'cancelled')
    when 'ready' then new_status in ('assigned', 'cancelled')
    when 'assigned' then new_status in ('picked_up', 'cancelled')
    when 'picked_up' then new_status in ('delivering', 'cancelled')
    when 'delivering' then new_status in ('driver_arrived', 'cancelled')
    when 'driver_arrived' then new_status in ('delivered', 'cancelled')
    when 'delivered' then false
    when 'cancelled' then false
    else false
  end;

  if not valid_transition then
    raise exception using
      errcode = '22023',
      message = format('Invalid order status transition: %s -> %s', old_status, new_status);
  end if;

  if new_status = 'delivered' then
    new.delivered_at := coalesce(new.delivered_at, now());
  elsif new_status <> 'delivered' then
    -- Do not allow a stale delivered timestamp on an active/cancelled order.
    new.delivered_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_validate_status_transition on public.orders;
create trigger orders_validate_status_transition
before update of order_status on public.orders
for each row
execute function public.validate_order_status_transition();

-- Keep the status-history array aligned with the persisted order status.
create or replace function public.append_order_status_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  history jsonb;
  last_entry jsonb;
  last_status text;
begin
  if tg_op <> 'UPDATE' or old.order_status is not distinct from new.order_status then
    return new;
  end if;

  history := case
    when jsonb_typeof(new.status_history) = 'array' then new.status_history
    else '[]'::jsonb
  end;

  last_entry := case
    when jsonb_array_length(history) > 0 then history -> (jsonb_array_length(history) - 1)
    else null
  end;
  last_status := case when last_entry is null then null else last_entry ->> 'status' end;

  if last_status is distinct from new.order_status then
    new.status_history := history || jsonb_build_array(jsonb_build_object(
      'status', new.order_status,
      'timestamp', now(),
      'noteFR', 'Statut mis à jour.',
      'noteEN', 'Status updated.'
    ));
  end if;

  return new;
end;
$$;

drop trigger if exists orders_append_status_history on public.orders;
create trigger orders_append_status_history
before update of order_status on public.orders
for each row
execute function public.append_order_status_history();

revoke all on function public.validate_order_status_transition() from public, anon, authenticated;
revoke all on function public.append_order_status_history() from public, anon, authenticated;

-- service_role is the server-side application role and remains able to update orders.
grant execute on function public.validate_order_status_transition() to service_role;
grant execute on function public.append_order_status_history() to service_role;
