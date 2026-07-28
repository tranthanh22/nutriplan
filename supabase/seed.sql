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

insert into public.diet_types (code, name, emoji, description)
values
  ('standard', 'Tiêu chuẩn', '🍽️', 'Không có hạn chế đặc biệt'),
  ('vegetarian', 'Ăn chay thanh đạm', '🥦', 'Không ăn thịt, có thể ăn trứng & sữa'),
  ('vegan', 'Ăn chay thuần (Vegan)', '🌱', 'Không dùng sản phẩm từ động vật'),
  ('keto', 'Keto / Low-Carb', '🥑', 'Ít tinh bột, giàu chất béo tốt'),
  ('paleo', 'Paleo', '🍖', 'Thực phẩm tự nhiên, không chế biến sẵn'),
  ('gluten_free', 'Không Gluten', '🌾', 'Né tránh lúa mì & ngũ cốc có gluten')
on conflict (code) do update
set
  name = excluded.name,
  emoji = excluded.emoji,
  description = excluded.description,
  is_active = true;

insert into public.ingredients (name, normalized_name, default_unit, is_active)
values
  ('Ức gà', 'uc_ga', 'gam', true),
  ('Thịt bò', 'thit_bo', 'gam', true),
  ('Tôm tươi', 'tom_tuoi', 'gam', true),
  ('Cá hồi', 'ca_hoi', 'gam', true),
  ('Trứng gà', 'trung_ga', 'quả', true),
  ('Đậu phụ', 'dau_phu', 'gam', true),
  ('Gạo lứt', 'gao_lut', 'gam', true),
  ('Yến mạch', 'yen_mach', 'gam', true),
  ('Khoai lang', 'khoai_lang', 'gam', true),
  ('Bông cải xanh', 'bong_cai_xanh', 'gam', true),
  ('Rau bina (Cải bó xôi)', 'rau_bina', 'gam', true),
  ('Bơ quả', 'bo_qua', 'quả', true),
  ('Nấm đùi gà', 'nam_dui_ga', 'gam', true),
  ('Chuối chín', 'chuoi_chin', 'quả', true),
  ('Táo tây', 'tao_tay', 'quả', true),
  ('Sữa tươi không đường', 'sua_tuoi_khong_duong', 'ml', true),
  ('Sữa chua không đường', 'sua_chua_khong_duong', 'hũ', true),
  ('Hạnh nhân', 'hanh_nhan', 'gam', true)
on conflict (normalized_name) do update
set
  name = excluded.name,
  default_unit = excluded.default_unit,
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
