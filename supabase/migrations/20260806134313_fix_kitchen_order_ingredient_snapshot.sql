-- Keep the column default compatible with the ingredient-count constraint.
-- The trigger also enriches known mock dishes while retaining a safe fallback
-- for partner dishes whose detailed recipe has not been entered yet.

alter table public.daily_order_items
  alter column ingredient_snapshot
  set default array['Nguyên liệu theo công bố của nhà bếp']::text[];

create or replace function public.fill_daily_order_item_ingredients()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if
    coalesce(cardinality(new.ingredient_snapshot), 0) = 0
    or new.ingredient_snapshot = array['Nguyên liệu theo công bố của nhà bếp']::text[]
  then
    new.ingredient_snapshot := case lower(btrim(new.dish_name))
      when 'bò steak khoai tây'
        then array['Thịt bò', 'Khoai tây', 'Rau củ', 'Tiêu đen', 'Dầu ô-liu']
      when 'cá hồi cơm nhật'
        then array['Cá hồi', 'Cơm Nhật', 'Rong biển', 'Rau củ', 'Mè rang']
      when 'gà nướng pasta'
        then array['Ức gà', 'Mì pasta', 'Cà chua', 'Rau thơm', 'Dầu ô-liu']
      when 'cá basa sốt chanh dây'
        then array['Cá basa', 'Chanh dây', 'Rau củ', 'Gia vị', 'Dầu thực vật']
      when 'bò xào rau củ'
        then array['Thịt bò', 'Bông cải', 'Ớt chuông', 'Cà rốt', 'Hành tây']
      when 'gà nướng thảo mộc'
        then array['Ức gà', 'Hương thảo', 'Khoai củ', 'Rau xanh', 'Dầu ô-liu']
      else array['Nguyên liệu theo công bố của nhà bếp']
    end;
  end if;

  return new;
end;
$$;

drop trigger if exists daily_order_items_fill_ingredients
  on public.daily_order_items;

create trigger daily_order_items_fill_ingredients
before insert or update of dish_name, ingredient_snapshot
on public.daily_order_items
for each row
execute function public.fill_daily_order_item_ingredients();

revoke all on function public.fill_daily_order_item_ingredients()
  from public, anon, authenticated;

comment on function public.fill_daily_order_item_ingredients() is
  'Ensures generated kitchen meals always satisfy the ingredient snapshot constraint.';
