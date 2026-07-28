create unique index if not exists kitchen_orders_user_idempotency_idx
  on public.kitchen_orders (
    user_id,
    ((policy_snapshot ->> 'idempotency_key'))
  )
  where policy_snapshot ? 'idempotency_key';

create or replace function public.create_mock_kitchen_order_schedule(
  p_user_id uuid,
  p_offer_code text,
  p_recipient_name text,
  p_recipient_phone text,
  p_delivery_address jsonb,
  p_delivery_note text,
  p_idempotency_key text,
  p_quantity integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_offer public.kitchen_offers%rowtype;
  v_order public.kitchen_orders%rowtype;
  v_days integer;
begin
  if
    p_user_id is null
    or nullif(btrim(p_offer_code), '') is null
    or nullif(btrim(p_recipient_name), '') is null
    or nullif(btrim(p_recipient_phone), '') is null
    or nullif(btrim(p_idempotency_key), '') is null
    or jsonb_typeof(p_delivery_address) <> 'object'
    or p_quantity not between 1 and 20
  then
    raise exception 'invalid_kitchen_order_input';
  end if;

  select *
  into v_order
  from public.kitchen_orders ko
  where ko.user_id = p_user_id
    and ko.policy_snapshot ->> 'idempotency_key' = p_idempotency_key
  limit 1;

  if found then
    return jsonb_build_object(
      'id', v_order.id,
      'orderNumber', v_order.order_number,
      'status', v_order.status,
      'duplicate', true
    );
  end if;

  select *
  into v_offer
  from public.kitchen_offers ko
  where ko.code = p_offer_code
    and ko.status = 'active'
    and (ko.available_from is null or ko.available_from <= current_date)
    and (ko.available_until is null or ko.available_until >= current_date)
  limit 1;

  if not found then
    raise exception 'kitchen_offer_not_available';
  end if;

  v_days := case
    when v_offer.type = 'single_meal' then 1
    else v_offer.package_days
  end;

  insert into public.kitchen_orders (
    order_number,
    user_id,
    kitchen_id,
    offer_id,
    status,
    recipient_name,
    recipient_phone,
    delivery_address,
    delivery_note,
    subtotal_amount,
    delivery_fee,
    discount_amount,
    total_amount,
    currency,
    policy_snapshot,
    paid_at
  )
  values (
    'NP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
    p_user_id,
    v_offer.kitchen_id,
    v_offer.id,
    'confirmed',
    btrim(p_recipient_name),
    btrim(p_recipient_phone),
    p_delivery_address,
    nullif(btrim(p_delivery_note), ''),
    v_offer.price_amount * p_quantity,
    v_offer.delivery_fee,
    0,
    v_offer.price_amount * p_quantity + v_offer.delivery_fee,
    v_offer.currency,
    jsonb_build_object(
      'idempotency_key', p_idempotency_key,
      'payment_mode', 'mvp_mock',
      'offer_code', v_offer.code
    ),
    now()
  )
  returning * into v_order;

  insert into public.kitchen_order_items (
    kitchen_order_id,
    offer_id,
    item_name,
    item_type,
    quantity,
    unit_price,
    total_price,
    item_snapshot
  )
  values (
    v_order.id,
    v_offer.id,
    v_offer.name,
    v_offer.type,
    p_quantity,
    v_offer.price_amount,
    v_offer.price_amount * p_quantity,
    jsonb_build_object(
      'offer_code', v_offer.code,
      'package_days', v_days,
      'meals_per_day', v_offer.meals_per_day,
      'calories_kcal', v_offer.calories_kcal,
      'protein_g', v_offer.protein_g,
      'carbs_g', v_offer.carbs_g,
      'fat_g', v_offer.fat_g
    )
  );

  insert into public.daily_orders (
    kitchen_order_id,
    kitchen_id,
    user_id,
    delivery_date,
    meal_type,
    delivery_window_start,
    delivery_window_end,
    status
  )
  select
    v_order.id,
    v_offer.kitchen_id,
    p_user_id,
    current_date + days.day_offset,
    slots.meal_type,
    case slots.meal_type
      when 'breakfast'::public.meal_type then time '07:00'
      when 'lunch'::public.meal_type then time '11:30'
      else time '18:00'
    end,
    case slots.meal_type
      when 'breakfast'::public.meal_type then time '08:00'
      when 'lunch'::public.meal_type then time '12:30'
      else time '19:00'
    end,
    'scheduled'
  from generate_series(0, v_days - 1) as days(day_offset)
  cross join lateral (
    select slot.meal_type
    from (
      values
        (1, 'breakfast'::public.meal_type),
        (2, 'lunch'::public.meal_type),
        (3, 'dinner'::public.meal_type)
    ) as slot(position, meal_type)
    where
      (v_offer.meals_per_day = 1 and slot.position = 2)
      or (v_offer.meals_per_day = 2 and slot.position in (2, 3))
      or (v_offer.meals_per_day >= 3 and slot.position <= v_offer.meals_per_day)
  ) slots;

  insert into public.daily_order_items (
    daily_order_id,
    dish_name,
    servings,
    calories_kcal,
    protein_g,
    carbs_g,
    fat_g
  )
  select
    dor.id,
    coalesce(
      v_offer.menu_highlights[
        mod(
          (dor.delivery_date - current_date) * v_offer.meals_per_day
            + case dor.meal_type
                when 'breakfast'::public.meal_type then 0
                when 'lunch'::public.meal_type then 1
                else 2
              end,
          greatest(cardinality(v_offer.menu_highlights), 1)
        ) + 1
      ],
      v_offer.name
    ),
    p_quantity,
    round(
      coalesce(v_offer.calories_kcal, 0) * p_quantity / v_offer.meals_per_day,
      2
    ),
    round(
      coalesce(v_offer.protein_g, 0) * p_quantity / v_offer.meals_per_day,
      2
    ),
    round(
      coalesce(v_offer.carbs_g, 0) * p_quantity / v_offer.meals_per_day,
      2
    ),
    round(
      coalesce(v_offer.fat_g, 0) * p_quantity / v_offer.meals_per_day,
      2
    )
  from public.daily_orders dor
  where dor.kitchen_order_id = v_order.id;

  return jsonb_build_object(
    'id', v_order.id,
    'orderNumber', v_order.order_number,
    'status', v_order.status,
    'scheduledMeals', (
      select count(*)
      from public.daily_orders dor
      where dor.kitchen_order_id = v_order.id
    ),
    'duplicate', false
  );
end;
$$;

revoke all on function public.create_mock_kitchen_order_schedule(
  uuid, text, text, text, jsonb, text, text, integer
) from public, anon, authenticated;

grant execute on function public.create_mock_kitchen_order_schedule(
  uuid, text, text, text, jsonb, text, text, integer
) to service_role;
