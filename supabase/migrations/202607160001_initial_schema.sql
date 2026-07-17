-- NutriPlan MVP - Initial PostgreSQL schema for Supabase
-- Generated for Next.js + NestJS + Supabase architecture.

create extension if not exists pgcrypto;

-- ============================================================================
-- ENUMS
-- ============================================================================

create type public.app_role as enum ('customer', 'kitchen_staff', 'admin');
create type public.gender_type as enum ('male', 'female', 'other', 'prefer_not_to_say');
create type public.activity_level as enum (
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active'
);
create type public.nutrition_goal as enum ('lose_weight', 'maintain', 'gain_muscle');
create type public.meal_type as enum ('breakfast', 'lunch', 'dinner', 'snack');
create type public.record_status as enum ('draft', 'active', 'inactive', 'archived');
create type public.meal_plan_status as enum ('draft', 'active', 'completed', 'archived');
create type public.subscription_status as enum (
  'pending_payment',
  'active',
  'cancel_at_period_end',
  'expired',
  'payment_failed',
  'cancelled'
);
create type public.billing_interval as enum ('day', 'month', 'year');
create type public.kitchen_status as enum ('pending', 'active', 'suspended', 'closed');
create type public.kitchen_member_role as enum ('owner', 'manager', 'staff');
create type public.offer_type as enum ('single_meal', 'package');
create type public.offer_status as enum ('draft', 'active', 'sold_out', 'inactive');
create type public.kitchen_order_status as enum (
  'pending_payment',
  'paid',
  'confirmed',
  'completed',
  'cancelled',
  'refunded'
);
create type public.daily_order_status as enum (
  'scheduled',
  'accepted',
  'preparing',
  'out_for_delivery',
  'delivered',
  'failed',
  'cancelled'
);
create type public.payment_type as enum ('subscription', 'kitchen_order');
create type public.payment_status as enum (
  'pending',
  'processing',
  'succeeded',
  'failed',
  'cancelled',
  'refunded',
  'partially_refunded'
);
create type public.meal_log_source as enum (
  'recipe',
  'kitchen',
  'image_estimate',
  'manual'
);
create type public.image_processing_status as enum (
  'uploaded',
  'processing',
  'needs_confirmation',
  'confirmed',
  'failed',
  'deleted'
);

-- ============================================================================
-- USERS AND NUTRITION
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'customer',
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_length check (full_name is null or char_length(full_name) between 2 and 100)
);

create table public.user_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null default 'Địa chỉ',
  recipient_name text not null,
  recipient_phone text not null,
  line1 text not null,
  ward text,
  district text not null,
  city text not null default 'TP. Hồ Chí Minh',
  delivery_note text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_addresses_latitude check (latitude is null or latitude between -90 and 90),
  constraint user_addresses_longitude check (longitude is null or longitude between -180 and 180)
);

create unique index user_addresses_one_default_per_user
  on public.user_addresses(user_id)
  where is_default;

create table public.nutrition_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  version integer not null,
  gender public.gender_type not null,
  birth_date date not null,
  height_cm numeric(5, 2) not null,
  weight_kg numeric(6, 2) not null,
  activity_level public.activity_level not null,
  goal public.nutrition_goal not null,
  dietary_preferences text[] not null default '{}',
  disliked_ingredients text[] not null default '{}',
  medical_notes text,
  bmr_kcal numeric(8, 2) not null,
  tdee_kcal numeric(8, 2) not null,
  target_calories_kcal numeric(8, 2) not null,
  target_protein_g numeric(8, 2) not null,
  target_carbs_g numeric(8, 2) not null,
  target_fat_g numeric(8, 2) not null,
  formula_code text not null,
  formula_version text not null,
  is_current boolean not null default true,
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint nutrition_profiles_user_version_unique unique (user_id, version),
  constraint nutrition_profiles_height_range check (height_cm between 80 and 250),
  constraint nutrition_profiles_weight_range check (weight_kg between 20 and 400),
  constraint nutrition_profiles_birth_date check (birth_date <= current_date),
  constraint nutrition_profiles_bmr_positive check (bmr_kcal > 0),
  constraint nutrition_profiles_tdee_positive check (tdee_kcal > 0),
  constraint nutrition_profiles_target_calories_positive check (target_calories_kcal > 0),
  constraint nutrition_profiles_macro_nonnegative check (
    target_protein_g >= 0 and target_carbs_g >= 0 and target_fat_g >= 0
  )
);

create unique index nutrition_profiles_one_current_per_user
  on public.nutrition_profiles(user_id)
  where is_current;

