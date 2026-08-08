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

-- ============================================================================
-- CATALOG EXPANSION: 50 DISHES + 20 PARTNER KITCHENS
-- Mock/demo data. Slugs and offer codes make this block safe to run repeatedly.
-- ============================================================================

begin;

create temporary table nutriplan_dish_seed (
  seed_order integer primary key,
  slug text not null,
  name text not null,
  ingredient_summary text not null,
  dish_kind text not null,
  meal_types text[] not null,
  cuisine text not null
) on commit drop;

insert into nutriplan_dish_seed
  (seed_order, slug, name, ingredient_summary, dish_kind, meal_types, cuisine)
values
  (1, 'chao-ga-nam-huong', 'Cháo gà nấm hương', 'Ức gà, gạo tẻ, nấm hương', 'meal', array['breakfast'], 'Việt Nam'),
  (2, 'com-ga-gao-lut-rau-cu', 'Cơm gà gạo lứt rau củ', 'Ức gà, gạo lứt, bông cải xanh', 'meal', array['lunch','dinner'], 'Việt Nam'),
  (3, 'ca-hoi-ap-chao-khoai-lang', 'Cá hồi áp chảo khoai lang', 'Cá hồi, khoai lang, măng tây', 'meal', array['lunch','dinner'], 'Âu'),
  (4, 'bo-xao-bong-cai', 'Bò xào bông cải', 'Thịt bò nạc, bông cải xanh, ớt chuông', 'meal', array['lunch','dinner'], 'Việt Nam'),
  (5, 'bun-ca-thi-la', 'Bún cá thì là', 'Cá basa, bún gạo, thì là', 'meal', array['breakfast','lunch'], 'Việt Nam'),
  (6, 'pho-ga-it-beo', 'Phở gà ít béo', 'Ức gà, bánh phở, hành lá', 'meal', array['breakfast','lunch'], 'Việt Nam'),
  (7, 'com-tam-uc-ga-nuong', 'Cơm tấm ức gà nướng', 'Ức gà, gạo tấm, dưa leo', 'meal', array['lunch','dinner'], 'Việt Nam'),
  (8, 'mien-ga-nam', 'Miến gà nấm', 'Ức gà, miến dong, nấm đông cô', 'meal', array['breakfast','dinner'], 'Việt Nam'),
  (9, 'ca-basa-hap-gung', 'Cá basa hấp gừng', 'Cá basa, gừng, cải thìa', 'meal', array['lunch','dinner'], 'Việt Nam'),
  (10, 'tom-xao-hat-dieu', 'Tôm xào hạt điều', 'Tôm, hạt điều, ớt chuông', 'meal', array['lunch','dinner'], 'Châu Á'),
  (11, 'dau-hu-sot-nam', 'Đậu hũ sốt nấm', 'Đậu hũ, nấm đùi gà, cải bó xôi', 'meal', array['lunch','dinner'], 'Chay'),
  (12, 'ca-ri-dau-ga', 'Cà ri đậu gà', 'Đậu gà, cà chua, nước cốt dừa', 'meal', array['lunch','dinner'], 'Ấn Độ'),
  (13, 'bun-gao-lut-dau-hu', 'Bún gạo lứt đậu hũ', 'Bún gạo lứt, đậu hũ, rau xà lách', 'meal', array['lunch','dinner'], 'Chay'),
  (14, 'quinoa-rau-cu-nuong', 'Quinoa rau củ nướng', 'Hạt quinoa, bí ngòi, ớt chuông', 'meal', array['lunch','dinner'], 'Địa Trung Hải'),
  (15, 'salad-ga-bo', 'Salad gà bơ', 'Ức gà, quả bơ, rau xà lách', 'meal', array['lunch','dinner'], 'Âu'),
  (16, 'salad-ca-ngu-dau-trang', 'Salad cá ngừ đậu trắng', 'Cá ngừ, đậu trắng, cà chua bi', 'meal', array['lunch','dinner'], 'Địa Trung Hải'),
  (17, 'pasta-nguyen-cam-bo-bam', 'Pasta nguyên cám bò bằm', 'Mì Ý nguyên cám, thịt bò nạc, cà chua', 'meal', array['lunch','dinner'], 'Ý'),
  (18, 'mi-soba-ga-me', 'Mì soba gà mè', 'Mì soba, ức gà, mè rang', 'meal', array['lunch','dinner'], 'Nhật Bản'),
  (19, 'com-bo-bulgogi-fit', 'Cơm bò bulgogi fit', 'Thịt bò nạc, gạo lứt, kim chi', 'meal', array['lunch','dinner'], 'Hàn Quốc'),
  (20, 'ca-thu-sot-ca', 'Cá thu sốt cà', 'Cá thu, cà chua, gạo lứt', 'meal', array['lunch','dinner'], 'Việt Nam'),
  (21, 'ga-nuong-chanh-sa', 'Gà nướng chanh sả', 'Ức gà, sả, chanh', 'meal', array['lunch','dinner'], 'Việt Nam'),
  (22, 'thit-nac-heo-kho-tieu', 'Thịt nạc heo kho tiêu', 'Thịt nạc heo, tiêu đen, trứng cút', 'meal', array['lunch','dinner'], 'Việt Nam'),
  (23, 'trung-cuon-rau-cu', 'Trứng cuộn rau củ', 'Trứng gà, cà rốt, hành lá', 'meal', array['breakfast','lunch'], 'Châu Á'),
  (24, 'chao-yen-mach-ca-hoi', 'Cháo yến mạch cá hồi', 'Yến mạch, cá hồi, cải bó xôi', 'meal', array['breakfast'], 'Âu'),
  (25, 'soup-bi-do-ga-xe', 'Soup bí đỏ gà xé', 'Bí đỏ, ức gà, sữa tươi', 'meal', array['breakfast','dinner'], 'Âu'),
  (26, 'soup-dau-lang-ca-chua', 'Soup đậu lăng cà chua', 'Đậu lăng, cà chua, cần tây', 'meal', array['lunch','dinner'], 'Địa Trung Hải'),
  (27, 'com-nam-tempeh', 'Cơm nấm tempeh', 'Tempeh, gạo lứt, nấm đùi gà', 'meal', array['lunch','dinner'], 'Chay'),
  (28, 'burrito-bowl-ga', 'Burrito bowl gà', 'Ức gà, gạo lứt, đậu đen', 'meal', array['lunch','dinner'], 'Mexico'),
  (29, 'poke-ca-hoi-gao-lut', 'Poke cá hồi gạo lứt', 'Cá hồi, gạo lứt, rong biển', 'meal', array['lunch','dinner'], 'Hawaii'),
  (30, 'com-ga-teriyaki-it-duong', 'Cơm gà teriyaki ít đường', 'Ức gà, gạo lứt, bông cải xanh', 'meal', array['lunch','dinner'], 'Nhật Bản'),
  (31, 'bo-ap-chao-quinoa', 'Bò áp chảo quinoa', 'Thịt bò nạc, hạt quinoa, bí ngòi', 'meal', array['lunch','dinner'], 'Âu'),
  (32, 'ca-dieu-hong-hap-xi-dau', 'Cá diêu hồng hấp xì dầu', 'Cá diêu hồng, gừng, hành lá', 'meal', array['lunch','dinner'], 'Việt Nam'),
  (33, 'goi-cuon-tom-gao-lut', 'Gỏi cuốn tôm gạo lứt', 'Tôm, bánh tráng gạo lứt, rau xà lách', 'meal', array['lunch','dinner'], 'Việt Nam'),
  (34, 'banh-mi-nguyen-cam-trung-bo', 'Bánh mì nguyên cám trứng bơ', 'Bánh mì nguyên cám, trứng gà, quả bơ', 'meal', array['breakfast'], 'Âu'),
  (35, 'pancake-yen-mach-chuoi', 'Pancake yến mạch chuối', 'Yến mạch, chuối, trứng gà', 'meal', array['breakfast'], 'Âu'),
  (36, 'overnight-oats-berries', 'Overnight oats berries', 'Yến mạch, sữa chua Hy Lạp, dâu tây', 'meal', array['breakfast'], 'Âu'),
  (37, 'sua-chua-hy-lap-trai-cay', 'Sữa chua Hy Lạp trái cây', 'Sữa chua Hy Lạp, dâu tây, hạt chia', 'snack', array['snack'], 'Âu'),
  (38, 'tao-bo-dau-phong', 'Táo bơ đậu phộng', 'Táo, bơ đậu phộng, hạt chia', 'snack', array['snack'], 'Âu'),
  (39, 'hat-rang-khong-muoi', 'Hạt rang không muối', 'Hạnh nhân, hạt điều, hạt bí', 'snack', array['snack'], 'Quốc tế'),
  (40, 'thanh-yen-mach-cacao', 'Thanh yến mạch cacao', 'Yến mạch, cacao, chà là', 'snack', array['snack'], 'Âu'),
  (41, 'trung-luoc-ca-chua-bi', 'Trứng luộc cà chua bi', 'Trứng gà, cà chua bi, rau xà lách', 'snack', array['snack'], 'Quốc tế'),
  (42, 'dau-nanh-nhat-luoc', 'Đậu nành Nhật luộc', 'Đậu nành Nhật, muối biển, mè rang', 'snack', array['snack'], 'Nhật Bản'),
  (43, 'pudding-hat-chia-xoai', 'Pudding hạt chia xoài', 'Hạt chia, xoài, sữa hạnh nhân', 'snack', array['snack'], 'Âu'),
  (44, 'khoai-lang-sua-chua', 'Khoai lang sữa chua', 'Khoai lang, sữa chua Hy Lạp, quế', 'snack', array['snack'], 'Quốc tế'),
  (45, 'smoothie-chuoi-yen-mach', 'Smoothie chuối yến mạch', 'Chuối, yến mạch, sữa tươi', 'drink', array['snack'], 'Quốc tế'),
  (46, 'sinh-to-bo-cai-bo-xoi', 'Sinh tố bơ cải bó xôi', 'Quả bơ, cải bó xôi, sữa hạnh nhân', 'drink', array['snack'], 'Quốc tế'),
  (47, 'sua-hat-hanh-nhan-khong-duong', 'Sữa hạt hạnh nhân không đường', 'Hạnh nhân, nước lọc, chà là', 'drink', array['breakfast','snack'], 'Quốc tế'),
  (48, 'nuoc-ep-cam-ca-rot', 'Nước ép cam cà rốt', 'Cam, cà rốt, gừng', 'drink', array['breakfast','snack'], 'Quốc tế'),
  (49, 'protein-cacao-lanh', 'Protein cacao lạnh', 'Sữa tươi, whey protein, cacao', 'drink', array['snack'], 'Thể thao'),
  (50, 'tra-xanh-chanh-bac-ha', 'Trà xanh chanh bạc hà', 'Trà xanh, chanh, bạc hà', 'drink', array['snack'], 'Châu Á');

