alter table public.daily_order_items
  add column if not exists ingredient_snapshot text[] not null default '{}';

update public.daily_order_items
set ingredient_snapshot = case
  when lower(dish_name) = 'bò steak khoai tây'
    then array['Thịt bò', 'Khoai tây', 'Rau củ', 'Tiêu đen', 'Dầu ô-liu']
  when lower(dish_name) = 'cá hồi cơm nhật'
    then array['Cá hồi', 'Cơm Nhật', 'Rong biển', 'Rau củ', 'Mè rang']
  when lower(dish_name) = 'gà nướng pasta'
    then array['Ức gà', 'Mì pasta', 'Cà chua', 'Rau thơm', 'Dầu ô-liu']
  when lower(dish_name) = 'cá basa sốt chanh dây'
    then array['Cá basa', 'Chanh dây', 'Rau củ', 'Gia vị', 'Dầu thực vật']
  when lower(dish_name) = 'bò xào rau củ'
    then array['Thịt bò', 'Bông cải', 'Ớt chuông', 'Cà rốt', 'Hành tây']
  when lower(dish_name) = 'gà nướng thảo mộc'
    then array['Ức gà', 'Hương thảo', 'Khoai củ', 'Rau xanh', 'Dầu ô-liu']
  else array['Nguyên liệu theo công bố của nhà bếp']
end
where cardinality(ingredient_snapshot) = 0;

alter table public.daily_order_items
  add constraint daily_order_items_ingredient_count_check
    check (cardinality(ingredient_snapshot) between 1 and 50);
