-- Atomic server-only helpers for Stripe subscription checkout and fulfillment.

create or replace function public.create_subscription_checkout(
  p_user_id uuid,
  p_plan_id uuid,
  p_idempotency_key text
)
returns table (
  subscription_id uuid,
  payment_id uuid,
  plan_code text,
  plan_name text,
  price_amount numeric,
  currency text,
  access_days integer,
  payment_status public.payment_status,
  payment_metadata jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan public.subscription_plans%rowtype;
  v_subscription_id uuid;
  v_payment_id uuid;
  v_existing record;
begin
  if p_user_id is null or p_idempotency_key is null or length(trim(p_idempotency_key)) < 8 then
    raise exception 'invalid_checkout_request';
  end if;

  select * into v_plan
  from public.subscription_plans
  where id = p_plan_id and is_active = true;

  if not found then
    raise exception 'subscription_plan_not_found';
  end if;

  select
    p.id as payment_id,
    p.subscription_id,
    p.status,
    p.metadata,
    sp.code,
    sp.name,
    sp.price_amount,
    sp.currency,
    coalesce((sp.features ->> 'access_days')::integer, 30) as access_days,
    p.user_id,
    s.plan_id
  into v_existing
  from public.payments p
  join public.subscriptions s on s.id = p.subscription_id
  join public.subscription_plans sp on sp.id = s.plan_id
  where p.idempotency_key = p_idempotency_key;

  if found then
    if v_existing.user_id <> p_user_id or v_existing.plan_id <> p_plan_id then
      raise exception 'idempotency_key_conflict';
    end if;

    return query select
      v_existing.subscription_id,
      v_existing.payment_id,
      v_existing.code,
      v_existing.name,
      v_existing.price_amount,
      v_existing.currency::text,
      v_existing.access_days,
      v_existing.status,
      v_existing.metadata;
    return;
  end if;

  insert into public.subscriptions (user_id, plan_id, status, provider)
  values (p_user_id, p_plan_id, 'pending_payment', 'stripe')
  returning id into v_subscription_id;

  insert into public.payments (
    user_id,
    type,
    subscription_id,
    provider,
    idempotency_key,
    amount,
    currency,
    status
  ) values (
    p_user_id,
    'subscription',
    v_subscription_id,
    'stripe',
    p_idempotency_key,
    v_plan.price_amount,
    v_plan.currency,
    'pending'
  ) returning id into v_payment_id;

  return query select
    v_subscription_id,
    v_payment_id,
    v_plan.code,
    v_plan.name,
    v_plan.price_amount,
    v_plan.currency::text,
    coalesce((v_plan.features ->> 'access_days')::integer, 30),
    'pending'::public.payment_status,
    '{}'::jsonb;
end;
$$;

create or replace function public.complete_subscription_payment(
  p_payment_id uuid,
  p_provider_event_id text,
  p_provider_payment_id text,
  p_paid_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.payments%rowtype;
  v_subscription public.subscriptions%rowtype;
  v_plan public.subscription_plans%rowtype;
  v_period_start timestamptz;
  v_period_end timestamptz;
  v_existing_end timestamptz;
begin
  insert into public.payment_events (
    provider,
    provider_event_id,
    event_type,
    payment_id,
    payload,
    processing_status
  ) values (
    'stripe',
    p_provider_event_id,
    'checkout.session.completed',
    p_payment_id,
    jsonb_build_object('provider_payment_id', p_provider_payment_id),
    'received'
  ) on conflict (provider, provider_event_id) do nothing;

  if not found then
    return jsonb_build_object('duplicate', true);
  end if;

  select * into v_payment
  from public.payments
  where id = p_payment_id and type = 'subscription'
  for update;

  if not found then
    raise exception 'payment_not_found';
  end if;

  select * into v_subscription
  from public.subscriptions
  where id = v_payment.subscription_id
  for update;

  select * into v_plan
  from public.subscription_plans
  where id = v_subscription.plan_id;

  select max(current_period_end) into v_existing_end
  from public.subscriptions
  where user_id = v_payment.user_id
    and id <> v_subscription.id
    and status in ('active', 'cancel_at_period_end')
    and current_period_end > p_paid_at;

  v_period_start := greatest(p_paid_at, coalesce(v_existing_end, p_paid_at));
  v_period_end := v_period_start + make_interval(days => coalesce((v_plan.features ->> 'access_days')::integer, 30));

  update public.subscriptions
  set status = 'expired', updated_at = now()
  where user_id = v_payment.user_id
    and id <> v_subscription.id
    and status in ('active', 'cancel_at_period_end');

  update public.payments
  set
    status = 'succeeded',
    provider_payment_id = p_provider_payment_id,
    paid_at = p_paid_at,
    updated_at = now()
  where id = p_payment_id;

  update public.subscriptions
  set
    status = 'active',
    provider = 'stripe',
    provider_subscription_id = p_provider_payment_id,
    current_period_start = v_period_start,
    current_period_end = v_period_end,
    activated_at = coalesce(activated_at, p_paid_at),
    updated_at = now()
  where id = v_subscription.id;

  update public.payment_events
  set processing_status = 'processed', processed_at = now()
  where provider = 'stripe' and provider_event_id = p_provider_event_id;

  return jsonb_build_object(
    'duplicate', false,
    'subscriptionId', v_subscription.id,
    'currentPeriodStart', v_period_start,
    'currentPeriodEnd', v_period_end
  );
end;
$$;

revoke all on function public.create_subscription_checkout(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.complete_subscription_payment(uuid, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.create_subscription_checkout(uuid, uuid, text) to service_role;
grant execute on function public.complete_subscription_payment(uuid, text, text, timestamptz) to service_role;
