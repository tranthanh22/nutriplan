-- Personal meal plans, nutritionally safe replacements, kitchen menus and
-- idempotent "eaten" confirmation for the NutriPlan MVP.

create type public.meal_consumption_status as enum ('planned', 'eaten');

alter table public.meal_plan_items
  add column consumption_status public.meal_consumption_status not null default 'planned',
  add column consumed_at timestamptz;

alter table public.meal_plan_items
  add constraint meal_plan_items_consumed_state check (
    (consumption_status = 'planned' and consumed_at is null)
    or (consumption_status = 'eaten' and consumed_at is not null)
  );

create table public.meal_plan_item_replacements (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  meal_plan_item_id uuid not null references public.meal_plan_items(id) on delete cascade,
  from_dish_id uuid not null references public.dishes(id) on delete restrict,
  to_dish_id uuid not null references public.dishes(id) on delete restrict,
  previous_nutrition jsonb not null,
  replacement_nutrition jsonb not null,
  projected_daily_nutrition jsonb not null,
  created_at timestamptz not null default now(),
  constraint meal_plan_item_replacements_different_dish check (from_dish_id <> to_dish_id),
  constraint meal_plan_item_replacements_json_objects check (
    jsonb_typeof(previous_nutrition) = 'object'
    and jsonb_typeof(replacement_nutrition) = 'object'
    and jsonb_typeof(projected_daily_nutrition) = 'object'
  )
);

create index meal_plan_item_replacements_item_created_idx
  on public.meal_plan_item_replacements(meal_plan_item_id, created_at desc);

create unique index meal_log_one_entry_per_plan_item
  on public.meal_log_entries(meal_plan_item_id)
  where source = 'recipe' and meal_plan_item_id is not null;

create index daily_order_items_daily_order_idx
  on public.daily_order_items(daily_order_id);

create index meal_log_entries_meal_plan_item_idx
  on public.meal_log_entries(meal_plan_item_id)
  where meal_plan_item_id is not null;

alter table public.meal_plan_item_replacements enable row level security;

create policy meal_plan_item_replacements_owner_read
  on public.meal_plan_item_replacements for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

grant select on table public.meal_plan_item_replacements to authenticated;
grant select, insert, update, delete on table public.meal_plan_item_replacements to service_role;
grant usage, select on sequence public.meal_plan_item_replacements_id_seq to service_role;

