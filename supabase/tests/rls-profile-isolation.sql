-- Run with a privileged local/CI database connection.
-- The entire probe is wrapped in a transaction and leaves no test accounts behind.
begin;

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('a1111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-probe-a@nutriplan.test', '$2a$10$rlsprobe', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('b2222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-probe-b@nutriplan.test', '$2a$10$rlsprobe', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.nutrition_profiles (
  user_id, version, gender, birth_date, height_cm, weight_kg, activity_level, goal,
  bmr_kcal, tdee_kcal, target_calories_kcal, target_protein_g, target_carbs_g, target_fat_g,
  formula_code, formula_version, is_current
)
values
  ('a1111111-1111-4111-8111-111111111111', 1, 'male', '2000-01-15', 170, 70, 'moderate', 'maintain', 1650, 2557.5, 2557.5, 126, 320.39, 76.73, 'test', 'test-v1', true),
  ('b2222222-2222-4222-8222-222222222222', 1, 'female', '2000-01-15', 160, 55, 'light', 'maintain', 1300, 1787.5, 1787.5, 99, 200, 65, 'test', 'test-v1', true);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$
begin
  if not exists (
    select 1 from public.nutrition_profiles
    where user_id = 'a1111111-1111-4111-8111-111111111111'
  ) then
    raise exception 'RLS probe failed: owner cannot read own nutrition profile';
  end if;

  if exists (
    select 1 from public.nutrition_profiles
    where user_id = 'b2222222-2222-4222-8222-222222222222'
  ) then
    raise exception 'RLS breach: user A can read nutrition profile of user B';
  end if;
end;
$$;

rollback;
