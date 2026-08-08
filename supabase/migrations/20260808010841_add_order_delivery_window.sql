create or replace function public.create_mock_kitchen_order_schedule(
  p_user_id uuid,
  p_offer_code text,
  p_recipient_name text,
  p_recipient_phone text,
  p_delivery_address jsonb,
  p_delivery_note text,
  p_delivery_window_start time,
  p_delivery_window_end time,
  p_idempotency_key text,
  p_quantity integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
  v_order_id uuid;
begin
  if
    p_delivery_window_start is null
    or p_delivery_window_end is null
    or p_delivery_window_end <= p_delivery_window_start
  then
    raise exception 'invalid_delivery_window';
  end if;

  v_result := public.create_mock_kitchen_order_schedule(
    p_user_id,
    p_offer_code,
    p_recipient_name,
    p_recipient_phone,
    p_delivery_address,
    p_delivery_note,
    p_idempotency_key,
    p_quantity
  );

  if coalesce((v_result ->> 'duplicate')::boolean, false) = false then
    v_order_id := (v_result ->> 'id')::uuid;

    update public.daily_orders
    set
      delivery_window_start = p_delivery_window_start,
      delivery_window_end = p_delivery_window_end
    where kitchen_order_id = v_order_id;

    update public.kitchen_orders
    set policy_snapshot = policy_snapshot || jsonb_build_object(
      'delivery_window_start', left(p_delivery_window_start::text, 5),
      'delivery_window_end', left(p_delivery_window_end::text, 5)
    )
    where id = v_order_id;
  end if;

  return v_result;
end;
$$;

revoke all on function public.create_mock_kitchen_order_schedule(
  uuid, text, text, text, jsonb, text, time, time, text, integer
) from public, anon, authenticated;

grant execute on function public.create_mock_kitchen_order_schedule(
  uuid, text, text, text, jsonb, text, time, time, text, integer
) to service_role;
