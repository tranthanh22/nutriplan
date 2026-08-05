alter table public.daily_order_items
  add column if not exists image_path text;

update public.daily_order_items
set image_path = case
  when lower(dish_name) like '%cá%' then '/images/figma/grilled-salmon.jpg'
  when lower(dish_name) like '%gà%' then '/images/figma/chicken-vegetable-bowl.jpg'
  when lower(dish_name) like '%bò%' then '/images/figma/pho-beef.jpg'
  else '/images/figma/healthy-meal-spread.jpg'
end
where image_path is null or btrim(image_path) = '';

create table public.kitchen_meal_change_requests (
  id uuid primary key default gen_random_uuid(),
  daily_order_id uuid not null references public.daily_orders(id) on delete cascade,
  daily_order_item_id uuid not null references public.daily_order_items(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kitchen_id uuid not null references public.kitchens(id) on delete cascade,
  current_dish_name text not null,
  reason text not null,
  note text,
  status text not null default 'pending',
  response_note text,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kitchen_meal_change_requests_reason_check
    check (reason in ('allergy_concern', 'dislike', 'diet_preference', 'other')),
  constraint kitchen_meal_change_requests_status_check
    check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  constraint kitchen_meal_change_requests_note_length
    check (note is null or char_length(note) <= 500),
  constraint kitchen_meal_change_requests_resolution_check
    check (
      (status = 'pending' and resolved_at is null)
      or (status <> 'pending' and resolved_at is not null)
    )
);

create unique index kitchen_meal_change_requests_one_pending_item_idx
  on public.kitchen_meal_change_requests (daily_order_item_id, user_id)
  where status = 'pending';

create index kitchen_meal_change_requests_user_created_idx
  on public.kitchen_meal_change_requests (user_id, created_at desc);

create index kitchen_meal_change_requests_kitchen_status_idx
  on public.kitchen_meal_change_requests (kitchen_id, status, created_at);

alter table public.kitchen_meal_change_requests enable row level security;

create policy kitchen_meal_change_requests_related_read
  on public.kitchen_meal_change_requests for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_kitchen_member(kitchen_id)
    or public.is_admin()
  );

revoke all on table public.kitchen_meal_change_requests from public, anon;
grant select on table public.kitchen_meal_change_requests to authenticated;
grant all on table public.kitchen_meal_change_requests to service_role;
