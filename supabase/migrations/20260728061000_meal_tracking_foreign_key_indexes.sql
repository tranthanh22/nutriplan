create index if not exists daily_order_items_dish_idx
  on public.daily_order_items (dish_id);

create index if not exists meal_log_entries_dish_idx
  on public.meal_log_entries (dish_id);

create index if not exists meal_plan_items_dish_idx
  on public.meal_plan_items (dish_id);

create index if not exists meal_plan_items_replaced_item_idx
  on public.meal_plan_items (replaced_item_id);

create index if not exists meal_plans_nutrition_profile_idx
  on public.meal_plans (nutrition_profile_id);

create index if not exists meal_plan_item_replacements_user_idx
  on public.meal_plan_item_replacements (user_id);

create index if not exists meal_plan_item_replacements_from_dish_idx
  on public.meal_plan_item_replacements (from_dish_id);

create index if not exists meal_plan_item_replacements_to_dish_idx
  on public.meal_plan_item_replacements (to_dish_id);
