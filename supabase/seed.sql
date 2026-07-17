-- NutriPlan MVP seed data.
-- This file only seeds public catalogue data; test users should be created
-- through Supabase Auth or a dedicated local test script.

insert into public.allergens (code, name, description)
values
  ('peanut', 'Đậu phộng', 'Đậu phộng và sản phẩm từ đậu phộng'),
  ('tree_nut', 'Hạt cây', 'Hạnh nhân, hạt điều, óc chó và các loại hạt cây'),
  ('milk', 'Sữa', 'Sữa và sản phẩm từ sữa'),
  ('egg', 'Trứng', 'Trứng và sản phẩm có thành phần từ trứng'),
  ('soy', 'Đậu nành', 'Đậu nành và sản phẩm từ đậu nành'),
  ('wheat', 'Lúa mì', 'Lúa mì và sản phẩm chứa gluten từ lúa mì'),
  ('fish', 'Cá', 'Cá và sản phẩm từ cá'),
  ('shellfish', 'Hải sản có vỏ', 'Tôm, cua và các loại hải sản có vỏ')
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  is_active = true;

update public.subscription_plans
set is_active = false
where code = 'pilot';

insert into public.subscription_plans (
  code,
  name,
  description,
  price_amount,
  currency,
  billing_interval,
  interval_count,
  features
)
values
  (
    'weekly',
    'NutriPlan 7 ngày',
    'Mở Recipe và kế hoạch dinh dưỡng trong 7 ngày.',
    19000,
    'VND',
    'day',
    7,
    '{
      "access_days": 7,
      "meal_plan_days": 7,
      "plan_refresh_days": 7,
      "recipe_access": true
    }'::jsonb
  ),
  (
    'monthly',
    'NutriPlan 1 tháng',
    'Mở Recipe và kế hoạch được làm mới hằng tuần trong 1 tháng.',
    49000,
    'VND',
    'month',
    1,
    '{
      "access_days": 30,
      "meal_plan_days": 7,
      "plan_refresh_days": 7,
      "recipe_access": true
    }'::jsonb
  ),
  (
    'quarterly',
    'NutriPlan 3 tháng',
    'Mở Recipe và kế hoạch được làm mới hằng tuần trong 3 tháng.',
    129000,
    'VND',
    'month',
    3,
    '{
      "access_days": 90,
      "meal_plan_days": 7,
      "plan_refresh_days": 7,
      "recipe_access": true
    }'::jsonb
  )
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  price_amount = excluded.price_amount,
  currency = excluded.currency,
  billing_interval = excluded.billing_interval,
  interval_count = excluded.interval_count,
  features = excluded.features,
  is_active = true;
