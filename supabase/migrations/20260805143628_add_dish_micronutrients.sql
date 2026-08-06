alter table public.dish_nutrition
  add column if not exists cholesterol_mg numeric(10, 2),
  add column if not exists potassium_mg numeric(10, 2),
  add column if not exists calcium_mg numeric(10, 2),
  add column if not exists iron_mg numeric(8, 2),
  add column if not exists magnesium_mg numeric(10, 2),
  add column if not exists vitamin_a_mcg numeric(10, 2),
  add column if not exists vitamin_c_mg numeric(10, 2),
  add column if not exists vitamin_d_mcg numeric(8, 2),
  add column if not exists vitamin_b12_mcg numeric(8, 2);

alter table public.dish_nutrition
  drop constraint if exists dish_nutrition_micronutrients_nonnegative,
  add constraint dish_nutrition_micronutrients_nonnegative check (
    (cholesterol_mg is null or cholesterol_mg >= 0)
    and (potassium_mg is null or potassium_mg >= 0)
    and (calcium_mg is null or calcium_mg >= 0)
    and (iron_mg is null or iron_mg >= 0)
    and (magnesium_mg is null or magnesium_mg >= 0)
    and (vitamin_a_mcg is null or vitamin_a_mcg >= 0)
    and (vitamin_c_mg is null or vitamin_c_mg >= 0)
    and (vitamin_d_mcg is null or vitamin_d_mcg >= 0)
    and (vitamin_b12_mcg is null or vitamin_b12_mcg >= 0)
  );

-- Micronutrient estimates for the MVP catalogue, per serving. These values
-- are for nutrition planning and must not be presented as laboratory results.
with micronutrient_seed (
  slug, cholesterol, potassium, calcium, iron, magnesium,
  vitamin_a, vitamin_c, vitamin_d, vitamin_b12
) as (
  values
    ('apple-peanut-butter-snack', 0, 420, 45, 1.2, 65, 35, 8, 0, 0),
    ('avocado-egg-toast', 370, 720, 150, 3.2, 75, 210, 12, 2.2, 1.1),
    ('banana-oat-smoothie', 8, 690, 240, 1.7, 85, 95, 18, 2.0, 1.0),
    ('chicken-brown-rice', 125, 820, 90, 3.6, 115, 280, 34, 0.3, 0.8),
    ('chicken-mushroom-congee', 95, 610, 65, 2.8, 72, 180, 12, 0.2, 0.6),
    ('chicken-sweet-potato', 120, 980, 110, 3.4, 105, 760, 38, 0.3, 0.8),
    ('crispy-roasted-chickpeas', 0, 480, 70, 3.8, 78, 20, 3, 0, 0),
    ('lean-beef-noodle', 110, 760, 85, 5.8, 88, 240, 24, 0.2, 2.8),
    ('lemon-chia-water', 0, 160, 125, 1.6, 80, 5, 24, 0, 0),
    ('low-sugar-fruit-yogurt', 12, 430, 280, 0.7, 42, 75, 22, 2.2, 1.1),
    ('oat-mango-yogurt', 15, 720, 310, 2.6, 105, 190, 42, 2.4, 1.2),
    ('orange-cinnamon-herbal-tea', 0, 180, 55, 0.5, 24, 35, 36, 0, 0),
    ('protein-banana-pancake', 185, 650, 220, 2.8, 95, 175, 14, 2.0, 1.0),
    ('salmon-lemon-salad', 95, 1050, 145, 3.0, 120, 620, 48, 14.0, 4.8),
    ('salmon-rice-bowl', 105, 980, 120, 3.2, 110, 480, 30, 13.0, 4.6),
    ('seasonal-fruit-cup', 0, 620, 55, 1.1, 48, 220, 95, 0, 0),
    ('shrimp-rice-noodle', 190, 720, 160, 3.5, 95, 260, 28, 1.0, 2.2),
    ('tofu-mushroom-rice', 0, 890, 320, 5.6, 145, 180, 22, 0.8, 0.4),
    ('tofu-quinoa-bowl', 0, 960, 350, 6.2, 175, 260, 34, 0, 0),
    ('unsweetened-soy-milk', 0, 320, 300, 1.8, 48, 150, 0, 2.5, 1.2)
)
update public.dish_nutrition dn
set
  cholesterol_mg = seed.cholesterol,
  potassium_mg = seed.potassium,
  calcium_mg = seed.calcium,
  iron_mg = seed.iron,
  magnesium_mg = seed.magnesium,
  vitamin_a_mcg = seed.vitamin_a,
  vitamin_c_mg = seed.vitamin_c,
  vitamin_d_mcg = seed.vitamin_d,
  vitamin_b12_mcg = seed.vitamin_b12,
  source_note = case
    when coalesce(dn.source_note, '') like '%micronutrients estimated for MVP%'
      then dn.source_note
    else coalesce(dn.source_note, '') || ' · micronutrients estimated for MVP'
  end,
  updated_at = now()
from micronutrient_seed seed
join public.dishes d on d.slug = seed.slug
where dn.dish_id = d.id;
