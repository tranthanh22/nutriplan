-- Create diet_types lookup table in public schema
create table if not exists public.diet_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  emoji text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Seed initial active diet types
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

-- Grant permissions for public read access
grant select on public.diet_types to anon, authenticated;
