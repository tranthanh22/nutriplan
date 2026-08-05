alter table public.nutrition_profiles
  add column if not exists target_weight_kg numeric(6, 2),
  add column if not exists goal_duration_weeks smallint;

update public.nutrition_profiles
set
  target_weight_kg = case goal
    when 'lose_weight' then greatest(20, weight_kg - 5)
    when 'gain_muscle' then least(400, weight_kg + 5)
    else weight_kg
  end,
  goal_duration_weeks = 12
where target_weight_kg is null or goal_duration_weeks is null;

alter table public.nutrition_profiles
  alter column target_weight_kg set not null,
  alter column goal_duration_weeks set not null,
  add constraint nutrition_profiles_target_weight_range
    check (target_weight_kg between 20 and 400),
  add constraint nutrition_profiles_goal_duration_range
    check (goal_duration_weeks between 2 and 104);

create function public.replace_current_nutrition_profile_v2(
  p_gender public.gender_type,
  p_birth_date date,
  p_height_cm numeric,
  p_weight_kg numeric,
  p_activity_level public.activity_level,
  p_activity_days_per_week smallint,
  p_goal public.nutrition_goal,
  p_target_weight_kg numeric,
  p_goal_duration_weeks smallint,
  p_dietary_preferences text[],
  p_disliked_ingredients text[],
  p_food_allergies text[],
  p_food_intolerances text[],
  p_medical_notes text,
  p_bmr_kcal numeric,
  p_tdee_kcal numeric,
  p_target_calories_kcal numeric,
  p_target_protein_g numeric,
  p_target_carbs_g numeric,
  p_target_fat_g numeric,
  p_formula_code text,
  p_formula_version text
)
returns public.nutrition_profiles
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  next_version integer;
  result public.nutrition_profiles;
begin
  if current_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if p_goal = 'lose_weight' and p_target_weight_kg >= p_weight_kg then
    raise exception 'lose_weight_target_must_be_lower';
  end if;
  if p_goal = 'gain_muscle' and p_target_weight_kg <= p_weight_kg then
    raise exception 'gain_muscle_target_must_be_higher';
  end if;
  if p_goal = 'maintain' and abs(p_target_weight_kg - p_weight_kg) > 0.5 then
    raise exception 'maintain_target_out_of_range';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));

  select coalesce(max(np.version), 0) + 1
  into next_version
  from public.nutrition_profiles np
  where np.user_id = current_user_id;

  update public.nutrition_profiles
  set is_current = false
  where user_id = current_user_id and is_current;

  insert into public.nutrition_profiles (
    user_id,
    version,
    gender,
    birth_date,
    height_cm,
    weight_kg,
    activity_level,
    activity_days_per_week,
    goal,
    target_weight_kg,
    goal_duration_weeks,
    dietary_preferences,
    disliked_ingredients,
    food_allergies,
    food_intolerances,
    medical_notes,
    bmr_kcal,
    tdee_kcal,
    target_calories_kcal,
    target_protein_g,
    target_carbs_g,
    target_fat_g,
    formula_code,
    formula_version
  )
  values (
    current_user_id,
    next_version,
    p_gender,
    p_birth_date,
    p_height_cm,
    p_weight_kg,
    p_activity_level,
    p_activity_days_per_week,
    p_goal,
    p_target_weight_kg,
    p_goal_duration_weeks,
    coalesce(p_dietary_preferences, '{}'),
    coalesce(p_disliked_ingredients, '{}'),
    coalesce(p_food_allergies, '{}'),
    coalesce(p_food_intolerances, '{}'),
    p_medical_notes,
    p_bmr_kcal,
    p_tdee_kcal,
    p_target_calories_kcal,
    p_target_protein_g,
    p_target_carbs_g,
    p_target_fat_g,
    p_formula_code,
    p_formula_version
  )
  returning * into result;

  return result;
end;
$$;

revoke all on function public.replace_current_nutrition_profile_v2(
  public.gender_type,
  date,
  numeric,
  numeric,
  public.activity_level,
  smallint,
  public.nutrition_goal,
  numeric,
  smallint,
  text[],
  text[],
  text[],
  text[],
  text,
  numeric,
  numeric,
  numeric,
  numeric,
  numeric,
  numeric,
  text,
  text
) from public, anon;

grant execute on function public.replace_current_nutrition_profile_v2(
  public.gender_type,
  date,
  numeric,
  numeric,
  public.activity_level,
  smallint,
  public.nutrition_goal,
  numeric,
  smallint,
  text[],
  text[],
  text[],
  text[],
  text,
  numeric,
  numeric,
  numeric,
  numeric,
  numeric,
  numeric,
  text,
  text
) to authenticated;