create table public.allergens (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.user_allergens (
  user_id uuid not null references public.profiles(id) on delete cascade,
  allergen_id uuid not null references public.allergens(id) on delete restrict,
  notes text,
  created_at timestamptz not null default now(),
  primary key (user_id, allergen_id)
);

-- ============================================================================
-- DISH CATALOGUE AND RECIPES
-- ============================================================================

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null unique,
  default_unit text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dishes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  short_description text,
  ingredient_summary text,
  image_path text,
  meal_types public.meal_type[] not null default '{}',
  cuisine text,
  prep_time_minutes integer,
  cook_time_minutes integer,
  difficulty smallint,
  status public.record_status not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dishes_name_length check (char_length(name) between 2 and 150),
  constraint dishes_prep_time_nonnegative check (prep_time_minutes is null or prep_time_minutes >= 0),
  constraint dishes_cook_time_nonnegative check (cook_time_minutes is null or cook_time_minutes >= 0),
  constraint dishes_difficulty_range check (difficulty is null or difficulty between 1 and 5)
);

create table public.dish_nutrition (
  dish_id uuid primary key references public.dishes(id) on delete cascade,
  serving_name text not null default '1 khẩu phần',
  serving_grams numeric(8, 2),
  calories_kcal numeric(8, 2) not null,
  protein_g numeric(8, 2) not null,
  carbs_g numeric(8, 2) not null,
  fat_g numeric(8, 2) not null,
  fiber_g numeric(8, 2),
  sodium_mg numeric(10, 2),
  source_note text,
  verified_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint dish_nutrition_serving_positive check (serving_grams is null or serving_grams > 0),
  constraint dish_nutrition_values_nonnegative check (
    calories_kcal >= 0
    and protein_g >= 0
    and carbs_g >= 0
    and fat_g >= 0
    and (fiber_g is null or fiber_g >= 0)
    and (sodium_mg is null or sodium_mg >= 0)
  )
);

create table public.dish_ingredients (
  dish_id uuid not null references public.dishes(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  quantity numeric(10, 3),
  unit text,
  preparation_note text,
  is_optional boolean not null default false,
  sort_order smallint not null default 0,
  primary key (dish_id, ingredient_id),
  constraint dish_ingredients_quantity_positive check (quantity is null or quantity > 0)
);

create table public.dish_allergens (
  dish_id uuid not null references public.dishes(id) on delete cascade,
  allergen_id uuid not null references public.allergens(id) on delete restrict,
  cross_contamination_risk boolean not null default false,
  notes text,
  primary key (dish_id, allergen_id)
);

create table public.recipes (
  dish_id uuid primary key references public.dishes(id) on delete cascade,
  instructions jsonb not null,
  cooking_tips text,
  storage_instructions text,
  safety_notes text,
  version integer not null default 1,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recipes_instructions_array check (
    jsonb_typeof(instructions) = 'array' and jsonb_array_length(instructions) > 0
  )
);

-- ============================================================================
-- SUBSCRIPTIONS
-- ============================================================================

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  price_amount numeric(12, 2) not null,
  currency char(3) not null default 'VND',
  billing_interval public.billing_interval not null default 'month',
  interval_count integer not null default 1,
  features jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_plans_price_nonnegative check (price_amount >= 0),
  constraint subscription_plans_interval_positive check (interval_count > 0)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  status public.subscription_status not null default 'pending_payment',
  provider text,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  cancelled_at timestamptz,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_period_valid check (
    current_period_end is null
    or current_period_start is null
    or current_period_end > current_period_start
  )
);

create unique index subscriptions_provider_reference_unique
  on public.subscriptions(provider, provider_subscription_id)
  where provider_subscription_id is not null;

create unique index subscriptions_one_entitled_per_user
  on public.subscriptions(user_id)
  where status in ('active', 'cancel_at_period_end');

-- ============================================================================
-- MEAL PLANS
-- ============================================================================

create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  nutrition_profile_id uuid not null references public.nutrition_profiles(id) on delete restrict,
  name text not null default 'Kế hoạch 7 ngày',
  start_date date not null,
  end_date date not null,
  status public.meal_plan_status not null default 'draft',
  version integer not null default 1,
  target_calories_kcal numeric(8, 2) not null,
  target_protein_g numeric(8, 2) not null,
  target_carbs_g numeric(8, 2) not null,
  target_fat_g numeric(8, 2) not null,
  generated_by text not null default 'rule_based',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meal_plans_date_range check (end_date >= start_date),
  constraint meal_plans_targets_positive check (
    target_calories_kcal > 0
    and target_protein_g >= 0
    and target_carbs_g >= 0
    and target_fat_g >= 0
  )
);

create table public.meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade,
  dish_id uuid not null references public.dishes(id) on delete restrict,
  planned_date date not null,
  meal_type public.meal_type not null,
  sequence_no smallint not null default 1,
  servings numeric(6, 2) not null default 1,
  calories_kcal numeric(8, 2) not null,
  protein_g numeric(8, 2) not null,
  carbs_g numeric(8, 2) not null,
  fat_g numeric(8, 2) not null,
  is_replacement boolean not null default false,
  replaced_item_id uuid references public.meal_plan_items(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meal_plan_items_slot_unique unique (
    meal_plan_id,
    planned_date,
    meal_type,
    sequence_no
  ),
  constraint meal_plan_items_servings_positive check (servings > 0),
  constraint meal_plan_items_nutrition_nonnegative check (
    calories_kcal >= 0 and protein_g >= 0 and carbs_g >= 0 and fat_g >= 0
  )
);

