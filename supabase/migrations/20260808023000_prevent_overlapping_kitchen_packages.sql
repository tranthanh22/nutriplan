-- Prevent a customer from creating overlapping schedules for the same package.
-- The transaction-scoped advisory lock also closes the double-click race where
-- two inserts arrive before either transaction has created its daily rows.

create or replace function public.prevent_overlapping_kitchen_package()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_package_days integer;
  v_existing_order_number text;
  v_existing_end_date date;
begin
  select case when offer.type = 'package' then offer.package_days else 1 end
  into v_package_days
  from public.kitchen_offers offer
  where offer.id = new.offer_id;

  if coalesce(v_package_days, 1) <= 1 then
    return new;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(new.user_id::text || ':' || new.offer_id::text, 0)
  );

  select existing.order_number, max(day.delivery_date)
  into v_existing_order_number, v_existing_end_date
  from public.kitchen_orders existing
  join public.daily_orders day on day.kitchen_order_id = existing.id
  where existing.user_id = new.user_id
    and existing.offer_id = new.offer_id
    and existing.status in ('paid', 'confirmed')
    and day.status in ('scheduled', 'accepted', 'preparing', 'out_for_delivery')
    and day.delivery_date between current_date
      and current_date + (v_package_days - 1)
  group by existing.id, existing.order_number
  order by max(day.delivery_date) desc
  limit 1;

  if v_existing_order_number is not null then
    raise exception 'overlapping_kitchen_package:%:%',
      v_existing_order_number,
      v_existing_end_date
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists kitchen_orders_prevent_overlapping_package
  on public.kitchen_orders;
create trigger kitchen_orders_prevent_overlapping_package
  before insert on public.kitchen_orders
  for each row execute function public.prevent_overlapping_kitchen_package();

revoke all on function public.prevent_overlapping_kitchen_package() from public;