-- A compact active catalogue used to generate and replace personal meals.
insert into public.dishes (
  name, slug, short_description, ingredient_summary, image_path, meal_types,
  cuisine, prep_time_minutes, cook_time_minutes, difficulty, status, published_at
)
values
  ('Yến mạch xoài sữa chua', 'oat-mango-yogurt', 'Bữa sáng giàu chất xơ và protein.', 'Yến mạch, sữa chua Hy Lạp, xoài, hạt chia', 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=1200&q=85', array['breakfast']::public.meal_type[], 'Quốc tế', 10, 0, 1, 'active', now()),
  ('Bánh mì bơ & trứng', 'avocado-egg-toast', 'Bữa sáng cân bằng với chất béo tốt.', 'Bánh mì nguyên cám, bơ, trứng, cà chua', 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=1200&q=85', array['breakfast']::public.meal_type[], 'Quốc tế', 10, 5, 1, 'active', now()),
  ('Pancake chuối protein', 'protein-banana-pancake', 'Pancake ít đường, giàu protein.', 'Chuối, yến mạch, trứng, sữa chua', 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=1200&q=85', array['breakfast']::public.meal_type[], 'Quốc tế', 10, 10, 2, 'active', now()),
  ('Cháo gà nấm', 'chicken-mushroom-congee', 'Cháo nhẹ bụng với đạm nạc.', 'Gạo, ức gà, nấm, hành lá', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85', array['breakfast']::public.meal_type[], 'Việt Nam', 10, 25, 2, 'active', now()),
  ('Ức gà & cơm gạo lứt', 'chicken-brown-rice', 'Đạm nạc và tinh bột hấp thu chậm.', 'Ức gà, cơm gạo lứt, bông cải', 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=1200&q=85', array['lunch']::public.meal_type[], 'Việt Nam', 10, 20, 2, 'active', now()),
  ('Bún bò rau củ ít béo', 'lean-beef-noodle', 'Bún bò nhẹ dầu với nhiều rau.', 'Bò nạc, bún, rau củ, nước dùng', 'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=1200&q=85', array['lunch']::public.meal_type[], 'Việt Nam', 15, 25, 2, 'active', now()),
  ('Đậu hũ teriyaki & quinoa', 'tofu-quinoa-bowl', 'Lựa chọn thực vật giàu đạm.', 'Đậu hũ, quinoa, rau củ, sốt teriyaki', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85', array['lunch']::public.meal_type[], 'Châu Á', 10, 15, 2, 'active', now()),
  ('Cá hồi & cơm rau củ', 'salmon-rice-bowl', 'Bữa trưa giàu omega-3.', 'Cá hồi, cơm, bông cải, cà rốt', 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=85', array['lunch']::public.meal_type[], 'Châu Á', 10, 20, 2, 'active', now()),
  ('Salad cá hồi sốt chanh', 'salmon-lemon-salad', 'Rau xanh, omega-3 và chất béo tốt.', 'Cá hồi, rau xanh, khoai tây, sốt chanh', 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=85', array['dinner']::public.meal_type[], 'Quốc tế', 15, 10, 2, 'active', now()),
  ('Gà nướng & khoai lang', 'chicken-sweet-potato', 'Bữa tối giàu protein, vừa tinh bột.', 'Ức gà, khoai lang, đậu que', 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=1200&q=85', array['dinner']::public.meal_type[], 'Quốc tế', 10, 25, 2, 'active', now()),
  ('Bún gạo tôm rau củ', 'shrimp-rice-noodle', 'Bữa tối thanh nhẹ, ít dầu.', 'Tôm, bún gạo, cải thìa, cà rốt', 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=1200&q=85', array['dinner']::public.meal_type[], 'Việt Nam', 15, 15, 2, 'active', now()),
  ('Đậu hũ nấm & cơm lứt', 'tofu-mushroom-rice', 'Bữa tối thực vật cân bằng.', 'Đậu hũ, nấm, cơm gạo lứt, rau xanh', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85', array['dinner']::public.meal_type[], 'Châu Á', 10, 15, 2, 'active', now())
on conflict (slug) do update
set
  name = excluded.name,
  short_description = excluded.short_description,
  ingredient_summary = excluded.ingredient_summary,
  image_path = excluded.image_path,
  meal_types = excluded.meal_types,
  cuisine = excluded.cuisine,
  prep_time_minutes = excluded.prep_time_minutes,
  cook_time_minutes = excluded.cook_time_minutes,
  difficulty = excluded.difficulty,
  status = 'active',
  published_at = coalesce(public.dishes.published_at, now()),
  updated_at = now();

with nutrition_seed (
  slug, serving_grams, calories, protein, carbs, fat, fiber, sodium
) as (
  values
    ('oat-mango-yogurt', 360::numeric, 430::numeric, 25::numeric, 58::numeric, 11::numeric, 9::numeric, 180::numeric),
    ('avocado-egg-toast', 300, 450, 22, 42, 22, 8, 420),
    ('protein-banana-pancake', 320, 440, 30, 50, 14, 7, 260),
    ('chicken-mushroom-congee', 450, 420, 29, 52, 10, 4, 510),
    ('chicken-brown-rice', 480, 610, 48, 66, 17, 9, 520),
    ('lean-beef-noodle', 520, 590, 42, 72, 15, 7, 650),
    ('tofu-quinoa-bowl', 480, 560, 32, 68, 19, 12, 580),
    ('salmon-rice-bowl', 470, 620, 43, 65, 21, 8, 490),
    ('salmon-lemon-salad', 430, 540, 38, 32, 29, 8, 430),
    ('chicken-sweet-potato', 460, 570, 46, 55, 18, 10, 460),
    ('shrimp-rice-noodle', 480, 550, 39, 62, 17, 6, 620),
    ('tofu-mushroom-rice', 470, 530, 31, 65, 16, 11, 540)
)
insert into public.dish_nutrition (
  dish_id, serving_name, serving_grams, calories_kcal, protein_g, carbs_g,
  fat_g, fiber_g, sodium_mg, source_note, verified_at
)
select
  d.id, '1 khẩu phần', n.serving_grams, n.calories, n.protein, n.carbs,
  n.fat, n.fiber, n.sodium, 'NutriPlan MVP verified catalogue', now()
from nutrition_seed n
join public.dishes d on d.slug = n.slug
on conflict (dish_id) do update
set
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
  jsonb_build_array(
    'Chuẩn bị và cân đủ nguyên liệu theo khẩu phần.',
    'Nấu chín phần đạm và tinh bột, hạn chế thêm dầu.',
    'Hoàn thiện với rau, nêm vừa ăn và dùng ngay.'
  ),
  'Có thể điều chỉnh lượng gia vị nhưng giữ nguyên định lượng chính.',
  1
from public.dishes d
where d.slug in (
  'oat-mango-yogurt', 'avocado-egg-toast', 'protein-banana-pancake',
  'chicken-mushroom-congee', 'chicken-brown-rice', 'lean-beef-noodle',
  'tofu-quinoa-bowl', 'salmon-rice-bowl', 'salmon-lemon-salad',
  'chicken-sweet-potato', 'shrimp-rice-noodle', 'tofu-mushroom-rice'
)
on conflict (dish_id) do update
set instructions = excluded.instructions, cooking_tips = excluded.cooking_tips, updated_at = now();

with allergen_seed (slug, allergen_code) as (
  values
    ('oat-mango-yogurt', 'milk'),
    ('avocado-egg-toast', 'egg'),
    ('avocado-egg-toast', 'wheat'),
    ('protein-banana-pancake', 'egg'),
    ('protein-banana-pancake', 'milk'),
    ('tofu-quinoa-bowl', 'soy'),
    ('salmon-rice-bowl', 'fish'),
    ('salmon-lemon-salad', 'fish'),
    ('shrimp-rice-noodle', 'shellfish'),
    ('tofu-mushroom-rice', 'soy')
)
insert into public.dish_allergens (dish_id, allergen_id)
select d.id, a.id
from allergen_seed s
join public.dishes d on d.slug = s.slug
join public.allergens a on a.code = s.allergen_code
on conflict (dish_id, allergen_id) do nothing;

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
    select 1 from public.subscriptions s
    where s.user_id = p_user_id
      and s.status in ('active', 'cancel_at_period_end')
      and s.current_period_end > now()
  ) then
    raise exception 'active_subscription_required';
  end if;

  update public.meal_plans
  set status = case when end_date < current_date then 'completed' else 'archived' end,
      updated_at = now()
  where user_id = p_user_id and status = 'active';

  insert into public.meal_plans (
    user_id, nutrition_profile_id, name, start_date, end_date, status, version,
    target_calories_kcal, target_protein_g, target_carbs_g, target_fat_g,
    generated_by
  )
  values (
    p_user_id, v_profile.id, 'Kế hoạch cá nhân 7 ngày',
    current_date, current_date + 6, 'active',
    coalesce((select max(version) + 1 from public.meal_plans where user_id = p_user_id), 1),
    v_profile.target_calories_kcal, v_profile.target_protein_g,
    v_profile.target_carbs_g, v_profile.target_fat_g,
    'rule_based_nutrition_v2'
  )
  returning id into v_plan_id;

  with slots(day_offset, meal_type, sequence_no, calorie_share, rotation) as (
    select day_offset, 'breakfast'::public.meal_type, 1::smallint, 0.25::numeric, day_offset
    from generate_series(0, 6) day_offset
    union all
    select day_offset, 'lunch'::public.meal_type, 1::smallint, 0.40::numeric, day_offset + 1
    from generate_series(0, 6) day_offset
    union all
    select day_offset, 'dinner'::public.meal_type, 1::smallint, 0.35::numeric, day_offset + 2
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
      on d.status = 'active' and d.meal_types @> array[s.meal_type]::public.meal_type[]
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
    select *,
      round((v_profile.target_calories_kcal * calorie_share) / calories_kcal, 2) as plan_servings
    from ranked_dishes
    where dish_rank = mod(rotation, dish_count) + 1
  )
  insert into public.meal_plan_items (
    meal_plan_id, dish_id, planned_date, meal_type, sequence_no, servings,
    calories_kcal, protein_g, carbs_g, fat_g
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

  if (select count(*) from public.meal_plan_items where meal_plan_id = v_plan_id) <> 21 then
    raise exception 'insufficient_safe_dishes';
  end if;

  return v_plan_id;
end;
$$;

create or replace function public.get_personal_meal_replacement_candidates(
  p_user_id uuid,
  p_meal_plan_item_id uuid
)
returns table (
  dish_id uuid,
  name text,
  short_description text,
  image_path text,
  prep_time_minutes integer,
  servings numeric,
  calories_kcal numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  projected_calories_kcal numeric,
  projected_protein_g numeric,
  projected_carbs_g numeric,
  projected_fat_g numeric,
  balance_score integer
)
language sql
security definer
set search_path = ''
as $$
  with current_item as (
    select mpi.*, mp.user_id,
      mp.target_calories_kcal, mp.target_protein_g,
      mp.target_carbs_g, mp.target_fat_g
    from public.meal_plan_items mpi
    join public.meal_plans mp on mp.id = mpi.meal_plan_id
    where mpi.id = p_meal_plan_item_id
      and mp.user_id = p_user_id
      and mp.status = 'active'
      and mpi.consumption_status = 'planned'
      and exists (
        select 1 from public.subscriptions s
        where s.user_id = p_user_id
          and s.status in ('active', 'cancel_at_period_end')
          and s.current_period_end > now()
      )
  ),
  day_totals as (
    select
      sum(mpi.calories_kcal) as day_total_calories,
      sum(mpi.protein_g) as day_total_protein,
      sum(mpi.carbs_g) as day_total_carbs,
      sum(mpi.fat_g) as day_total_fat
    from public.meal_plan_items mpi
    join current_item ci
      on ci.meal_plan_id = mpi.meal_plan_id and ci.planned_date = mpi.planned_date
  ),
  candidates as (
    select
      d.id as dish_id,
      d.name,
      d.short_description,
      d.image_path,
      d.prep_time_minutes,
      round(ci.calories_kcal / nullif(dn.calories_kcal, 0), 2) as servings,
      ci.calories_kcal as current_calories,
      ci.protein_g as current_protein,
      ci.carbs_g as current_carbs,
      ci.fat_g as current_fat,
      ci.target_calories_kcal,
      ci.target_protein_g,
      ci.target_carbs_g,
      ci.target_fat_g,
      dt.day_total_calories,
      dt.day_total_protein,
      dt.day_total_carbs,
      dt.day_total_fat,
      dn.calories_kcal as base_calories,
      dn.protein_g as base_protein,
      dn.carbs_g as base_carbs,
      dn.fat_g as base_fat
    from current_item ci
    cross join day_totals dt
    join public.dishes d
      on d.status = 'active'
      and d.id <> ci.dish_id
      and d.meal_types @> array[ci.meal_type]::public.meal_type[]
    join public.dish_nutrition dn on dn.dish_id = d.id
    where not exists (
      select 1
      from public.dish_allergens da
      join public.user_allergens ua
        on ua.allergen_id = da.allergen_id and ua.user_id = p_user_id
      where da.dish_id = d.id
    )
  ),
  projected as (
    select c.*,
      round(c.base_calories * c.servings, 2) as next_calories,
      round(c.base_protein * c.servings, 2) as next_protein,
      round(c.base_carbs * c.servings, 2) as next_carbs,
      round(c.base_fat * c.servings, 2) as next_fat,
      round(c.day_total_calories - c.current_calories + c.base_calories * c.servings, 2) as day_calories,
      round(c.day_total_protein - c.current_protein + c.base_protein * c.servings, 2) as day_protein,
      round(c.day_total_carbs - c.current_carbs + c.base_carbs * c.servings, 2) as day_carbs,
      round(c.day_total_fat - c.current_fat + c.base_fat * c.servings, 2) as day_fat
    from candidates c
  )
  select
    p.dish_id,
    p.name,
    p.short_description,
    p.image_path,
    p.prep_time_minutes,
    p.servings,
    p.next_calories,
    p.next_protein,
    p.next_carbs,
    p.next_fat,
    p.day_calories,
    p.day_protein,
    p.day_carbs,
    p.day_fat,
    greatest(0, least(100, round(
      100
      - 25 * abs(p.day_calories - p.target_calories_kcal) / nullif(p.target_calories_kcal, 0)
      - 25 * abs(p.day_protein - p.target_protein_g) / nullif(p.target_protein_g, 0)
      - 25 * abs(p.day_carbs - p.target_carbs_g) / nullif(p.target_carbs_g, 0)
      - 25 * abs(p.day_fat - p.target_fat_g) / nullif(p.target_fat_g, 0)
    )))::integer as balance_score
  from projected p
  where p.day_calories between p.target_calories_kcal * 0.90 and p.target_calories_kcal * 1.10
    and p.day_protein between p.target_protein_g * 0.80 and p.target_protein_g * 1.20
    and p.day_carbs between p.target_carbs_g * 0.70 and p.target_carbs_g * 1.30
    and p.day_fat between p.target_fat_g * 0.70 and p.target_fat_g * 1.30
  order by balance_score desc, p.name;
$$;

create or replace function public.replace_personal_meal(
  p_user_id uuid,
  p_meal_plan_item_id uuid,
  p_dish_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.meal_plan_items%rowtype;
  v_candidate record;
begin
  select mpi.* into v_item
  from public.meal_plan_items mpi
  join public.meal_plans mp on mp.id = mpi.meal_plan_id
  where mpi.id = p_meal_plan_item_id and mp.user_id = p_user_id
  for update of mpi;

  if not found then
    raise exception 'meal_plan_item_not_found';
  end if;
  if v_item.consumption_status = 'eaten' then
    raise exception 'eaten_meal_cannot_be_replaced';
  end if;

  select * into v_candidate
  from public.get_personal_meal_replacement_candidates(p_user_id, p_meal_plan_item_id)
  where dish_id = p_dish_id;

  if not found then
    raise exception 'replacement_not_nutritionally_safe';
  end if;

  insert into public.meal_plan_item_replacements (
    user_id, meal_plan_item_id, from_dish_id, to_dish_id,
    previous_nutrition, replacement_nutrition, projected_daily_nutrition
  )
  values (
    p_user_id, v_item.id, v_item.dish_id, v_candidate.dish_id,
    jsonb_build_object(
      'servings', v_item.servings, 'caloriesKcal', v_item.calories_kcal,
      'proteinG', v_item.protein_g, 'carbsG', v_item.carbs_g, 'fatG', v_item.fat_g
    ),
    jsonb_build_object(
      'servings', v_candidate.servings, 'caloriesKcal', v_candidate.calories_kcal,
      'proteinG', v_candidate.protein_g, 'carbsG', v_candidate.carbs_g,
      'fatG', v_candidate.fat_g
    ),
    jsonb_build_object(
      'caloriesKcal', v_candidate.projected_calories_kcal,
      'proteinG', v_candidate.projected_protein_g,
      'carbsG', v_candidate.projected_carbs_g,
      'fatG', v_candidate.projected_fat_g,
      'balanceScore', v_candidate.balance_score
    )
  );

  update public.meal_plan_items
  set
    dish_id = v_candidate.dish_id,
    servings = v_candidate.servings,
    calories_kcal = v_candidate.calories_kcal,
    protein_g = v_candidate.protein_g,
    carbs_g = v_candidate.carbs_g,
    fat_g = v_candidate.fat_g,
    is_replacement = true,
    updated_at = now()
  where id = v_item.id;

  return jsonb_build_object(
    'itemId', v_item.id,
    'dishId', v_candidate.dish_id,
    'name', v_candidate.name,
    'balanceScore', v_candidate.balance_score
  );
end;
$$;

create or replace function public.confirm_personal_meal_eaten(
  p_user_id uuid,
  p_meal_plan_item_id uuid,
  p_consumed_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item record;
  v_log public.meal_log_entries%rowtype;
begin
  select mpi.*, d.name as dish_name
  into v_item
  from public.meal_plan_items mpi
  join public.meal_plans mp on mp.id = mpi.meal_plan_id
  join public.dishes d on d.id = mpi.dish_id
  where mpi.id = p_meal_plan_item_id and mp.user_id = p_user_id
  for update of mpi;

  if not found then
    raise exception 'meal_plan_item_not_found';
  end if;
  if not exists (
    select 1 from public.subscriptions s
    where s.user_id = p_user_id
      and s.status in ('active', 'cancel_at_period_end')
      and s.current_period_end > now()
  ) then
    raise exception 'active_subscription_required';
  end if;

  select * into v_log
  from public.meal_log_entries
  where source = 'recipe' and meal_plan_item_id = v_item.id;

  if v_log.id is null then
    insert into public.meal_log_entries (
      user_id, source, consumed_at, meal_type, dish_id, meal_plan_item_id,
      name, servings, calories_kcal, protein_g, carbs_g, fat_g,
      is_user_confirmed
    )
    values (
      p_user_id, 'recipe', p_consumed_at, v_item.meal_type, v_item.dish_id,
      v_item.id, v_item.dish_name, v_item.servings, v_item.calories_kcal,
      v_item.protein_g, v_item.carbs_g, v_item.fat_g, true
    )
    returning * into v_log;
  end if;

  update public.meal_plan_items
  set consumption_status = 'eaten',
      consumed_at = coalesce(consumed_at, v_log.consumed_at),
      updated_at = now()
  where id = v_item.id;

  return to_jsonb(v_log);
end;
$$;

create or replace function public.confirm_kitchen_meal_eaten(
  p_user_id uuid,
  p_daily_order_id uuid,
  p_consumed_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.daily_orders%rowtype;
  v_log public.meal_log_entries%rowtype;
  v_summary record;
begin
  select * into v_order
  from public.daily_orders
  where id = p_daily_order_id and user_id = p_user_id
  for update;

  if not found then
    raise exception 'daily_order_not_found';
  end if;
  if v_order.status <> 'delivered' then
    raise exception 'kitchen_meal_not_delivered';
  end if;
  if not exists (
    select 1 from public.subscriptions s
    where s.user_id = p_user_id
      and s.status in ('active', 'cancel_at_period_end')
      and s.current_period_end > now()
  ) then
    raise exception 'active_subscription_required';
  end if;

  select * into v_log
  from public.meal_log_entries
  where source = 'kitchen' and daily_order_id = v_order.id;

  if v_log.id is null then
    select
      string_agg(doi.dish_name, ', ' order by doi.created_at) as meal_name,
      case when count(*) = 1 then min(doi.dish_id) else null end as dish_id,
      sum(doi.servings) as servings,
      sum(doi.calories_kcal) as calories,
      sum(doi.protein_g) as protein,
      sum(doi.carbs_g) as carbs,
      sum(doi.fat_g) as fat
    into v_summary
    from public.daily_order_items doi
    where doi.daily_order_id = v_order.id;

    if v_summary.meal_name is null then
      raise exception 'daily_order_has_no_items';
    end if;

    insert into public.meal_log_entries (
      user_id, source, consumed_at, meal_type, dish_id, daily_order_id,
      name, servings, calories_kcal, protein_g, carbs_g, fat_g,
      is_user_confirmed
    )
    values (
      p_user_id, 'kitchen', p_consumed_at, v_order.meal_type,
      v_summary.dish_id, v_order.id, v_summary.meal_name, v_summary.servings,
      v_summary.calories, v_summary.protein, v_summary.carbs, v_summary.fat, true
    )
    returning * into v_log;
  end if;

  return to_jsonb(v_log);
end;
$$;

revoke all on function public.ensure_current_personal_meal_plan(uuid)
  from public, anon, authenticated;
revoke all on function public.get_personal_meal_replacement_candidates(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.replace_personal_meal(uuid, uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.confirm_personal_meal_eaten(uuid, uuid, timestamptz)
  from public, anon, authenticated;
revoke all on function public.confirm_kitchen_meal_eaten(uuid, uuid, timestamptz)
  from public, anon, authenticated;

grant execute on function public.ensure_current_personal_meal_plan(uuid) to service_role;
grant execute on function public.get_personal_meal_replacement_candidates(uuid, uuid) to service_role;
grant execute on function public.replace_personal_meal(uuid, uuid, uuid) to service_role;
grant execute on function public.confirm_personal_meal_eaten(uuid, uuid, timestamptz) to service_role;
grant execute on function public.confirm_kitchen_meal_eaten(uuid, uuid, timestamptz) to service_role;