-- ============================================================================
-- KITCHENS, OFFERS AND ORDERS
-- ============================================================================

create table public.kitchens (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  logo_path text,
  phone text not null,
  email text,
  address_text text,
  status public.kitchen_status not null default 'pending',
  rating_average numeric(3, 2) not null default 0,
  rating_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kitchens_rating_range check (rating_average between 0 and 5),
  constraint kitchens_rating_count_nonnegative check (rating_count >= 0)
);

create table public.kitchen_members (
  kitchen_id uuid not null references public.kitchens(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.kitchen_member_role not null default 'staff',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (kitchen_id, user_id)
);

create table public.kitchen_service_areas (
  id uuid primary key default gen_random_uuid(),
  kitchen_id uuid not null references public.kitchens(id) on delete cascade,
  city text not null,
  district text not null,
  ward text,
  delivery_fee numeric(12, 2) not null default 0,
  minimum_order_amount numeric(12, 2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint kitchen_service_areas_unique unique (kitchen_id, city, district, ward),
  constraint kitchen_service_areas_amounts_nonnegative check (
    delivery_fee >= 0 and minimum_order_amount >= 0
  )
);

create table public.kitchen_offers (
  id uuid primary key default gen_random_uuid(),
  kitchen_id uuid not null references public.kitchens(id) on delete cascade,
  type public.offer_type not null,
  name text not null,
  description text,
  image_path text,
  price_amount numeric(12, 2) not null,
  currency char(3) not null default 'VND',
  delivery_fee numeric(12, 2) not null default 0,
  package_days integer,
  order_cutoff_hours integer not null default 12,
  capacity_per_day integer,
  cancellation_policy text,
  status public.offer_status not null default 'draft',
  available_from date,
  available_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kitchen_offers_price_nonnegative check (price_amount >= 0 and delivery_fee >= 0),
  constraint kitchen_offers_package_days check (
    (type = 'single_meal' and package_days is null)
    or (type = 'package' and package_days is not null and package_days > 1)
  ),
  constraint kitchen_offers_cutoff_nonnegative check (order_cutoff_hours >= 0),
  constraint kitchen_offers_capacity_positive check (capacity_per_day is null or capacity_per_day > 0),
  constraint kitchen_offers_availability_range check (
    available_until is null or available_from is null or available_until >= available_from
  )
);

create table public.kitchen_offer_items (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.kitchen_offers(id) on delete cascade,
  dish_id uuid not null references public.dishes(id) on delete restrict,
  day_offset integer not null default 0,
  meal_type public.meal_type not null,
  quantity numeric(6, 2) not null default 1,
  is_substitutable boolean not null default false,
  sort_order smallint not null default 0,
  constraint kitchen_offer_items_slot_unique unique (
    offer_id,
    day_offset,
    meal_type,
    sort_order
  ),
  constraint kitchen_offer_items_day_nonnegative check (day_offset >= 0),
  constraint kitchen_offer_items_quantity_positive check (quantity > 0)
);

create table public.kitchen_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references public.profiles(id) on delete restrict,
  kitchen_id uuid not null references public.kitchens(id) on delete restrict,
  offer_id uuid references public.kitchen_offers(id) on delete set null,
  status public.kitchen_order_status not null default 'pending_payment',
  recipient_name text not null,
  recipient_phone text not null,
  delivery_address jsonb not null,
  delivery_note text,
  allergen_snapshot jsonb not null default '[]'::jsonb,
  subtotal_amount numeric(12, 2) not null,
  delivery_fee numeric(12, 2) not null default 0,
  discount_amount numeric(12, 2) not null default 0,
  total_amount numeric(12, 2) not null,
  currency char(3) not null default 'VND',
  policy_snapshot jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  cancelled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kitchen_orders_delivery_address_object check (
    jsonb_typeof(delivery_address) = 'object'
  ),
  constraint kitchen_orders_allergen_snapshot_array check (
    jsonb_typeof(allergen_snapshot) = 'array'
  ),
  constraint kitchen_orders_amounts_nonnegative check (
    subtotal_amount >= 0
    and delivery_fee >= 0
    and discount_amount >= 0
    and total_amount >= 0
  ),
  constraint kitchen_orders_total_formula check (
    total_amount = subtotal_amount + delivery_fee - discount_amount
  )
);

create table public.kitchen_order_items (
  id uuid primary key default gen_random_uuid(),
  kitchen_order_id uuid not null references public.kitchen_orders(id) on delete cascade,
  offer_id uuid references public.kitchen_offers(id) on delete set null,
  dish_id uuid references public.dishes(id) on delete set null,
  item_name text not null,
  item_type public.offer_type not null,
  quantity numeric(8, 2) not null,
  unit_price numeric(12, 2) not null,
  total_price numeric(12, 2) not null,
  item_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  constraint kitchen_order_items_quantity_positive check (quantity > 0),
  constraint kitchen_order_items_prices_nonnegative check (unit_price >= 0 and total_price >= 0),
  constraint kitchen_order_items_total_formula check (total_price = quantity * unit_price),
  constraint kitchen_order_items_snapshot_object check (jsonb_typeof(item_snapshot) = 'object')
);

create table public.daily_orders (
  id uuid primary key default gen_random_uuid(),
  kitchen_order_id uuid not null references public.kitchen_orders(id) on delete cascade,
  kitchen_id uuid not null references public.kitchens(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  delivery_date date not null,
  meal_type public.meal_type not null,
  delivery_window_start time,
  delivery_window_end time,
  status public.daily_order_status not null default 'scheduled',
  accepted_at timestamptz,
  preparing_at timestamptz,
  out_for_delivery_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  cancelled_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_orders_slot_unique unique (
    kitchen_order_id,
    delivery_date,
    meal_type
  ),
  constraint daily_orders_delivery_window check (
    delivery_window_end is null
    or delivery_window_start is null
    or delivery_window_end > delivery_window_start
  )
);

create table public.daily_order_items (
  id uuid primary key default gen_random_uuid(),
  daily_order_id uuid not null references public.daily_orders(id) on delete cascade,
  dish_id uuid references public.dishes(id) on delete set null,
  dish_name text not null,
  servings numeric(6, 2) not null default 1,
  calories_kcal numeric(8, 2) not null,
  protein_g numeric(8, 2) not null,
  carbs_g numeric(8, 2) not null,
  fat_g numeric(8, 2) not null,
  allergen_snapshot jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint daily_order_items_servings_positive check (servings > 0),
  constraint daily_order_items_nutrition_nonnegative check (
    calories_kcal >= 0 and protein_g >= 0 and carbs_g >= 0 and fat_g >= 0
  ),
  constraint daily_order_items_allergens_array check (
    jsonb_typeof(allergen_snapshot) = 'array'
  )
);

create table public.order_status_history (
  id bigint generated always as identity primary key,
  daily_order_id uuid not null references public.daily_orders(id) on delete cascade,
  from_status public.daily_order_status,
  to_status public.daily_order_status not null,
  changed_by uuid references public.profiles(id) on delete set null,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- PAYMENTS
-- ============================================================================

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  type public.payment_type not null,
  subscription_id uuid references public.subscriptions(id) on delete restrict,
  kitchen_order_id uuid references public.kitchen_orders(id) on delete restrict,
  provider text not null,
  provider_payment_id text,
  idempotency_key text not null unique,
  amount numeric(12, 2) not null,
  refunded_amount numeric(12, 2) not null default 0,
  currency char(3) not null default 'VND',
  status public.payment_status not null default 'pending',
  failure_code text,
  failure_message text,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_amount_positive check (amount > 0),
  constraint payments_refund_range check (refunded_amount between 0 and amount),
  constraint payments_target_matches_type check (
    (
      type = 'subscription'
      and subscription_id is not null
      and kitchen_order_id is null
    )
    or
    (
      type = 'kitchen_order'
      and kitchen_order_id is not null
      and subscription_id is null
    )
  )
);

create unique index payments_provider_reference_unique
  on public.payments(provider, provider_payment_id)
  where provider_payment_id is not null;

create table public.payment_events (
  id bigint generated always as identity primary key,
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  payment_id uuid references public.payments(id) on delete set null,
  payload jsonb not null,
  processing_status text not null default 'received',
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  constraint payment_events_provider_event_unique unique (provider, provider_event_id),
  constraint payment_events_payload_object check (jsonb_typeof(payload) = 'object')
);

-- ============================================================================
-- MEAL LOG, IMAGE ANALYSIS, PROGRESS AND REVIEWS
-- ============================================================================

create table public.meal_log_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source public.meal_log_source not null,
  consumed_at timestamptz not null,
  meal_type public.meal_type not null,
  dish_id uuid references public.dishes(id) on delete set null,
  meal_plan_item_id uuid references public.meal_plan_items(id) on delete set null,
  daily_order_id uuid references public.daily_orders(id) on delete set null,
  name text not null,
  servings numeric(6, 2) not null default 1,
  calories_kcal numeric(8, 2) not null,
  protein_g numeric(8, 2) not null,
  carbs_g numeric(8, 2) not null,
  fat_g numeric(8, 2) not null,
  confidence numeric(5, 4),
  is_user_confirmed boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meal_log_entries_servings_positive check (servings > 0),
  constraint meal_log_entries_nutrition_nonnegative check (
    calories_kcal >= 0 and protein_g >= 0 and carbs_g >= 0 and fat_g >= 0
  ),
  constraint meal_log_entries_confidence_range check (
    confidence is null or confidence between 0 and 1
  ),
  constraint meal_log_entries_source_reference check (
    (source <> 'recipe' or meal_plan_item_id is not null)
    and (source <> 'kitchen' or daily_order_id is not null)
  )
);

create unique index meal_log_one_entry_per_delivered_order
  on public.meal_log_entries(daily_order_id)
  where source = 'kitchen' and daily_order_id is not null;

create table public.meal_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  meal_log_entry_id uuid references public.meal_log_entries(id) on delete set null,
  storage_bucket text not null default 'meal-scan-images',
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null,
  status public.image_processing_status not null default 'uploaded',
  consented_at timestamptz not null,
  retention_until timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meal_images_size_range check (size_bytes > 0 and size_bytes <= 5242880),
  constraint meal_images_mime_type check (mime_type in ('image/jpeg', 'image/png', 'image/webp'))
);

