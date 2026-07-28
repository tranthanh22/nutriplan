-- Make Stripe fulfillment safe when the webhook and the success-page
-- reconciliation endpoint process the same Checkout Session concurrently.

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
    return jsonb_build_object('duplicate', true, 'reason', 'event_already_processed');
  end if;

  select * into v_payment
  from public.payments
  where id = p_payment_id and type = 'subscription'
  for update;

  if not found then
    raise exception 'payment_not_found';
  end if;

  -- A webhook and success-page reconciliation may use different event ids.
  -- Locking the payment row and checking its state prevents double fulfillment.
  if v_payment.status = 'succeeded' then
    update public.payment_events
    set processing_status = 'processed', processed_at = now()
    where provider = 'stripe' and provider_event_id = p_provider_event_id;

    return jsonb_build_object(
      'duplicate',
      true,
      'reason',
      'payment_already_succeeded',
      'subscriptionId',
      v_payment.subscription_id
    );
  end if;

  if v_payment.status not in ('pending', 'processing') then
    raise exception 'payment_not_payable';
  end if;

  select * into v_subscription
  from public.subscriptions
  where id = v_payment.subscription_id
  for update;

  if not found then
    raise exception 'subscription_not_found';
  end if;

  select * into v_plan
  from public.subscription_plans
  where id = v_subscription.plan_id;

  if not found then
    raise exception 'subscription_plan_not_found';
  end if;

  select max(current_period_end) into v_existing_end
  from public.subscriptions
  where user_id = v_payment.user_id
    and id <> v_subscription.id
    and status in ('active', 'cancel_at_period_end')
    and current_period_end > p_paid_at;

  v_period_start := greatest(p_paid_at, coalesce(v_existing_end, p_paid_at));
  v_period_end := v_period_start
    + make_interval(days => coalesce((v_plan.features ->> 'access_days')::integer, 30));

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
    failure_code = null,
    failure_message = null,
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

revoke all on function public.complete_subscription_payment(uuid, text, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.complete_subscription_payment(uuid, text, text, timestamptz)
  to service_role;