insert into public.dishes (
  slug, name, short_description, ingredient_summary, image_path,
  meal_types, cuisine, prep_time_minutes, cook_time_minutes,
  difficulty, status, published_at, dish_kind
)
select
  slug,
  name,
  case dish_kind
    when 'drink' then name || ' không thêm đường tinh luyện, phù hợp dùng trong ngày.'
    when 'snack' then name || ' với khẩu phần gọn nhẹ và dinh dưỡng được định lượng.'
    else name || ' cân bằng đạm, tinh bột và rau theo khẩu phần NutriPlan.'
  end,
  ingredient_summary,
  case dish_kind
    when 'drink' then 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1200&q=85'
    when 'snack' then 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=1200&q=85'
    else 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85'
  end,
  meal_types::public.meal_type[],
  cuisine,
  case when dish_kind = 'drink' then 5 else 10 + seed_order % 8 end,
  case when dish_kind = 'drink' then 0 when dish_kind = 'snack' then 8 else 15 + seed_order % 20 end,
  case when dish_kind = 'drink' then 1 else 1 + seed_order % 3 end,
  'active',
  now(),
  dish_kind::public.dish_kind
from nutriplan_dish_seed
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
  published_at = excluded.published_at,
  dish_kind = excluded.dish_kind,
  updated_at = now();