create table public.image_analysis_results (
  id uuid primary key default gen_random_uuid(),
  meal_image_id uuid not null references public.meal_images(id) on delete cascade,
  provider text not null,
  provider_model text,
  raw_result jsonb,
  suggested_name text,
  suggested_servings numeric(6, 2),
  estimated_calories_kcal numeric(8, 2),
  estimated_protein_g numeric(8, 2),
  estimated_carbs_g numeric(8, 2),
  estimated_fat_g numeric(8, 2),
  confidence numeric(5, 4),
  is_selected boolean not null default false,
  created_at timestamptz not null default now(),
  constraint image_analysis_servings_positive check (
    suggested_servings is null or suggested_servings > 0
  ),
  constraint image_analysis_nutrition_nonnegative check (
    (estimated_calories_kcal is null or estimated_calories_kcal >= 0)
    and (estimated_protein_g is null or estimated_protein_g >= 0)
    and (estimated_carbs_g is null or estimated_carbs_g >= 0)
    and (estimated_fat_g is null or estimated_fat_g >= 0)
  ),
  constraint image_analysis_confidence_range check (
    confidence is null or confidence between 0 and 1
  )
);

create unique index image_analysis_one_selected_per_image
  on public.image_analysis_results(meal_image_id)
  where is_selected;

