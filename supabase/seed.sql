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

-- ============================================================================
-- PARTNER KITCHEN MARKETPLACE MOCK DATA
-- Development/demo data only. Every statement is idempotent.
-- ============================================================================

insert into public.kitchens (
  name,
  slug,
  description,
  phone,
  email,
  address_text,
  status,
  rating_average,
  rating_count
)
values
  ('FitBox Kitchen', 'fitbox-kitchen', 'Bữa ăn cân bằng và giàu protein cho người bận rộn.', '0900000001', 'fitbox@example.test', 'Quận 3, TP. Hồ Chí Minh', 'active', 4.90, 312),
  ('Green Bowl', 'green-bowl', 'Món lẻ từ nguyên liệu tươi, định lượng dinh dưỡng rõ ràng.', '0900000002', 'greenbowl@example.test', 'Quận 1, TP. Hồ Chí Minh', 'active', 4.80, 186),
  ('Lean Lab', 'lean-lab', 'Gói kiểm soát calorie hướng tới mục tiêu giảm mỡ bền vững.', '0900000003', 'leanlab@example.test', 'Quận Bình Thạnh, TP. Hồ Chí Minh', 'active', 4.90, 248),
  ('An Lành Vegan', 'an-lanh-vegan', 'Thực đơn thuần chay từ đậu, nấm và ngũ cốc nguyên hạt.', '0900000004', 'anlanh@example.test', 'Quận 7, TP. Hồ Chí Minh', 'active', 4.70, 96),
  ('Keto House', 'keto-house', 'Thực đơn low-carb ưu tiên đạm và chất béo tốt.', '0900000005', 'ketohouse@example.test', 'Quận 2, TP. Hồ Chí Minh', 'active', 4.80, 175),
  ('Mom''s Healthy Kitchen', 'moms-healthy-kitchen', 'Bữa cơm nhà ít dầu, ít muối với nguyên liệu theo mùa.', '0900000006', 'momskitchen@example.test', 'Quận 5, TP. Hồ Chí Minh', 'active', 4.60, 73),
  ('Muscle Fuel', 'muscle-fuel', 'Khẩu phần giàu năng lượng và protein dành cho người tập tăng cơ.', '0900000007', 'musclefuel@example.test', 'Quận 10, TP. Hồ Chí Minh', 'active', 4.90, 289),
  ('MediFood Care', 'medifood-care', 'Bữa ăn cân bằng, ít muối và giàu rau xanh.', '0900000008', 'medifood@example.test', 'Quận Phú Nhuận, TP. Hồ Chí Minh', 'active', 4.80, 114),
  ('Office Bite', 'office-bite', 'Bữa trưa văn phòng gọn nhẹ, giao theo cụm tòa nhà.', '0900000009', 'officebite@example.test', 'Quận 1, TP. Hồ Chí Minh', 'active', 4.60, 205),
  ('Salad Stop Mini', 'salad-stop-mini', 'Salad và món nhẹ tươi trong ngày.', '0900000010', 'saladstop@example.test', 'Quận 4, TP. Hồ Chí Minh', 'active', 4.70, 88),
  ('Eat Clean Sài Gòn', 'eat-clean-sai-gon', 'Thực đơn eat-clean luân phiên theo chu kỳ dài hạn.', '0900000011', 'eatclean@example.test', 'Quận Tân Bình, TP. Hồ Chí Minh', 'active', 4.80, 267),
  ('Bếp Nhà Mình', 'bep-nha-minh', 'Món Việt quen thuộc được giảm dầu và nêm nhạt.', '0900000012', 'bepnhaminh@example.test', 'Quận Gò Vấp, TP. Hồ Chí Minh', 'active', 4.70, 142),
  ('Macro Lab', 'macro-lab', 'Khẩu phần tùy chỉnh calorie và macro theo mục tiêu.', '0900000013', 'macrolab@example.test', 'Quận 7, TP. Hồ Chí Minh', 'active', 4.90, 157),
  ('Paleo Corner', 'paleo-corner', 'Món paleo ưu tiên thực phẩm nguyên bản và không ngũ cốc.', '0900000014', 'paleo@example.test', 'Quận 2, TP. Hồ Chí Minh', 'active', 4.50, 48),
  ('Fresh Day', 'fresh-day', 'Bữa nhẹ giàu rau, trái cây và protein vừa đủ.', '0900000015', 'freshday@example.test', 'Quận 6, TP. Hồ Chí Minh', 'active', 4.60, 91),
  ('HomeFit Meals', 'homefit-meals', 'Gói lành mạnh cho gia đình bận rộn.', '0900000016', 'homefit@example.test', 'Thành phố Thủ Đức, TP. Hồ Chí Minh', 'active', 4.80, 133),
  ('Đường Lành', 'duong-lanh', 'Thực đơn kiểm soát tải đường huyết và khẩu phần tinh bột.', '0900000017', 'duonglanh@example.test', 'Quận Phú Nhuận, TP. Hồ Chí Minh', 'active', 4.80, 102),
  ('Bếp Biển Xanh', 'bep-bien-xanh', 'Món cá và hải sản giàu omega-3.', '0900000018', 'bienxanh@example.test', 'Quận 8, TP. Hồ Chí Minh', 'active', 4.70, 121),
  ('Free From Kitchen', 'free-from-kitchen', 'Bếp không gluten với khu sơ chế được tách riêng.', '0900000019', 'freefrom@example.test', 'Quận Bình Thạnh, TP. Hồ Chí Minh', 'active', 4.80, 79),
  ('Bếp An Nhiên', 'bep-an-nhien', 'Món mềm, nêm nhạt dành cho người lớn tuổi.', '0900000020', 'annhien@example.test', 'Quận Tân Phú, TP. Hồ Chí Minh', 'active', 4.90, 138)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  phone = excluded.phone,
  email = excluded.email,
  address_text = excluded.address_text,
  status = excluded.status,
  rating_average = excluded.rating_average,
  rating_count = excluded.rating_count;

