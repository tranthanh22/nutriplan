-- Explicit Data API privileges for projects using Supabase's opt-in grant defaults.
-- RLS policies from the initial migration still decide which rows are visible.

grant usage on schema public to anon, authenticated, service_role;

grant select on table
  public.allergens,
  public.ingredients,
  public.dishes,
  public.dish_nutrition,
  public.dish_allergens,
  public.subscription_plans,
  public.kitchens,
  public.kitchen_service_areas,
  public.kitchen_offers,
  public.kitchen_offer_items,
  public.reviews
to anon, authenticated;

grant select on table
  public.profiles,
  public.user_addresses,
  public.nutrition_profiles,
  public.user_allergens,
  public.dish_ingredients,
  public.recipes,
  public.subscriptions,
  public.meal_plans,
  public.meal_plan_items,
  public.kitchen_members,
  public.kitchen_orders,
  public.kitchen_order_items,
  public.daily_orders,
  public.daily_order_items,
  public.order_status_history,
  public.payments,
  public.meal_log_entries,
  public.meal_images,
  public.image_analysis_results,
  public.progress_entries
to authenticated;

grant insert, update on table public.nutrition_profiles to authenticated;
grant insert, update, delete on table public.user_addresses to authenticated;
grant insert, update, delete on table public.user_allergens to authenticated;
grant insert, update, delete on table public.meal_log_entries to authenticated;
grant insert, update, delete on table public.meal_images to authenticated;
grant insert, update, delete on table public.progress_entries to authenticated;
grant insert, update on table public.reviews to authenticated;

grant select, insert on table public.product_events to authenticated;
grant usage, select on sequence public.product_events_id_seq to authenticated;

grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Keep AI health inputs/outputs server-only even if grants are changed elsewhere.
revoke all on table public.ai_health_insights from anon, authenticated;