create table public.progress_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  recorded_on date not null,
  weight_kg numeric(6, 2) not null,
  waist_cm numeric(6, 2),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint progress_entries_user_date_unique unique (user_id, recorded_on),
  constraint progress_entries_weight_range check (weight_kg between 20 and 400),
  constraint progress_entries_waist_positive check (waist_cm is null or waist_cm > 0)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  kitchen_order_id uuid not null references public.kitchen_orders(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kitchen_id uuid not null references public.kitchens(id) on delete cascade,
  rating smallint not null,
  comment text,
  image_paths text[] not null default '{}',
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_one_per_order unique (kitchen_order_id, user_id),
  constraint reviews_rating_range check (rating between 1 and 5)
);

create table public.product_events (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete set null,
  event_name text not null,
  session_id text,
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  constraint product_events_properties_object check (jsonb_typeof(properties) = 'object')
);

-- ============================================================================
-- INDEXES
-- ============================================================================

create index nutrition_profiles_user_created_idx
  on public.nutrition_profiles(user_id, created_at desc);
create index user_allergens_user_idx on public.user_allergens(user_id);
create index dishes_status_meal_types_idx on public.dishes using gin(meal_types);
create index dishes_status_idx on public.dishes(status);
create index dish_ingredients_ingredient_idx on public.dish_ingredients(ingredient_id);
create index dish_allergens_allergen_idx on public.dish_allergens(allergen_id);
create index subscriptions_user_status_period_idx
  on public.subscriptions(user_id, status, current_period_end desc);
create index meal_plans_user_dates_idx
  on public.meal_plans(user_id, start_date desc, end_date desc);
create index meal_plan_items_plan_date_idx
  on public.meal_plan_items(meal_plan_id, planned_date, meal_type);
create index kitchen_members_user_idx on public.kitchen_members(user_id) where is_active;
create index kitchen_service_areas_lookup_idx
  on public.kitchen_service_areas(city, district, ward) where is_active;
create index kitchen_offers_kitchen_status_idx
  on public.kitchen_offers(kitchen_id, status);
create index kitchen_offer_items_offer_day_idx
  on public.kitchen_offer_items(offer_id, day_offset, meal_type);
create index kitchen_orders_user_created_idx
  on public.kitchen_orders(user_id, created_at desc);
create index kitchen_orders_kitchen_status_idx
  on public.kitchen_orders(kitchen_id, status, created_at desc);
create index daily_orders_kitchen_date_status_idx
  on public.daily_orders(kitchen_id, delivery_date, status);
create index daily_orders_user_date_idx
  on public.daily_orders(user_id, delivery_date desc);
create index order_status_history_order_created_idx
  on public.order_status_history(daily_order_id, created_at);
create index payments_user_created_idx on public.payments(user_id, created_at desc);
create index payments_status_created_idx on public.payments(status, created_at);
create index meal_log_user_consumed_idx
  on public.meal_log_entries(user_id, consumed_at desc);
create index meal_images_user_created_idx on public.meal_images(user_id, created_at desc);
create index progress_entries_user_date_idx
  on public.progress_entries(user_id, recorded_on desc);
create index reviews_kitchen_created_idx
  on public.reviews(kitchen_id, created_at desc) where is_visible;
