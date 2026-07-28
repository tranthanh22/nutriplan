create or replace function public.ensure_current_personal_meal_plan(p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan_id uuid;
  v_profile public.nutrition_profiles%rowtype;
begin
  select * into v_profile
  from public.nutrition_profiles np
  where np.user_id = p_user_id and np.is_current
  limit 1;

  if not found then
    raise exception 'nutrition_profile_required';
  end if;

  select mp.id into v_plan_id
  from public.meal_plans mp
  where mp.user_id = p_user_id
    and mp.status = 'active'
    and mp.nutrition_profile_id = v_profile.id
    and current_date between mp.start_date and mp.end_date
  order by mp.version desc
  limit 1;

  if v_plan_id is not null then
    return v_plan_id;
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

  update public.meal_plans
  set
    status = case
      when end_date < current_date then 'completed'::public.meal_plan_status
      else 'archived'::public.meal_plan_status
    end,
    updated_at = now()
  where user_id = p_user_id and status = 'active';

  insert into public.meal_plans (
    user_id,
    nutrition_profile_id,
    name,
    start_date,
    end_date,
    status,
    version,
    target_calories_kcal,
    target_protein_g,
    target_carbs_g,
    target_fat_g,
    generated_by
  )
  values (
    p_user_id,
    v_profile.id,
    'Kế hoạch cá nhân 7 ngày',
    current_date,
    current_date + 6,
    'active',
    coalesce(
      (
        select max(version) + 1
        from public.meal_plans
        where user_id = p_user_id
      ),
      1
    ),
    v_profile.target_calories_kcal,
    v_profile.target_protein_g,
    v_profile.target_carbs_g,
    v_profile.target_fat_g,
    'rule_based_nutrition_v2'
  )
  returning id into v_plan_id;

  with slots(day_offset, meal_type, sequence_no, calorie_share, rotation) as (
    select
      day_offset,
      'breakfast'::public.meal_type,
      1::smallint,
      0.25::numeric,
      day_offset
    from generate_series(0, 6) day_offset

    union all

    select
      day_offset,
      'lunch'::public.meal_type,
      1::smallint,
      0.40::numeric,
      day_offset + 1
    from generate_series(0, 6) day_offset

    union all

    select
      day_offset,
      'dinner'::public.meal_type,
      1::smallint,
      0.35::numeric,
      day_offset + 2
    from generate_series(0, 6) day_offset
  ),
  ranked_dishes as (
    select
      s.*,
      d.id as dish_id,
      dn.calories_kcal,
      dn.protein_g,
      dn.carbs_g,
      dn.fat_g,
      row_number() over (
        partition by s.day_offset, s.meal_type
        order by d.slug
      ) as dish_rank,
      count(*) over (
        partition by s.day_offset, s.meal_type
      ) as dish_count
    from slots s
    join public.dishes d
      on d.status = 'active'
      and d.meal_types @> array[s.meal_type]::public.meal_type[]
    join public.dish_nutrition dn on dn.dish_id = d.id
    where not exists (
      select 1
      from public.dish_allergens da
      join public.user_allergens ua
        on ua.allergen_id = da.allergen_id
        and ua.user_id = p_user_id
      where da.dish_id = d.id
    )
  ),
  selected as (
    select
      *,
      round(
        (v_profile.target_calories_kcal * calorie_share) / calories_kcal,
        2
      ) as plan_servings
    from ranked_dishes
    where dish_rank = mod(rotation, dish_count) + 1
  )
  insert into public.meal_plan_items (
    meal_plan_id,
    dish_id,
    planned_date,
    meal_type,
    sequence_no,
    servings,
    calories_kcal,
    protein_g,
    carbs_g,
    fat_g
  )
  select
    v_plan_id,
    dish_id,
    current_date + day_offset,
    meal_type,
    sequence_no,
    greatest(plan_servings, 0.1),
    round(calories_kcal * greatest(plan_servings, 0.1), 2),
    round(protein_g * greatest(plan_servings, 0.1), 2),
    round(carbs_g * greatest(plan_servings, 0.1), 2),
    round(fat_g * greatest(plan_servings, 0.1), 2)
  from selected;

  if (
    select count(*)
    from public.meal_plan_items
    where meal_plan_id = v_plan_id
  ) <> 21 then
    raise exception 'insufficient_safe_dishes';
  end if;

  return v_plan_id;
end;
$$;

revoke all on function public.ensure_current_personal_meal_plan(uuid)
from public, anon, authenticated;

grant execute on function public.ensure_current_personal_meal_plan(uuid)
to service_role;