insert into public.dish_nutrition (
  dish_id, serving_name, serving_grams, calories_kcal,
  protein_g, carbs_g, fat_g, fiber_g, sodium_mg, source_note,
  verified_at, cholesterol_mg, potassium_mg, calcium_mg, iron_mg,
  magnesium_mg, vitamin_a_mcg, vitamin_c_mg, vitamin_d_mcg, vitamin_b12_mcg
)
select
  d.id,
  '1 khẩu phần',
  case s.dish_kind when 'meal' then 380 when 'snack' then 180 else 350 end,
  case s.dish_kind
    when 'meal' then 360 + (s.seed_order % 9) * 35
    when 'snack' then 150 + (s.seed_order % 5) * 25
    else 60 + (s.seed_order % 5) * 35
  end,
  case s.dish_kind when 'meal' then 18 + (s.seed_order % 7) * 5 when 'snack' then 6 + (s.seed_order % 4) * 3 else 2 + (s.seed_order % 5) * 4 end,
  case s.dish_kind when 'meal' then 35 + (s.seed_order % 8) * 6 when 'snack' then 14 + (s.seed_order % 5) * 5 else 10 + (s.seed_order % 6) * 7 end,
  case s.dish_kind when 'meal' then 10 + (s.seed_order % 6) * 3 when 'snack' then 5 + (s.seed_order % 5) * 3 else 1 + (s.seed_order % 4) * 2 end,
  3 + (s.seed_order % 8),
  case s.dish_kind when 'meal' then 280 + (s.seed_order % 8) * 55 else 40 + (s.seed_order % 5) * 35 end,
  'Số liệu mock ước tính theo một khẩu phần; cần chuyên gia xác minh trước khi dùng lâm sàng.',
  now(),
  case when s.ingredient_summary ilike any (array['%gà%','%bò%','%trứng%','%cá%','%tôm%']) then 45 + (s.seed_order % 5) * 18 else 0 end,
  280 + (s.seed_order % 10) * 45,
  45 + (s.seed_order % 7) * 18,
  1.2 + (s.seed_order % 6) * 0.5,
  35 + (s.seed_order % 8) * 8,
  120 + (s.seed_order % 9) * 45,
  8 + (s.seed_order % 8) * 5,
  case when s.ingredient_summary ilike any (array['%cá%','%trứng%','%sữa%']) then 1.5 + (s.seed_order % 4) * 0.8 else 0 end,
  case when s.ingredient_summary ilike any (array['%gà%','%bò%','%trứng%','%cá%','%tôm%','%sữa%']) then 0.7 + (s.seed_order % 5) * 0.4 else 0 end