create index product_events_name_time_idx
  on public.product_events(event_name, occurred_at desc);

-- ============================================================================
-- GENERIC TRIGGERS AND AUTH PROFILE CREATION
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'user_addresses',
    'ingredients',
    'dishes',
    'dish_nutrition',
    'recipes',
    'subscription_plans',
    'subscriptions',
    'meal_plans',
    'meal_plan_items',
    'kitchens',
    'kitchen_offers',
    'kitchen_orders',
    'daily_orders',
    'payments',
    'meal_log_entries',
    'meal_images',
    'progress_entries',
    'reviews'
  ]
  loop
    execute format(
      'create trigger %I before update on public.%I
       for each row execute function public.set_updated_at()',
      'set_' || table_name || '_updated_at',
      table_name
    );
  end loop;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- AUTHORIZATION HELPERS
-- ============================================================================

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid());
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

create or replace function public.is_kitchen_member(target_kitchen_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.kitchen_members km
    where km.kitchen_id = target_kitchen_id
      and km.user_id = (select auth.uid())
      and km.is_active
  );
$$;

create or replace function public.has_active_subscription()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.user_id = (select auth.uid())
      and s.status in ('active', 'cancel_at_period_end')
      and s.current_period_start <= now()
      and s.current_period_end > now()
  );
$$;

-- Do not allow clients to call security-definer helpers except where needed by RLS.
revoke all on function public.current_user_role() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.is_kitchen_member(uuid) from public;
revoke all on function public.has_active_subscription() from public;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_kitchen_member(uuid) to anon, authenticated;
grant execute on function public.has_active_subscription() to authenticated;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'user_addresses',
    'nutrition_profiles',
    'allergens',
    'user_allergens',
    'ingredients',
    'dishes',
    'dish_nutrition',
    'dish_ingredients',
    'dish_allergens',
    'recipes',
    'subscription_plans',
    'subscriptions',
    'meal_plans',
    'meal_plan_items',
    'kitchens',
    'kitchen_members',
    'kitchen_service_areas',
    'kitchen_offers',
    'kitchen_offer_items',
    'kitchen_orders',
    'kitchen_order_items',
    'daily_orders',
    'daily_order_items',
    'order_status_history',
    'payments',
    'payment_events',
    'meal_log_entries',
    'meal_images',
    'image_analysis_results',
    'progress_entries',
    'reviews',
    'product_events'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end;
$$;

-- Profiles and personal data
create policy profiles_select_own
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or public.is_admin());

create policy profiles_update_own
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

create policy user_addresses_own_all
  on public.user_addresses for all
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin())
  with check (user_id = (select auth.uid()) or public.is_admin());

create policy nutrition_profiles_select_own
  on public.nutrition_profiles for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy nutrition_profiles_insert_own
  on public.nutrition_profiles for insert
  to authenticated
  with check (user_id = (select auth.uid()) or public.is_admin());

create policy nutrition_profiles_update_own
  on public.nutrition_profiles for update
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin())
  with check (user_id = (select auth.uid()) or public.is_admin());

create policy allergens_public_read
  on public.allergens for select
  to anon, authenticated
  using (is_active or public.is_admin());

create policy user_allergens_own_all
  on public.user_allergens for all
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin())
  with check (user_id = (select auth.uid()) or public.is_admin());

-- Published food catalogue is public; recipes are subscriber-only.
create policy ingredients_public_read
  on public.ingredients for select
  to anon, authenticated
  using (is_active or public.is_admin());

create policy dishes_public_read
  on public.dishes for select
  to anon, authenticated
  using (status = 'active' or public.is_admin());

create policy dish_nutrition_public_read
  on public.dish_nutrition for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.dishes d
      where d.id = dish_id and d.status = 'active'
    )
    or public.is_admin()
  );

create policy dish_ingredients_subscriber_read
  on public.dish_ingredients for select
  to authenticated
  using (
    (
      public.has_active_subscription()
      and exists (
        select 1 from public.dishes d
        where d.id = dish_id and d.status = 'active'
      )
    )
    or public.is_admin()
  );

create policy dish_allergens_public_read
  on public.dish_allergens for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.dishes d
      where d.id = dish_id and d.status = 'active'
    )
    or public.is_admin()
  );

create policy recipes_subscriber_read
  on public.recipes for select
  to authenticated
  using (
    (
      public.has_active_subscription()
      and exists (
        select 1 from public.dishes d
        where d.id = dish_id and d.status = 'active'
      )
    )
    or public.is_admin()
  );

-- Plans and subscriptions
create policy subscription_plans_public_read
  on public.subscription_plans for select
  to anon, authenticated
  using (is_active or public.is_admin());

create policy subscriptions_select_own
  on public.subscriptions for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy meal_plans_owner_read
  on public.meal_plans for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy meal_plans_subscriber_insert
  on public.meal_plans for insert
  to authenticated
  with check (
    (
      user_id = (select auth.uid())
      and public.has_active_subscription()
      and exists (
        select 1
        from public.nutrition_profiles np
        where np.id = nutrition_profile_id
          and np.user_id = (select auth.uid())
      )
    )
    or public.is_admin()
  );