with service_area_seed (kitchen_slug, district, delivery_fee, minimum_order_amount) as (
  values
    ('fitbox-kitchen', 'Quận 3', 0::numeric, 0::numeric),
    ('green-bowl', 'Quận 1', 15000, 50000),
    ('lean-lab', 'Quận Bình Thạnh', 0, 0),
    ('an-lanh-vegan', 'Quận 7', 10000, 100000),
    ('keto-house', 'Quận 2', 10000, 100000),
    ('moms-healthy-kitchen', 'Quận 5', 15000, 50000),
    ('muscle-fuel', 'Quận 10', 0, 0),
    ('medifood-care', 'Quận Phú Nhuận', 0, 0),
    ('office-bite', 'Quận 1', 0, 0),
    ('salad-stop-mini', 'Quận 4', 15000, 50000),
    ('eat-clean-sai-gon', 'Quận Tân Bình', 0, 0),
    ('bep-nha-minh', 'Quận Gò Vấp', 10000, 50000),
    ('macro-lab', 'Quận 7', 0, 0),
    ('paleo-corner', 'Quận 2', 15000, 80000),
    ('fresh-day', 'Quận 6', 10000, 100000),
    ('homefit-meals', 'Thành phố Thủ Đức', 0, 0),
    ('duong-lanh', 'Quận Phú Nhuận', 0, 0),
    ('bep-bien-xanh', 'Quận 8', 15000, 80000),
    ('free-from-kitchen', 'Quận Bình Thạnh', 0, 0),
    ('bep-an-nhien', 'Quận Tân Phú', 0, 0)
)
insert into public.kitchen_service_areas (
  kitchen_id,
  city,
  district,
  ward,
  delivery_fee,
  minimum_order_amount,
  is_active
)
select
  k.id,
  'TP. Hồ Chí Minh',
  s.district,
  'Tất cả phường',
  s.delivery_fee,
  s.minimum_order_amount,
  true
from service_area_seed s
join public.kitchens k on k.slug = s.kitchen_slug
on conflict (kitchen_id, city, district, ward) do update
set
  delivery_fee = excluded.delivery_fee,
  minimum_order_amount = excluded.minimum_order_amount,
  is_active = true;

