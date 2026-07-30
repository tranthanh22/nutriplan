-- Add versioned onboarding details and a private daily wellness check-in.

alter table public.nutrition_profiles
  add column if not exists activity_days_per_week smallint not null default 0,
  add column if not exists food_allergies text[] not null default '{}',
  add column if not exists food_intolerances text[] not null default '{}';

alter table public.nutrition_profiles
  drop constraint if exists nutrition_profiles_activity_days_range,
  add constraint nutrition_profiles_activity_days_range
    check (activity_days_per_week between 0 and 7);

create table if not exists public.daily_wellness_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  nutrition_profile_id uuid not null
    references public.nutrition_profiles(id) on delete cascade,
  checkin_date date not null default current_date,
  activity_type text not null,
  activity_minutes smallint not null default 0,
  activity_intensity text not null,
  fatigue_level smallint not null,
  energy_level smallint not null,
  sleep_hours numeric(4, 1) not null,
  sleep_quality smallint not null,
  stress_level smallint not null,
  mood text not null,
  water_liters numeric(4, 1),
  symptoms text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_wellness_user_date_unique unique (user_id, checkin_date),
  constraint daily_wellness_activity_type_check check (
    activity_type in ('rest', 'walking', 'cardio', 'strength', 'sport', 'mixed')
  ),
  constraint daily_wellness_activity_minutes_check
    check (activity_minutes between 0 and 600),
  constraint daily_wellness_activity_intensity_check check (
    activity_intensity in ('rest', 'light', 'moderate', 'high')
  ),
  constraint daily_wellness_fatigue_check check (fatigue_level between 1 and 5),
  constraint daily_wellness_energy_check check (energy_level between 1 and 5),
  constraint daily_wellness_sleep_hours_check check (sleep_hours between 0 and 24),
  constraint daily_wellness_sleep_quality_check check (sleep_quality between 1 and 5),
  constraint daily_wellness_stress_check check (stress_level between 1 and 5),
  constraint daily_wellness_mood_check check (
    mood in ('very_low', 'low', 'neutral', 'good', 'very_good')
  ),
  constraint daily_wellness_water_check check (
    water_liters is null or water_liters between 0 and 10
  ),
  constraint daily_wellness_notes_length check (
    notes is null or char_length(notes) <= 500
  )
);

create index if not exists daily_wellness_user_date_idx
  on public.daily_wellness_checkins(user_id, checkin_date desc);

create index if not exists daily_wellness_profile_idx
  on public.daily_wellness_checkins(nutrition_profile_id);

alter table public.daily_wellness_checkins enable row level security;

drop policy if exists daily_wellness_select_own on public.daily_wellness_checkins;
create policy daily_wellness_select_own
  on public.daily_wellness_checkins for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists daily_wellness_insert_own on public.daily_wellness_checkins;
create policy daily_wellness_insert_own
  on public.daily_wellness_checkins for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists daily_wellness_update_own on public.daily_wellness_checkins;
create policy daily_wellness_update_own
  on public.daily_wellness_checkins for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists daily_wellness_delete_own on public.daily_wellness_checkins;
create policy daily_wellness_delete_own
  on public.daily_wellness_checkins for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.daily_wellness_checkins from anon;
grant select, insert, update, delete
  on table public.daily_wellness_checkins to authenticated;
grant all on table public.daily_wellness_checkins to service_role;

drop trigger if exists set_daily_wellness_updated_at
  on public.daily_wellness_checkins;
create trigger set_daily_wellness_updated_at
  before update on public.daily_wellness_checkins
  for each row execute function public.set_updated_at();

create function public.replace_current_nutrition_profile(
  p_gender public.gender_type,
  p_birth_date date,
  p_height_cm numeric,
  p_weight_kg numeric,
  p_activity_level public.activity_level,
  p_activity_days_per_week smallint,
  p_goal public.nutrition_goal,
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

revoke all on function public.replace_current_nutrition_profile(
  public.gender_type,
  date,
  numeric,
  numeric,
  public.activity_level,
  smallint,
  public.nutrition_goal,
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

grant execute on function public.replace_current_nutrition_profile(
  public.gender_type,
  date,
  numeric,
  numeric,
  public.activity_level,
  smallint,
  public.nutrition_goal,
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

comment on table public.daily_wellness_checkins is
  'Daily self-reported wellness context used for non-diagnostic AI nutrition insights.';