create policy meal_plans_subscriber_update
  on public.meal_plans for update
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin())
  with check (
    (
      user_id = (select auth.uid())
      and public.has_active_subscription()
      and exists (
        select 1
        from public.nutrition_profiles np
        where np.id = nutrition_profile_id
          and np.user_id = (select auth.uid())
      )
    )
    or public.is_admin()
  );

create policy meal_plans_owner_delete
  on public.meal_plans for delete
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy meal_plan_items_owner_read
  on public.meal_plan_items for select
  to authenticated
  using (
    (
      public.has_active_subscription()
      and exists (
        select 1
        from public.meal_plans mp
        where mp.id = meal_plan_id
          and mp.user_id = (select auth.uid())
      )
    )
    or public.is_admin()
  );

create policy meal_plan_items_owner_insert
  on public.meal_plan_items for insert
  to authenticated
  with check (
    (
      public.has_active_subscription()
      and exists (
        select 1
        from public.meal_plans mp
        where mp.id = meal_plan_id
          and mp.user_id = (select auth.uid())
      )
    )
    or public.is_admin()
  );

create policy meal_plan_items_owner_update
  on public.meal_plan_items for update
  to authenticated
  using (
    (
      public.has_active_subscription()
      and exists (
        select 1
        from public.meal_plans mp
        where mp.id = meal_plan_id
          and mp.user_id = (select auth.uid())
      )
    )
    or public.is_admin()
  )
  with check (
    (
      public.has_active_subscription()
      and exists (
        select 1
        from public.meal_plans mp
        where mp.id = meal_plan_id
          and mp.user_id = (select auth.uid())
      )
    )
    or public.is_admin()
  );

create policy meal_plan_items_owner_delete
  on public.meal_plan_items for delete
  to authenticated
  using (
    exists (
      select 1
      from public.meal_plans mp
      where mp.id = meal_plan_id
        and mp.user_id = (select auth.uid())
    )
    or public.is_admin()
  );

-- Kitchens and marketplace
create policy kitchens_public_read
  on public.kitchens for select
  to anon, authenticated
  using (status = 'active' or public.is_kitchen_member(id) or public.is_admin());

create policy kitchen_members_member_read
  on public.kitchen_members for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_kitchen_member(kitchen_id)
    or public.is_admin()
  );

create policy kitchen_service_areas_public_read
  on public.kitchen_service_areas for select
  to anon, authenticated
  using (
    (
      is_active
      and exists (
        select 1 from public.kitchens k
        where k.id = kitchen_id and k.status = 'active'
      )
    )
    or public.is_kitchen_member(kitchen_id)
    or public.is_admin()
  );

create policy kitchen_offers_public_read
  on public.kitchen_offers for select
  to anon, authenticated
  using (
    (
      status = 'active'
      and (available_from is null or available_from <= current_date)
      and (available_until is null or available_until >= current_date)
      and exists (
        select 1 from public.kitchens k
        where k.id = kitchen_id and k.status = 'active'
      )
    )
    or public.is_kitchen_member(kitchen_id)
    or public.is_admin()
  );

create policy kitchen_offer_items_public_read
  on public.kitchen_offer_items for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.kitchen_offers ko
      join public.kitchens k on k.id = ko.kitchen_id
      where ko.id = offer_id
        and (
          (
            ko.status = 'active'
            and k.status = 'active'
            and (ko.available_from is null or ko.available_from <= current_date)
            and (ko.available_until is null or ko.available_until >= current_date)
          )
          or public.is_kitchen_member(ko.kitchen_id)
          or public.is_admin()
        )
    )
  );

-- Order writes are performed through NestJS transaction/RPC.
create policy kitchen_orders_related_read
  on public.kitchen_orders for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_kitchen_member(kitchen_id)
    or public.is_admin()
  );

create policy kitchen_order_items_related_read
  on public.kitchen_order_items for select
  to authenticated
  using (
    exists (
      select 1
      from public.kitchen_orders ko
      where ko.id = kitchen_order_id
        and (
          ko.user_id = (select auth.uid())
          or public.is_kitchen_member(ko.kitchen_id)
          or public.is_admin()
        )
    )
  );

create policy daily_orders_related_read
  on public.daily_orders for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_kitchen_member(kitchen_id)
    or public.is_admin()
  );

create policy daily_order_items_related_read
  on public.daily_order_items for select
  to authenticated
  using (
    exists (
      select 1
      from public.daily_orders dor
      where dor.id = daily_order_id
        and (
          dor.user_id = (select auth.uid())
          or public.is_kitchen_member(dor.kitchen_id)
          or public.is_admin()
        )
    )
  );

create policy order_status_history_related_read
  on public.order_status_history for select
  to authenticated
  using (
    exists (
      select 1
      from public.daily_orders dor
      where dor.id = daily_order_id
        and (
          dor.user_id = (select auth.uid())
          or public.is_kitchen_member(dor.kitchen_id)
          or public.is_admin()
        )
    )
  );

