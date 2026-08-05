do $$
begin
  create type public.dish_kind as enum ('meal', 'snack', 'drink');
exception
  when duplicate_object then null;
end
$$;

alter table public.dishes
  add column if not exists dish_kind public.dish_kind not null default 'meal';

insert into public.dishes (
  name, slug, short_description, ingredient_summary, image_path, meal_types,
  dish_kind, cuisine, prep_time_minutes, cook_time_minutes, difficulty,
  status, published_at
)
values
  ('Sữa chua trái cây ít đường', 'low-sugar-fruit-yogurt', 'Bữa nhẹ mát, giàu protein và chất xơ.', 'Sữa chua Hy Lạp, dâu, việt quất', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=85', array['snack']::public.meal_type[], 'snack', 'Quốc tế', 5, 0, 1, 'active', now()),
  ('Táo và bơ đậu phộng', 'apple-peanut-butter-snack', 'Bữa nhẹ giàu chất xơ và chất béo tốt.', 'Táo, bơ đậu phộng nguyên chất', 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=1200&q=85', array['snack']::public.meal_type[], 'snack', 'Quốc tế', 5, 0, 1, 'active', now()),
  ('Trái cây theo mùa', 'seasonal-fruit-cup', 'Bữa nhẹ tự nhiên, không thêm đường.', 'Thanh long, dưa hấu, cam', 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=1200&q=85', array['snack']::public.meal_type[], 'snack', 'Việt Nam', 5, 0, 1, 'active', now()),
  ('Đậu gà rang giòn', 'crispy-roasted-chickpeas', 'Bữa nhẹ thực vật giàu chất xơ.', 'Đậu gà, paprika, dầu ô-liu', 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=1200&q=85', array['snack']::public.meal_type[], 'snack', 'Địa Trung Hải', 5, 20, 1, 'active', now()),
  ('Sinh tố chuối yến mạch', 'banana-oat-smoothie', 'Đồ uống bổ sung năng lượng chậm.', 'Chuối, yến mạch, sữa ít béo', 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=1200&q=85', array['snack']::public.meal_type[], 'drink', 'Quốc tế', 7, 0, 1, 'active', now()),
  ('Sữa đậu nành không đường', 'unsweetened-soy-milk', 'Đồ uống thực vật giàu protein.', 'Đậu nành, nước', 'https://images.unsplash.com/photo-1600788907416-456578634209?auto=format&fit=crop&w=1200&q=85', array['snack']::public.meal_type[], 'drink', 'Châu Á', 2, 0, 1, 'active', now()),
  ('Nước chanh hạt chia', 'lemon-chia-water', 'Đồ uống thanh mát, ít năng lượng.', 'Chanh, hạt chia, nước, ít mật ong', 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9d?auto=format&fit=crop&w=1200&q=85', array['snack']::public.meal_type[], 'drink', 'Việt Nam', 5, 0, 1, 'active', now()),
  ('Trà thảo mộc cam quế', 'orange-cinnamon-herbal-tea', 'Đồ uống không caffeine và ít năng lượng.', 'Cam, quế, trà thảo mộc', 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&w=1200&q=85', array['snack']::public.meal_type[], 'drink', 'Quốc tế', 5, 5, 1, 'active', now())
on conflict (slug) do update
set
  name = excluded.name,
  short_description = excluded.short_description,
  ingredient_summary = excluded.ingredient_summary,
  image_path = excluded.image_path,
  meal_types = excluded.meal_types,
  dish_kind = excluded.dish_kind,
  cuisine = excluded.cuisine,
  prep_time_minutes = excluded.prep_time_minutes,
  cook_time_minutes = excluded.cook_time_minutes,
  difficulty = excluded.difficulty,
  status = 'active',
  published_at = coalesce(public.dishes.published_at, now()),
  updated_at = now();

with nutrition_seed (
  slug, serving_name, serving_grams, calories, protein, carbs, fat, fiber, sodium
) as (
  values
    ('low-sugar-fruit-yogurt', '1 ly', 220::numeric, 170::numeric, 13::numeric, 22::numeric, 4::numeric, 4::numeric, 70::numeric),
    ('apple-peanut-butter-snack', '1 phần', 190, 210, 6, 28, 10, 6, 85),
    ('seasonal-fruit-cup', '1 tô nhỏ', 240, 150, 3, 36, 1, 6, 15),
    ('crispy-roasted-chickpeas', '1 phần', 120, 200, 10, 30, 5, 8, 210),
    ('banana-oat-smoothie', '1 ly', 320, 230, 9, 41, 5, 5, 95),
    ('unsweetened-soy-milk', '1 ly', 250, 120, 9, 7, 6, 2, 90),
    ('lemon-chia-water', '1 ly', 300, 90, 2, 15, 3, 5, 20),
    ('orange-cinnamon-herbal-tea', '1 ly', 300, 45, 1, 11, 0, 2, 10)
)
insert into public.dish_nutrition (
  dish_id, serving_name, serving_grams, calories_kcal, protein_g, carbs_g,
  fat_g, fiber_g, sodium_mg, source_note, verified_at
)
select
  d.id, n.serving_name, n.serving_grams, n.calories, n.protein, n.carbs,
  n.fat, n.fiber, n.sodium, 'NutriPlan MVP snack and drink catalogue', now()
from nutrition_seed n
join public.dishes d on d.slug = n.slug
on conflict (dish_id) do update
set
  serving_name = excluded.serving_name,
  serving_grams = excluded.serving_grams,
  calories_kcal = excluded.calories_kcal,
  protein_g = excluded.protein_g,
  carbs_g = excluded.carbs_g,
  fat_g = excluded.fat_g,
  fiber_g = excluded.fiber_g,
  sodium_mg = excluded.sodium_mg,
  source_note = excluded.source_note,
  verified_at = excluded.verified_at,
  updated_at = now();

insert into public.recipes (dish_id, instructions, cooking_tips, version)
select
  d.id,
  case
    when d.dish_kind = 'drink' then jsonb_build_array(
      'Chuẩn bị nguyên liệu theo đúng khẩu phần.',
      'Xay hoặc pha đều, không thêm đường tinh luyện.',
      'Dùng ngay sau khi chuẩn bị.'
    )
    else jsonb_build_array(
      'Chuẩn bị nguyên liệu theo đúng khẩu phần.',
      'Trộn hoặc chế biến tối giản, không thêm đường.',
      'Chia đúng một khẩu phần trước khi dùng.'
    )
  end,
  'Giữ nguyên định lượng để không làm lệch mục tiêu năng lượng ngày.',
  1
from public.dishes d
where d.slug in (
  'low-sugar-fruit-yogurt', 'apple-peanut-butter-snack',
  'seasonal-fruit-cup', 'crispy-roasted-chickpeas',
  'banana-oat-smoothie', 'unsweetened-soy-milk',
  'lemon-chia-water', 'orange-cinnamon-herbal-tea'
)
on conflict (dish_id) do update
set instructions = excluded.instructions,
    cooking_tips = excluded.cooking_tips,
    updated_at = now();

with allergen_seed (slug, allergen_code) as (
  values
    ('low-sugar-fruit-yogurt', 'milk'),
    ('apple-peanut-butter-snack', 'peanut'),
    ('banana-oat-smoothie', 'milk'),
    ('unsweetened-soy-milk', 'soy')
)
insert into public.dish_allergens (dish_id, allergen_id)
select d.id, a.id
from allergen_seed s
join public.dishes d on d.slug = s.slug
join public.allergens a on a.code = s.allergen_code
on conflict (dish_id, allergen_id) do nothing;

create or replace function public.populate_personal_meal_plan_day(
  p_user_id uuid,
  p_plan_id uuid,
  p_planned_date date
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.nutrition_profiles%rowtype;
  v_item_count integer;
  v_eaten_count integer;
begin
  if p_user_id is null or p_plan_id is null or p_planned_date is null then
    raise exception 'meal_plan_day_parameters_required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_user_id::text || ':' || p_planned_date::text, 91002)
  );

  select np.* into v_profile
  from public.nutrition_profiles np
  join public.meal_plans mp
    on mp.nutrition_profile_id = np.id
   and mp.id = p_plan_id
   and mp.user_id = p_user_id
   and mp.status = 'active'
  where np.user_id = p_user_id and np.is_current
  limit 1;

  if not found then
    raise exception 'nutrition_profile_required';
  end if;

  if not exists (
    select 1 from public.subscriptions s
    where s.user_id = p_user_id
      and s.status in ('active', 'cancel_at_period_end')
      and s.current_period_end > now()
  ) then
    raise exception 'active_subscription_required';
  end if;

  select
    count(*),
    count(*) filter (where mpi.consumption_status = 'eaten')
  into v_item_count, v_eaten_count
  from public.meal_plan_items mpi
  where mpi.meal_plan_id = p_plan_id
    and mpi.planned_date = p_planned_date;

  -- Do not rewrite a day after the user has started recording consumption.
  if v_eaten_count > 0 then
    return v_item_count;
  end if;

  -- Upgrade v2 three-meal days to the new 82% main-meal allocation while
  -- preserving any dish the user may already have selected.
  if v_item_count = 3 then
    update public.meal_plan_items mpi
    set
      servings = round(mpi.servings * case mpi.meal_type
        when 'breakfast' then 0.88
        when 'lunch' then 0.80
        when 'dinner' then 0.80
        else 1
      end, 2),
      calories_kcal = round(mpi.calories_kcal * case mpi.meal_type
        when 'breakfast' then 0.88
        when 'lunch' then 0.80
        when 'dinner' then 0.80
        else 1
      end, 2),
      protein_g = round(mpi.protein_g * case mpi.meal_type
        when 'breakfast' then 0.88
        when 'lunch' then 0.80
        when 'dinner' then 0.80
        else 1
      end, 2),
      carbs_g = round(mpi.carbs_g * case mpi.meal_type
        when 'breakfast' then 0.88
        when 'lunch' then 0.80
        when 'dinner' then 0.80
        else 1
      end, 2),
      fat_g = round(mpi.fat_g * case mpi.meal_type
        when 'breakfast' then 0.88
        when 'lunch' then 0.80
        when 'dinner' then 0.80
        else 1
      end, 2),
      updated_at = now()
    where mpi.meal_plan_id = p_plan_id
      and mpi.planned_date = p_planned_date
      and mpi.meal_type in ('breakfast', 'lunch', 'dinner');
  end if;

  with slots (meal_type, sequence_no, dish_kind, calorie_share, rotation) as (
    values
      ('breakfast'::public.meal_type, 1::smallint, 'meal'::public.dish_kind, 0.22::numeric, 0),
      ('lunch'::public.meal_type, 1::smallint, 'meal'::public.dish_kind, 0.32::numeric, 1),
      ('dinner'::public.meal_type, 1::smallint, 'meal'::public.dish_kind, 0.28::numeric, 2),
      ('snack'::public.meal_type, 1::smallint, 'snack'::public.dish_kind, 0.10::numeric, 3),
      ('snack'::public.meal_type, 2::smallint, 'drink'::public.dish_kind, 0.08::numeric, 4)
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
        partition by s.meal_type, s.sequence_no, s.dish_kind
        order by d.slug
      ) as dish_rank,
      count(*) over (
        partition by s.meal_type, s.sequence_no, s.dish_kind
      ) as dish_count
    from slots s
    join public.dishes d
      on d.status = 'active'
     and d.dish_kind = s.dish_kind
     and d.meal_types @> array[s.meal_type]::public.meal_type[]
    join public.dish_nutrition dn on dn.dish_id = d.id
    where not exists (
      select 1
      from public.dish_allergens da
      join public.user_allergens ua
        on ua.allergen_id = da.allergen_id and ua.user_id = p_user_id
      where da.dish_id = d.id
    )
  ),
  selected as (
    select
      *,
      round((v_profile.target_calories_kcal * calorie_share) / nullif(calories_kcal, 0), 2) as plan_servings
    from ranked_dishes
    where dish_rank = mod(
      extract(doy from p_planned_date)::integer + rotation,
      dish_count::integer
    ) + 1
  )
  insert into public.meal_plan_items (
    meal_plan_id, dish_id, planned_date, meal_type, sequence_no, servings,
    calories_kcal, protein_g, carbs_g, fat_g
  )
  select
    p_plan_id,
    dish_id,
    p_planned_date,
    meal_type,
    sequence_no,
    greatest(plan_servings, 0.1),
    round(calories_kcal * greatest(plan_servings, 0.1), 2),
    round(protein_g * greatest(plan_servings, 0.1), 2),
    round(carbs_g * greatest(plan_servings, 0.1), 2),
    round(fat_g * greatest(plan_servings, 0.1), 2)
  from selected
  on conflict (meal_plan_id, planned_date, meal_type, sequence_no) do nothing;

  select count(*) into v_item_count
  from public.meal_plan_items mpi
  where mpi.meal_plan_id = p_plan_id
    and mpi.planned_date = p_planned_date;

  if v_item_count < 5 then
    raise exception 'insufficient_safe_dishes';
  end if;

  return v_item_count;
end;
$$;

create or replace function public.ensure_current_personal_meal_plan(p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan_id uuid;
  v_profile public.nutrition_profiles%rowtype;
  v_day date;
begin
  if p_user_id is null then
    raise exception 'user_required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_user_id::text, 91001)
  );

  select * into v_profile
  from public.nutrition_profiles np
  where np.user_id = p_user_id and np.is_current
  limit 1;

  if not found then
    raise exception 'nutrition_profile_required';
  end if;

  if not exists (
    select 1 from public.subscriptions s
    where s.user_id = p_user_id
      and s.status in ('active', 'cancel_at_period_end')
      and s.current_period_end > now()
  ) then
    raise exception 'active_subscription_required';
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
    for v_day in
      select distinct mpi.planned_date
      from public.meal_plan_items mpi
      where mpi.meal_plan_id = v_plan_id
    loop
      perform public.populate_personal_meal_plan_day(p_user_id, v_plan_id, v_day);
    end loop;
    return v_plan_id;
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
    user_id, nutrition_profile_id, name, start_date, end_date, status, version,
    target_calories_kcal, target_protein_g, target_carbs_g, target_fat_g,
    generated_by
  )
  values (
    p_user_id, v_profile.id, 'Kế hoạch cá nhân linh hoạt',
    current_date, current_date + 6, 'active',
    coalesce((select max(version) + 1 from public.meal_plans where user_id = p_user_id), 1),
    v_profile.target_calories_kcal, v_profile.target_protein_g,
    v_profile.target_carbs_g, v_profile.target_fat_g,
    'rule_based_nutrition_v3_snack_drink'
  )
  returning id into v_plan_id;

  for v_day in
    select current_date + day_offset
    from generate_series(0, 6) day_offset
  loop
    perform public.populate_personal_meal_plan_day(p_user_id, v_plan_id, v_day);
  end loop;

  return v_plan_id;
end;
$$;

create or replace function public.ensure_personal_meal_plan_day(
  p_user_id uuid,
  p_planned_date date
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan_id uuid;
  v_item_count integer;
begin
  if p_planned_date is null then
    raise exception 'planned_date_required';
  end if;

  v_plan_id := public.ensure_current_personal_meal_plan(p_user_id);

  update public.meal_plans
  set
    start_date = least(start_date, p_planned_date),
    end_date = greatest(end_date, p_planned_date),
    updated_at = now()
  where id = v_plan_id and user_id = p_user_id and status = 'active';

  v_item_count := public.populate_personal_meal_plan_day(
    p_user_id,
    v_plan_id,
    p_planned_date
  );

  return jsonb_build_object(
    'planId', v_plan_id,
    'plannedDate', p_planned_date,
    'itemCount', v_item_count
  );
end;
$$;

revoke all on function public.populate_personal_meal_plan_day(uuid, uuid, date)
from public, anon, authenticated;
revoke all on function public.ensure_current_personal_meal_plan(uuid)
from public, anon, authenticated;
revoke all on function public.ensure_personal_meal_plan_day(uuid, date)
from public, anon, authenticated;

grant execute on function public.populate_personal_meal_plan_day(uuid, uuid, date)
to service_role;
grant execute on function public.ensure_current_personal_meal_plan(uuid)
to service_role;
grant execute on function public.ensure_personal_meal_plan_day(uuid, date)
to service_role;