from nutriplan_dish_seed s
join public.dishes d on d.slug = s.slug
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
  cholesterol_mg = excluded.cholesterol_mg,
  potassium_mg = excluded.potassium_mg,
  calcium_mg = excluded.calcium_mg,
  iron_mg = excluded.iron_mg,
  magnesium_mg = excluded.magnesium_mg,
  vitamin_a_mcg = excluded.vitamin_a_mcg,
  vitamin_c_mg = excluded.vitamin_c_mg,
  vitamin_d_mcg = excluded.vitamin_d_mcg,
  vitamin_b12_mcg = excluded.vitamin_b12_mcg,
  updated_at = now();

with ingredient_seed as (
  select min(btrim(value)) as name, lower(btrim(value)) as normalized_name
  from nutriplan_dish_seed s
  cross join lateral regexp_split_to_table(s.ingredient_summary, '\s*,\s*') as value
  group by lower(btrim(value))
)
insert into public.ingredients (name, normalized_name, default_unit, is_active)
select name, normalized_name, 'g', true
from ingredient_seed
on conflict (normalized_name) do update
set name = excluded.name, default_unit = excluded.default_unit, is_active = true, updated_at = now();

with expanded as (
  select
    s.slug,
    btrim(value) as ingredient_name,
    ingredient_order
  from nutriplan_dish_seed s
  cross join lateral regexp_split_to_table(s.ingredient_summary, '\s*,\s*')
    with ordinality as ingredient(value, ingredient_order)
)
insert into public.dish_ingredients (
  dish_id, ingredient_id, quantity, unit, preparation_note, is_optional, sort_order
)
select
  d.id,
  i.id,
  case e.ingredient_order when 1 then 150 when 2 then 100 else 60 end,
  'g',
  'Sơ chế sạch và định lượng theo khẩu phần',
  false,
  e.ingredient_order::smallint
