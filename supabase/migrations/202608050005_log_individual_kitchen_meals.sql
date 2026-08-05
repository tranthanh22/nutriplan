alter table public.meal_log_entries
  add column if not exists daily_order_item_id uuid
    references public.daily_order_items(id) on delete set null;

update public.meal_log_entries mle
set daily_order_item_id = (
  select doi.id
  from public.daily_order_items doi
  where doi.daily_order_id = mle.daily_order_id
  order by doi.created_at, doi.id
  limit 1
)
where mle.source = 'kitchen'
  and mle.daily_order_id is not null
  and mle.daily_order_item_id is null
  and 1 = (
    select count(*)
    from public.daily_order_items doi
    where doi.daily_order_id = mle.daily_order_id
  );

drop index if exists public.meal_log_one_entry_per_delivered_order;

create unique index meal_log_one_entry_per_kitchen_item
  on public.meal_log_entries(daily_order_item_id)
  where source = 'kitchen' and daily_order_item_id is not null;

create index meal_log_entries_daily_order_item_idx
  on public.meal_log_entries(daily_order_item_id)
  where daily_order_item_id is not null;

alter table public.meal_log_entries
  drop constraint meal_log_entries_source_reference,
  add constraint meal_log_entries_source_reference check (
    (source <> 'recipe' or meal_plan_item_id is not null)
    and (
      source <> 'kitchen'
      or (daily_order_id is not null and daily_order_item_id is not null)
    )
  );

create function public.confirm_kitchen_meal_item_eaten(
  p_user_id uuid,
  p_daily_order_item_id uuid,
  p_consumed_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.daily_order_items%rowtype;
  v_order public.daily_orders%rowtype;
  v_log public.meal_log_entries%rowtype;
begin
  select doi.* into v_item
  from public.daily_order_items doi
  where doi.id = p_daily_order_item_id
  for update;

  if not found then
    raise exception 'daily_order_item_not_found';
  end if;

  select dor.* into v_order
  from public.daily_orders dor
  where dor.id = v_item.daily_order_id
    and dor.user_id = p_user_id
  for update;

  if not found then
    raise exception 'daily_order_item_not_found';
  end if;
  if v_order.status <> 'delivered' then
    raise exception 'kitchen_meal_not_delivered';
  end if;
  if not exists (
    select 1
    from public.subscriptions s
    where s.user_id = p_user_id
      and s.status in ('active', 'cancel_at_period_end')
      and s.current_period_end > now()
  ) then
    raise exception 'active_subscription_required';
  end if;

  select * into v_log
  from public.meal_log_entries mle
  where mle.source = 'kitchen'
    and mle.daily_order_item_id = v_item.id;

  if v_log.id is null then
    insert into public.meal_log_entries (
      user_id, source, consumed_at, meal_type, dish_id,
      daily_order_id, daily_order_item_id, name, servings,
      calories_kcal, protein_g, carbs_g, fat_g, is_user_confirmed
    )
    values (
      p_user_id, 'kitchen', p_consumed_at, v_order.meal_type, v_item.dish_id,
      v_order.id, v_item.id, v_item.dish_name, v_item.servings,
      v_item.calories_kcal, v_item.protein_g, v_item.carbs_g, v_item.fat_g, true
    )
    returning * into v_log;
  end if;

  return to_jsonb(v_log);
end;
$$;

revoke all on function public.confirm_kitchen_meal_item_eaten(uuid, uuid, timestamptz)
  from public, anon, authenticated;
grant execute on function public.confirm_kitchen_meal_item_eaten(uuid, uuid, timestamptz)
  to service_role;
