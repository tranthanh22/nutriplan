-- Atomically replaces the current nutrition profile for the authenticated user.
-- SECURITY INVOKER keeps RLS active and auth.uid() determines ownership.

create or replace function public.replace_current_nutrition_profile(
  p_gender public.gender_type,
  p_birth_date date,
  p_height_cm numeric,
  p_weight_kg numeric,
  p_activity_level public.activity_level,
  p_goal public.nutrition_goal,
  p_dietary_preferences text[],
  p_disliked_ingredients text[],
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
    goal,
    dietary_preferences,
    disliked_ingredients,
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
    p_goal,
    coalesce(p_dietary_preferences, '{}'),
    coalesce(p_disliked_ingredients, '{}'),
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

revoke all on function public.replace_current_nutrition_profile(
  public.gender_type,
  date,
  numeric,
  numeric,
  public.activity_level,
  public.nutrition_goal,
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

grant execute on function public.replace_current_nutrition_profile(
  public.gender_type,
  date,
  numeric,
  numeric,
  public.activity_level,
  public.nutrition_goal,
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