from expanded e
join public.dishes d on d.slug = e.slug
join public.ingredients i on i.normalized_name = lower(e.ingredient_name)
on conflict (dish_id, ingredient_id) do update
set
  quantity = excluded.quantity,
  unit = excluded.unit,
  preparation_note = excluded.preparation_note,
  is_optional = excluded.is_optional,
  sort_order = excluded.sort_order;

insert into public.recipes (
  dish_id, instructions, cooking_tips, storage_instructions, safety_notes, version
)
select
  d.id,
  case s.dish_kind
    when 'drink' then jsonb_build_array(
      'Cân đủ nguyên liệu và làm lạnh trước khi pha.',
      'Xay hoặc hãm đến khi đồng nhất, không thêm đường tinh luyện.',
      'Chia đúng một khẩu phần và dùng ngay.'
    )
    when 'snack' then jsonb_build_array(
      'Chuẩn bị nguyên liệu theo đúng định lượng.',
      'Trộn hoặc chế biến tối giản, hạn chế dầu và đường.',
      'Chia một khẩu phần trước khi dùng.'
    )
    else jsonb_build_array(
      'Sơ chế và cân đủ nguyên liệu theo khẩu phần.',
      'Nấu chín phần đạm và tinh bột, ưu tiên hấp, luộc, áp chảo ít dầu.',
      'Hoàn thiện với rau, nêm vừa ăn và dùng khi còn ấm.'
    )
  end,
  'Có thể điều chỉnh gia vị nhưng không tự ý tăng dầu, đường hoặc nước sốt.',
  case when s.dish_kind = 'drink' then 'Nên dùng ngay sau khi pha.' else 'Bảo quản lạnh tối đa 24 giờ trong hộp kín.' end,
  'Các giá trị dinh dưỡng là dữ liệu mock; kiểm tra dị ứng cá nhân trước khi dùng.',
  1
from nutriplan_dish_seed s
join public.dishes d on d.slug = s.slug
on conflict (dish_id) do update
set
  instructions = excluded.instructions,
  cooking_tips = excluded.cooking_tips,
  storage_instructions = excluded.storage_instructions,
  safety_notes = excluded.safety_notes,
  updated_at = now();

create temporary table nutriplan_kitchen_seed (
  seed_order integer primary key,
  slug text not null,
  name text not null,
  district text not null,
  specialty text not null
) on commit drop;

insert into nutriplan_kitchen_seed
  (seed_order, slug, name, district, specialty)
