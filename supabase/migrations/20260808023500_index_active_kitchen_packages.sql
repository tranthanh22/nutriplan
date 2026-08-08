create index if not exists kitchen_orders_user_offer_active_idx
  on public.kitchen_orders (user_id, offer_id, status)
  where offer_id is not null
    and status in ('paid', 'confirmed');