-- Payment mutation and webhook event access remain server-only.
create policy payments_select_own
  on public.payments for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy payment_events_admin_read
  on public.payment_events for select
  to authenticated
  using (public.is_admin());

-- Meal log and private user tracking
create policy meal_log_entries_owner_read
  on public.meal_log_entries for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy meal_log_entries_subscriber_insert
  on public.meal_log_entries for insert
  to authenticated
  with check (
    (
      user_id = (select auth.uid())
      and public.has_active_subscription()
      and (
        source in ('manual', 'image_estimate')
        or (
          source = 'recipe'
          and exists (
            select 1
            from public.meal_plan_items mpi
            join public.meal_plans mp on mp.id = mpi.meal_plan_id
            where mpi.id = meal_plan_item_id
              and mp.user_id = (select auth.uid())
          )
        )
        or (
          source = 'kitchen'
          and exists (
            select 1
            from public.daily_orders dor
            where dor.id = daily_order_id
              and dor.user_id = (select auth.uid())
              and dor.status = 'delivered'
          )
        )
      )
    )
    or public.is_admin()
  );

create policy meal_log_entries_subscriber_update
  on public.meal_log_entries for update
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin())
  with check (
    (
      user_id = (select auth.uid())
      and public.has_active_subscription()
      and (
        source in ('manual', 'image_estimate')
        or (
          source = 'recipe'
          and exists (
            select 1
            from public.meal_plan_items mpi
            join public.meal_plans mp on mp.id = mpi.meal_plan_id
            where mpi.id = meal_plan_item_id
              and mp.user_id = (select auth.uid())
          )
        )
        or (
          source = 'kitchen'
          and exists (
            select 1
            from public.daily_orders dor
            where dor.id = daily_order_id
              and dor.user_id = (select auth.uid())
              and dor.status = 'delivered'
          )
        )
      )
    )
    or public.is_admin()
  );

create policy meal_log_entries_owner_delete
  on public.meal_log_entries for delete
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy meal_images_owner_read
  on public.meal_images for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy meal_images_subscriber_insert
  on public.meal_images for insert
  to authenticated
  with check (
    (user_id = (select auth.uid()) and public.has_active_subscription())
    or public.is_admin()
  );

create policy meal_images_subscriber_update
  on public.meal_images for update
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin())
  with check (
    (user_id = (select auth.uid()) and public.has_active_subscription())
    or public.is_admin()
  );

create policy meal_images_owner_delete
  on public.meal_images for delete
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy image_analysis_results_owner_read
  on public.image_analysis_results for select
  to authenticated
  using (
    exists (
      select 1
      from public.meal_images mi
      where mi.id = meal_image_id
        and mi.user_id = (select auth.uid())
    )
    or public.is_admin()
  );

create policy progress_entries_owner_read
  on public.progress_entries for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy progress_entries_subscriber_insert
  on public.progress_entries for insert
  to authenticated
  with check (
    (user_id = (select auth.uid()) and public.has_active_subscription())
    or public.is_admin()
  );

create policy progress_entries_subscriber_update
  on public.progress_entries for update
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin())
  with check (
    (user_id = (select auth.uid()) and public.has_active_subscription())
    or public.is_admin()
  );

create policy progress_entries_owner_delete
  on public.progress_entries for delete
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy reviews_public_read
  on public.reviews for select
  to anon, authenticated
  using (
    is_visible
    or user_id = (select auth.uid())
    or public.is_kitchen_member(kitchen_id)
    or public.is_admin()
  );

create policy reviews_create_after_delivery
  on public.reviews for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.kitchen_orders ko
      where ko.id = kitchen_order_id
        and ko.user_id = (select auth.uid())
        and ko.kitchen_id = kitchen_id
        and ko.status = 'completed'
    )
  );

create policy reviews_update_own
  on public.reviews for update
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin())
  with check (user_id = (select auth.uid()) or public.is_admin());

create policy product_events_insert_own
  on public.product_events for insert
  to authenticated
  with check (user_id is null or user_id = (select auth.uid()));

create policy product_events_admin_read
  on public.product_events for select
  to authenticated
  using (public.is_admin());

-- Prevent an authenticated user from changing their own privileged role.
revoke update on public.profiles from authenticated;
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;

-- ============================================================================
-- STORAGE BUCKETS AND POLICIES
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'dish-images',
    'dish-images',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'review-images',
    'review-images',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'meal-scan-images',
    'meal-scan-images',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy meal_scan_storage_select_own
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'meal-scan-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy meal_scan_storage_insert_own
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'meal-scan-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.has_active_subscription()
  );

create policy meal_scan_storage_update_own
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'meal-scan-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'meal-scan-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.has_active_subscription()
  );

create policy meal_scan_storage_delete_own
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'meal-scan-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy review_storage_select_own
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'review-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy review_storage_insert_own
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'review-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy review_storage_delete_own
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'review-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