values
  (1, 'healthy-hub-saigon', 'Healthy Hub Sài Gòn', 'Quận 1', 'Cân bằng'),
  (2, 'bep-gao-lut', 'Bếp Gạo Lứt', 'Quận 3', 'Eat clean'),
  (3, 'protein-station', 'Protein Station', 'Quận 10', 'Giàu protein'),
  (4, 'vegan-bloom', 'Vegan Bloom', 'Quận 7', 'Thuần chay'),
  (5, 'low-carb-lab', 'Low Carb Lab', 'Thành phố Thủ Đức', 'Low-carb'),
  (6, 'bep-thuan-viet-fit', 'Bếp Thuần Việt Fit', 'Quận 5', 'Cơm Việt'),
  (7, 'fit-meal-thu-duc', 'Fit Meal Thủ Đức', 'Thành phố Thủ Đức', 'Thể thao'),
  (8, 'ocean-fit-kitchen', 'Ocean Fit Kitchen', 'Quận 4', 'Hải sản'),
  (9, 'daily-macro', 'Daily Macro', 'Quận Bình Thạnh', 'Tùy chỉnh macro'),
  (10, 'bep-moc-healthy', 'Bếp Mộc Healthy', 'Quận Phú Nhuận', 'Ít chế biến'),
  (11, 'green-fork', 'Green Fork', 'Quận 2', 'Nhiều rau'),
  (12, 'gym-food-factory', 'Gym Food Factory', 'Quận Tân Bình', 'Tăng cơ'),
  (13, 'fresh-bento', 'Fresh Bento', 'Quận 1', 'Bento'),
  (14, 'bep-chay-sen', 'Bếp Chay Sen', 'Quận 6', 'Chay'),
  (15, 'wellness-kitchen', 'Wellness Kitchen', 'Quận 7', 'Ít muối'),
  (16, 'urban-healthy', 'Urban Healthy', 'Quận 3', 'Văn phòng'),
  (17, 'com-nha-fit', 'Cơm Nhà Fit', 'Quận Gò Vấp', 'Cơm nhà'),
  (18, 'nutribox-express', 'NutriBox Express', 'Quận Tân Phú', 'Giao nhanh'),
  (19, 'vita-meal', 'Vita Meal', 'Quận Bình Thạnh', 'Vitamin và khoáng chất'),
  (20, 'balance-bento', 'Balance Bento', 'Quận 11', 'Cân bằng');

insert into public.kitchens (
  slug, name, description, logo_path, phone, email, address_text,
  status, rating_average, rating_count
)
select
  slug,
  name,
  'Bếp đối tác chuyên thực đơn ' || lower(specialty) || ', công khai khẩu phần và thông tin dinh dưỡng.',
  'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=600&q=85',
  '0911' || lpad(seed_order::text, 6, '0'),
  slug || '@example.test',
  district || ', TP. Hồ Chí Minh',
  'active',
  4.3 + (seed_order % 7) * 0.1,
  35 + seed_order * 9
from nutriplan_kitchen_seed
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  logo_path = excluded.logo_path,
  phone = excluded.phone,
  email = excluded.email,
  address_text = excluded.address_text,
  status = 'active',
  rating_average = excluded.rating_average,
  rating_count = excluded.rating_count,
  updated_at = now();

insert into public.kitchen_service_areas (
  kitchen_id, city, district, ward, delivery_fee, minimum_order_amount, is_active
)
select
  k.id,
  'TP. Hồ Chí Minh',
  s.district,
  'Tất cả phường',
  case when s.seed_order % 3 = 0 then 0 else 10000 + (s.seed_order % 2) * 5000 end,
  case when s.seed_order % 4 = 1 then 0 else 50000 end,
  true
from nutriplan_kitchen_seed s
join public.kitchens k on k.slug = s.slug
on conflict (kitchen_id, city, district, ward) do update
set
  delivery_fee = excluded.delivery_fee,
  minimum_order_amount = excluded.minimum_order_amount,
  is_active = true;