with offer_seed (
  code,
  kitchen_slug,
  offer_type,
  name,
  description,
  image_path,
  price_amount,
  old_price_amount,
  package_days,
  meals_per_day,
  calories_kcal,
  protein_g,
  carbs_g,
  fat_g,
  delivery_description,
  badge,
  distance_km,
  diet_types,
  menu_highlights,
  included_items
) as (
  values
    ('fitbox-balance-7', 'fitbox-kitchen', 'package', 'Balance Lunch · 7 ngày', 'Bữa trưa cân bằng, đổi món mỗi ngày và định lượng rõ ràng.', 'https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=1200&q=85', 469000::numeric, 525000::numeric, 7, 1, 580::numeric, 42::numeric, 61::numeric, 18::numeric, '11:00–12:00 · Miễn phí 3 km', 'Bán chạy', 1.8::numeric, array['Cân bằng','Giàu protein'], array['Gà nướng thảo mộc','Cá basa sốt chanh dây','Bò xào rau củ'], array['7 bữa trưa','Đổi 1 món miễn phí','Tư vấn khẩu phần']),
    ('green-bowl-single', 'green-bowl', 'single_meal', 'Cơm gà gạo lứt sốt tiêu', 'Ức gà áp chảo, gạo lứt, bông cải và sốt tiêu đen ít đường.', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85', 69000, null, null, 1, 605, 46, 67, 17, '35–45 phút', 'Giàu protein', 2.4, array['Giàu protein','Ít đường'], array['Ức gà tiêu đen','Gạo lứt hạt dài','Bông cải hấp'], array['1 phần ăn','Sốt riêng','Bộ muỗng nĩa']),
    ('lean-lab-cut-30', 'lean-lab', 'package', 'Lean Cut · 30 ngày', 'Hai bữa chính mỗi ngày cho mục tiêu giảm mỡ bền vững.', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=85', 3290000, 3690000, 30, 2, 1250, 105, 128, 36, '2 lần/ngày · Miễn phí 5 km', 'Giảm mỡ', 3.2, array['Giảm mỡ','Giàu protein','Ít dầu'], array['Cá hồi khoai nghiền','Bò áp chảo quinoa','Gà teriyaki ít đường'], array['60 bữa chính','Điều chỉnh calorie','Theo dõi hằng tuần']),
    ('an-lanh-vegan-7', 'an-lanh-vegan', 'package', 'Plant Power · 7 ngày', 'Thực đơn thuần chay đủ đạm từ đậu, nấm và ngũ cốc nguyên hạt.', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85', 799000, null, 7, 2, 1450, 62, 188, 48, '06:30–07:30 · 11:00–12:00', 'Thuần chay', 5.1, array['Thuần chay','Nhiều chất xơ'], array['Đậu hũ quinoa','Bún nấm rau củ','Cà ri đậu gà'], array['14 bữa','Sữa hạt 3 ngày','Không dùng bột ngọt']),
    ('keto-house-30', 'keto-house', 'package', 'Keto Reset · 30 ngày', 'Thực đơn low-carb kiểm soát tinh bột, ưu tiên chất béo tốt.', 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=85', 3890000, 4250000, 30, 2, 1550, 110, 42, 105, 'Giao một lần trước 10:30', 'Low-carb', 4.7, array['Keto','Low-carb','Không đường'], array['Cá hồi bơ tỏi','Gà cuộn phô mai','Bò nấm sốt kem'], array['60 bữa','Snack keto 10 ngày','Bảng macro hằng ngày']),
    ('mom-kitchen-single', 'moms-healthy-kitchen', 'single_meal', 'Cá thu Nhật sốt cà & rau luộc', 'Bữa cơm nhà ít muối với cá thu, gạo lứt và rau theo mùa.', 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=85', 79000, null, null, 1, 560, 36, 58, 21, '40–55 phút', 'Cơm nhà', 3.9, array['Cân bằng','Ít muối'], array['Cá thu sốt cà','Gạo lứt','Rau luộc kho quẹt nhạt'], array['1 phần ăn','Canh rau','Trái cây nhỏ']),
    ('muscle-fuel-120', 'muscle-fuel', 'package', 'Mass Builder · 120 ngày', 'Gói dài hạn ba bữa/ngày dành cho người tập tăng cơ.', 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=1200&q=85', 18900000, 21400000, 120, 3, 2450, 175, 286, 68, '2 chuyến/ngày · Miễn phí 8 km', 'Tăng cơ', 4.2, array['Tăng cơ','Giàu protein'], array['Bò steak khoai tây','Gà nướng pasta','Cá hồi cơm Nhật'], array['360 bữa','4 lần điều chỉnh macro','Snack protein mỗi ngày']),
    ('medifood-7', 'medifood-care', 'package', 'Healthy Heart · 7 ngày', 'Bữa ăn ít muối, ít chất béo bão hòa và giàu rau xanh.', 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=85', 1190000, null, 7, 3, 1500, 78, 174, 52, '07:00–08:00 · 11:00–12:00', 'Ít muối', 2.8, array['Ít muối','Cân bằng'], array['Cá hấp gừng','Gà hầm rau củ','Cháo yến mạch'], array['21 bữa','Nhãn sodium mỗi món','Tùy chọn cháo mềm']),
    ('office-bite-30', 'office-bite', 'package', 'Smart Lunch · 30 ngày', 'Bữa trưa văn phòng gọn nhẹ, giao theo cụm tòa nhà.', 'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=1200&q=85', 1690000, 1890000, 30, 1, 620, 38, 72, 20, '10:45–11:45 · Thứ 2–6', 'Văn phòng', 1.2, array['Cân bằng','Văn phòng'], array['Cơm gà Hội An fit','Bún bò ít béo','Mì Ý bò bằm'], array['22 bữa ngày làm việc','Giao tận lễ tân','Đổi lịch trước 20:00']),
    ('salad-stop-single', 'salad-stop-mini', 'single_meal', 'Salad tôm bơ sốt chanh', 'Rau giòn, tôm áp chảo, bơ và sốt chanh tươi đóng riêng.', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=85', 89000, null, null, 1, 455, 31, 29, 26, '25–35 phút', 'Tươi trong ngày', 2.9, array['Low-carb','Pescatarian'], array['Tôm áp chảo','Bơ sáp','Rau rocket'], array['1 salad','Sốt đóng riêng','Bánh mì nguyên cám']),
    ('eat-clean-120', 'eat-clean-sai-gon', 'package', 'Lifestyle 120', 'Gói duy trì thói quen bốn tháng với thực đơn luân phiên 28 ngày.', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=85', 12900000, 14800000, 120, 2, 1750, 112, 190, 55, '2 chuyến/ngày · Nghỉ Chủ nhật', 'Giá tốt dài hạn', 6.2, array['Eat clean','Cân bằng'], array['Gà cajun gạo lứt','Cá dory sốt xoài','Bò nướng bí đỏ'], array['208 bữa','Tạm dừng tối đa 14 ngày','Đánh giá khẩu phần mỗi tháng']),
    ('bep-nha-minh-7', 'bep-nha-minh', 'package', 'Cơm nhà lành mạnh · 7 ngày', 'Món Việt quen thuộc, giảm dầu và nêm nhạt vừa phải.', 'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=1200&q=85', 549000, null, 7, 1, 650, 35, 78, 22, '10:30–11:30', 'Vị Việt', 7.3, array['Cơm nhà','Ít dầu'], array['Thịt nạc kho trứng','Cá diêu hồng hấp','Canh chua tôm'], array['7 bữa trưa','Canh mỗi ngày','Tráng miệng 3 ngày']),
    ('macro-lab-30', 'macro-lab', 'package', 'Macro Precision · 30 ngày', 'Tùy chỉnh mức 1.500–2.200 kcal và theo dõi macro theo mục tiêu.', 'https://images.unsplash.com/photo-1539136788836-5699e78bfc75?auto=format&fit=crop&w=1200&q=85', 4590000, null, 30, 3, 1850, 135, 205, 54, 'Giao sáng toàn bộ khẩu phần', 'Tùy chỉnh macro', 5.8, array['Tùy chỉnh macro','Thể thao'], array['Turkey rice bowl','Beef burrito fit','Protein pancake'], array['90 bữa','Chọn mức calorie','Báo cáo macro tuần']),
    ('paleo-corner-single', 'paleo-corner', 'single_meal', 'Bò nướng bí đỏ & hạt', 'Bữa paleo không ngũ cốc, ưu tiên thực phẩm nguyên bản.', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=85', 109000, null, null, 1, 610, 44, 38, 31, '35–50 phút', 'Paleo', 4.1, array['Paleo','Không gluten'], array['Bò nướng','Bí đỏ','Hạt điều rang'], array['1 phần ăn','Sốt thảo mộc','Không ngũ cốc']),
    ('fresh-day-7', 'fresh-day', 'package', 'Detox Balance · 7 ngày', 'Bữa nhẹ giàu rau, trái cây và protein vừa đủ; không ép cân cực đoan.', 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=1200&q=85', 1390000, null, 7, 3, 1350, 72, 172, 40, '06:00–07:00', 'Nhiều rau', 6.9, array['Nhiều chất xơ','Ít chế biến'], array['Overnight oat','Gỏi cuốn tôm','Soup bí đỏ gà'], array['21 bữa','7 chai nước rau quả','Không đường tinh luyện']),
    ('homefit-30', 'homefit-meals', 'package', 'Family Fit · 30 ngày', 'Gói hai người với khẩu phần lành mạnh, phù hợp gia đình bận rộn.', 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=1200&q=85', 5490000, 5990000, 30, 2, 1650, 98, 185, 58, '16:30–18:00', 'Cho 2 người', 8.4, array['Gia đình','Cân bằng'], array['Gà quay rau củ','Cá kho tộ fit','Mì udon bò'], array['120 khẩu phần','Giao một lần buổi chiều','Tạm dừng 5 ngày']),
    ('diabetic-friendly-120', 'duong-lanh', 'package', 'Glycemic Care · 120 ngày', 'Thực đơn kiểm soát tải đường huyết, khẩu phần tinh bột rõ ràng.', 'https://images.unsplash.com/photo-1539136788836-5699e78bfc75?auto=format&fit=crop&w=1200&q=85', 16800000, null, 120, 3, 1600, 92, 145, 62, '2 chuyến/ngày', 'Kiểm soát đường', 3.1, array['Ít đường','GI thấp'], array['Cá hấp miến dong','Gà nấm gạo lứt','Đậu hũ non rau củ'], array['360 bữa','Nhãn carb từng bữa','Điều chỉnh khẩu phần mỗi tháng']),
    ('bep-bien-single', 'bep-bien-xanh', 'single_meal', 'Cá hồi áp chảo sốt chanh', 'Cá hồi, khoai tây bi và salad theo mùa giàu omega-3.', 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=85', 119000, null, null, 1, 536, 38, 32, 29, '40–50 phút', 'Omega-3', 7.6, array['Pescatarian','Low-carb'], array['Cá hồi Na Uy','Khoai tây bi','Salad sốt chanh'], array['1 phần ăn','Sốt đóng riêng','Soup trong ngày']),
    ('gluten-free-7', 'free-from-kitchen', 'package', 'Gluten-Free Week', 'Gói không gluten với nguyên liệu và khu sơ chế được tách riêng.', 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=85', 1690000, null, 7, 3, 1550, 88, 166, 59, '07:00–08:00 · 11:00–12:00', 'Không gluten', 3.6, array['Không gluten','Cân bằng'], array['Bánh kê trứng','Cơm gà sốt nấm','Mì gạo cá nướng'], array['21 bữa','Khu sơ chế riêng','Nhãn dị ứng rõ ràng']),
    ('senior-meal-30', 'bep-an-nhien', 'package', 'Dinh dưỡng tuổi vàng · 30 ngày', 'Món mềm, dễ nhai, nêm nhạt và phân bổ đạm phù hợp người lớn tuổi.', 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=85', 4190000, null, 30, 3, 1500, 82, 168, 55, '06:30–07:30 · 10:30–11:30', 'Món mềm', 8.1, array['Món mềm','Ít muối'], array['Cháo cá hồi','Gà hầm củ sen','Cá basa hấp gừng'], array['90 bữa','Cháo thay thế theo yêu cầu','Gọi xác nhận giao mỗi ngày'])
)
insert into public.kitchen_offers (
  code,
  kitchen_id,
  type,
  name,
  description,
  image_path,
  price_amount,
  old_price_amount,
  currency,
  delivery_fee,
  package_days,
  meals_per_day,
  calories_kcal,
  protein_g,
  carbs_g,
  fat_g,
  delivery_description,
  badge,
  distance_km,
  diet_types,
  menu_highlights,
  included_items,
  order_cutoff_hours,
  capacity_per_day,
  cancellation_policy,
  status,
  available_from
)
select
  s.code,
  k.id,
  s.offer_type::public.offer_type,
  s.name,
  s.description,
  s.image_path,
  s.price_amount,
  s.old_price_amount,
  'VND',
  0,
  s.package_days,
  s.meals_per_day,
  s.calories_kcal,
  s.protein_g,
  s.carbs_g,
  s.fat_g,
  s.delivery_description,
  s.badge,
  s.distance_km,
  s.diet_types,
  s.menu_highlights,
  s.included_items,
  case when s.offer_type = 'single_meal' then 2 else 12 end,
  100,
  'Hủy hoặc đổi lịch trước giờ chốt đơn của bếp.',
  'active'::public.offer_status,
  date '2026-07-01'
from offer_seed s
join public.kitchens k on k.slug = s.kitchen_slug
on conflict (code) where code is not null do update
set
  kitchen_id = excluded.kitchen_id,
  type = excluded.type,
  name = excluded.name,
  description = excluded.description,
  image_path = excluded.image_path,
  price_amount = excluded.price_amount,
  old_price_amount = excluded.old_price_amount,
  package_days = excluded.package_days,
  meals_per_day = excluded.meals_per_day,
  calories_kcal = excluded.calories_kcal,
  protein_g = excluded.protein_g,
  carbs_g = excluded.carbs_g,
  fat_g = excluded.fat_g,
  delivery_description = excluded.delivery_description,
  badge = excluded.badge,
  distance_km = excluded.distance_km,
  diet_types = excluded.diet_types,
  menu_highlights = excluded.menu_highlights,
  included_items = excluded.included_items,
  order_cutoff_hours = excluded.order_cutoff_hours,
  capacity_per_day = excluded.capacity_per_day,
  cancellation_policy = excluded.cancellation_policy,
  status = excluded.status,
  available_from = excluded.available_from;

with offer_order (offer_code, seed_order) as (
  values
    ('fitbox-balance-7', 1),
    ('green-bowl-single', 2),
    ('lean-lab-cut-30', 3),
    ('an-lanh-vegan-7', 4),
    ('keto-house-30', 5),
    ('mom-kitchen-single', 6),
    ('muscle-fuel-120', 7),
    ('medifood-7', 8),
    ('office-bite-30', 9),
    ('salad-stop-single', 10),
    ('eat-clean-120', 11),
    ('bep-nha-minh-7', 12),
    ('macro-lab-30', 13),
    ('paleo-corner-single', 14),
    ('fresh-day-7', 15),
    ('homefit-30', 16),
    ('diabetic-friendly-120', 17),
    ('bep-bien-single', 18),
    ('gluten-free-7', 19),
    ('senior-meal-30', 20)
),
review_content as (
  select
    array['Minh Anh','Hoàng Nam','Thu Hà','Quốc Bảo','Ngọc Linh','Gia Huy']::text[] as authors,
    array[
      'Khẩu phần vừa đủ, đóng gói sạch và thông tin dinh dưỡng khá sát với mục tiêu của mình.',
      'Món thay đổi đều, giao đúng khung giờ. Mình thích nhất là bếp ghi rõ calorie và protein.',
      'Vị vừa ăn, rau còn tươi. Bếp hỗ trợ đổi món khi mình báo dị ứng rất nhanh.',
      'Theo gói được vài tuần thấy đỡ phải suy nghĩ ăn gì, cân nặng cũng ổn định hơn.',
      'Chất lượng ổn so với giá, phần đạm nhiều và không bị quá dầu như đồ ăn ngoài.',
      'Có vài hôm giao trễ khoảng 10 phút nhưng bếp chủ động báo, tổng thể vẫn đáng mua.'
    ]::text[] as comments
),
review_seed as (
  select
    ko.id as offer_id,
    oo.offer_code || '-review-' || review_number as external_code,
    rc.authors[((oo.seed_order + review_number - 2) % 6) + 1] as author_name,
    case
      when review_number = 3 and ((oo.seed_order - 1) % 4) = 0 then 4
      else 5
    end as rating,
    rc.comments[((((oo.seed_order - 1) * 2) + review_number - 1) % 6) + 1] as comment,
    make_date(2026, 7, 11 + review_number) as reviewed_on
  from offer_order oo
  join public.kitchen_offers ko on ko.code = oo.offer_code
  cross join generate_series(1, 3) as review_number
  cross join review_content rc
)
insert into public.kitchen_offer_reviews (
  offer_id,
  external_code,
  author_name,
  rating,
  comment,
  verified_purchase,
  reviewed_on,
  is_visible
)
select
  offer_id,
  external_code,
  author_name,
  rating,
  comment,
  true,
  reviewed_on,
  true
from review_seed
on conflict (external_code) do update
set
  offer_id = excluded.offer_id,
  author_name = excluded.author_name,
  rating = excluded.rating,
  comment = excluded.comment,
  verified_purchase = excluded.verified_purchase,
  reviewed_on = excluded.reviewed_on,
  is_visible = excluded.is_visible;
