-- Guest checkout must work without customer accounts/login.
-- The orders table keeps user_id NOT NULL, so normalize missing guest ids at the DB boundary.

create or replace function public.ensure_guest_order_user_id()
returns trigger
language plpgsql
as $$
begin
  if nullif(trim(new.user_id), '') is null then
    new.user_id := 'guest-' || gen_random_uuid()::text;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_ensure_guest_user_id on public.orders;

create trigger orders_ensure_guest_user_id
before insert on public.orders
for each row
execute function public.ensure_guest_order_user_id();
