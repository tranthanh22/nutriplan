-- Migration to populate initial ingredients catalogue data
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

-- Grant public read access
grant select on public.ingredients to anon, authenticated;