with offer_seed as (
  select
    s.*,
    case s.seed_order % 4 when 1 then null when 2 then 7 when 3 then 30 else 120 end as package_days,
    case s.seed_order % 4 when 1 then 1 else 1 + (s.seed_order % 3) end as meals_per_day
  from nutriplan_kitchen_seed s
)
insert into public.kitchen_offers (
  code, kitchen_id, type, name, description, image_path, price_amount,
  old_price_amount, currency, delivery_fee, package_days, meals_per_day,
  calories_kcal, protein_g, carbs_g, fat_g, diet_types, menu_highlights,
  included_items, delivery_description, badge, distance_km,
  order_cutoff_hours, capacity_per_day, cancellation_policy, status, available_from
)
select
  s.slug || '-signature-' || coalesce(s.package_days::text, 'single'),
  k.id,
  case when s.package_days is null then 'single_meal' else 'package' end::public.offer_type,
  s.name || ' · ' || case when s.package_days is null then 'Món lẻ' else s.package_days || ' ngày' end,
  'Gói ' || lower(s.specialty) || ' với món thay đổi theo lịch và thông tin dinh dưỡng mỗi ngày.',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=85',
  case s.package_days when 7 then 799000 when 30 then 2990000 when 120 then 10990000 else 79000 end,
  case s.package_days when 7 then 899000 when 30 then 3390000 when 120 then 12490000 else null end,
  'VND',
  0,
  s.package_days,
  s.meals_per_day,
  case when s.package_days is null then 580 else 520 * s.meals_per_day end,
  case when s.package_days is null then 38 else 35 * s.meals_per_day end,
  case when s.package_days is null then 62 else 58 * s.meals_per_day end,
  case when s.package_days is null then 18 else 17 * s.meals_per_day end,
  array[s.specialty, 'Cân bằng'],
  array['Món thay đổi theo ngày', 'Công khai calorie và macro', 'Hỗ trợ ghi chú dị ứng'],
  array[
    case when s.package_days is null then '1 khẩu phần' else s.package_days || ' ngày theo lịch' end,
    'Theo dõi trạng thái từng món',
    'Yêu cầu đổi món trước khi chuẩn bị'
  ],
  'Giao theo khung giờ đã chọn · Theo dõi trên NutriPlan',
  case s.seed_order % 4 when 1 then 'Món mới' when 2 then '7 ngày' when 3 then 'Tiết kiệm' else 'Dài hạn' end,
  1.0 + s.seed_order * 0.35,
  12,
  40 + s.seed_order * 2,
  'Có thể đổi lịch trước 20:00 ngày hôm trước; món đã chuẩn bị không được hoàn.',
  'active',
  current_date
from offer_seed s
join public.kitchens k on k.slug = s.slug
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
  diet_types = excluded.diet_types,
  menu_highlights = excluded.menu_highlights,
  included_items = excluded.included_items,
  delivery_description = excluded.delivery_description,
  badge = excluded.badge,
  distance_km = excluded.distance_km,
  capacity_per_day = excluded.capacity_per_day,
  cancellation_policy = excluded.cancellation_policy,
  status = 'active',
  available_from = excluded.available_from,
  updated_at = now();

with ranked_dishes as (
  select
    d.id,
    row_number() over (order by s.seed_order) as dish_number,
    count(*) over () as dish_count
  from nutriplan_dish_seed s
  join public.dishes d on d.slug = s.slug
),
offer_seed as (
  select
    s.seed_order,
    ko.id as offer_id,
    ko.package_days,
    ko.meals_per_day
  from nutriplan_kitchen_seed s
  join public.kitchen_offers ko
    on ko.code = s.slug || '-signature-' || coalesce(
      (case s.seed_order % 4 when 1 then null when 2 then 7 when 3 then 30 else 120 end)::text,
      'single'
    )
),
slots as (
  select
    o.*,
    day_offset,
    meal_position,
    case meal_position when 1 then 'breakfast' when 2 then 'lunch' else 'dinner' end::public.meal_type as meal_type
  from offer_seed o
  cross join lateral generate_series(0, case when o.package_days is null then 0 else least(o.package_days, 7) - 1 end) day_offset
  cross join lateral generate_series(1, o.meals_per_day) meal_position
)
insert into public.kitchen_offer_items (
  offer_id, dish_id, day_offset, meal_type, quantity, is_substitutable, sort_order
)
select
  s.offer_id,
  d.id,
  s.day_offset,
  s.meal_type,
  1,
  true,
  (s.meal_position - 1)::smallint
from slots s
join ranked_dishes d
  on d.dish_number = ((s.seed_order * 5 + s.day_offset * 3 + s.meal_position - 1) % d.dish_count) + 1
on conflict (offer_id, day_offset, meal_type, sort_order) do update
set
  dish_id = excluded.dish_id,
  quantity = excluded.quantity,
  is_substitutable = excluded.is_substitutable;

commit;
