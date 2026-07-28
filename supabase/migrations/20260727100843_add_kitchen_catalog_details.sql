-- Extend the kitchen marketplace catalogue with the information required by
-- the partner-kitchen browsing and offer-detail screens.

alter table public.kitchen_offers
  add column code text,
  add column old_price_amount numeric(12, 2),
  add column meals_per_day smallint not null default 1,
  add column calories_kcal numeric(8, 2),
  add column protein_g numeric(8, 2),
  add column carbs_g numeric(8, 2),
  add column fat_g numeric(8, 2),
  add column diet_types text[] not null default '{}',
  add column menu_highlights text[] not null default '{}',
  add column included_items text[] not null default '{}',
  add column delivery_description text,
  add column badge text,
  add column distance_km numeric(6, 2);

alter table public.kitchen_offers
  add constraint kitchen_offers_code_not_blank
    check (code is null or btrim(code) <> ''),
  add constraint kitchen_offers_old_price_nonnegative
    check (old_price_amount is null or old_price_amount >= 0),
  add constraint kitchen_offers_meals_per_day_positive
    check (meals_per_day between 1 and 6),
  add constraint kitchen_offers_nutrition_nonnegative
    check (
      (calories_kcal is null or calories_kcal >= 0)
      and (protein_g is null or protein_g >= 0)
      and (carbs_g is null or carbs_g >= 0)
      and (fat_g is null or fat_g >= 0)
    ),
  add constraint kitchen_offers_distance_nonnegative
    check (distance_km is null or distance_km >= 0);

create unique index kitchen_offers_code_unique_idx
  on public.kitchen_offers(code)
  where code is not null;

create index kitchen_offers_marketplace_filter_idx
  on public.kitchen_offers(status, type, package_days, price_amount)
  where status = 'active';

create index kitchen_service_areas_marketplace_filter_idx
  on public.kitchen_service_areas(city, district, kitchen_id)
  where is_active;

create table public.kitchen_offer_reviews (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.kitchen_offers(id) on delete cascade,
  external_code text not null unique,
  author_name text not null,
  rating smallint not null,
  comment text not null,
  verified_purchase boolean not null default false,
  reviewed_on date not null,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kitchen_offer_reviews_author_not_blank
    check (btrim(author_name) <> ''),
  constraint kitchen_offer_reviews_comment_not_blank
    check (btrim(comment) <> ''),
  constraint kitchen_offer_reviews_rating_range
    check (rating between 1 and 5)
);

create index kitchen_offer_reviews_visible_offer_idx
  on public.kitchen_offer_reviews(offer_id, reviewed_on desc)
  where is_visible;

create trigger set_kitchen_offer_reviews_updated_at
  before update on public.kitchen_offer_reviews
  for each row execute function public.set_updated_at();

alter table public.kitchen_offer_reviews enable row level security;

create policy kitchen_offer_reviews_public_read
  on public.kitchen_offer_reviews for select
  to anon, authenticated
  using (
    is_visible
    and exists (
      select 1
      from public.kitchen_offers ko
      join public.kitchens k on k.id = ko.kitchen_id
      where ko.id = offer_id
        and ko.status = 'active'
        and k.status = 'active'
        and (ko.available_from is null or ko.available_from <= current_date)
        and (ko.available_until is null or ko.available_until >= current_date)
    )
  );

grant select on table public.kitchen_offer_reviews to anon, authenticated;
grant select, insert, update, delete on table public.kitchen_offer_reviews to service_role;
