-- Prevent two callback/webhook/cron requests from creating the same paid Annex order.
-- A read-only production check found no duplicate non-null payment references before this index.
create unique index if not exists bar_orders_payment_reference_unique
  on public.bar_orders (payment_reference)
  where payment_reference is not null;

-- One transaction claims a checkout and inserts the order and all its items.
-- The caller must verify the transaction with Paystack before invoking this function.
create or replace function public.settle_annex_order_checkout(
  p_checkout_reference text,
  p_payment_reference text,
  p_order_id text,
  p_order_reference text
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_checkout public.bar_order_checkouts%rowtype;
  v_existing_order_id text;
  v_existing_order_reference text;
  v_item jsonb;
  v_item_type text;
  v_item_id text;
  v_quantity integer;
  v_unit_price numeric;
  v_line_total numeric;
begin
  select * into v_checkout
  from public.bar_order_checkouts
  where reference = p_checkout_reference
  for update;

  if not found then
    raise exception 'Annex checkout not found';
  end if;

  select id, reference into v_existing_order_id, v_existing_order_reference
  from public.bar_orders
  where payment_reference = p_payment_reference
  limit 1;

  if v_existing_order_id is not null then
    update public.bar_order_checkouts
    set status = 'paid', payment_reference = p_payment_reference, updated_at = now()
    where id = v_checkout.id;
    return jsonb_build_object('order_id', v_existing_order_id, 'order_reference', v_existing_order_reference, 'created', false);
  end if;

  if v_checkout.status not in ('pending', 'failed', 'paid') then
    raise exception 'Annex checkout is not payable';
  end if;

  if jsonb_typeof(v_checkout.payload->'items') is distinct from 'array' then
    raise exception 'Annex checkout has invalid items';
  end if;
  if jsonb_array_length(v_checkout.payload->'items') = 0 then
    raise exception 'Annex checkout has no items';
  end if;

  insert into public.bar_orders (
    id, reference, customer_id, booking_id, outlet, payment_reference,
    delivery_location, delivery_label, takeout, contact_email, contact_phone,
    delivery_address, service_point, notes, subtotal, total, status
  ) values (
    p_order_id,
    p_order_reference,
    v_checkout.customer_id,
    nullif(v_checkout.payload->>'bookingId', ''),
    coalesce(nullif(v_checkout.payload->>'outlet', ''), 'bar'),
    p_payment_reference,
    coalesce(nullif(v_checkout.payload->>'location', ''), 'outdoor_eatery'),
    coalesce(nullif(v_checkout.payload->>'deliveryLabel', ''), 'Annex'),
    coalesce((v_checkout.payload->>'takeout')::boolean, false),
    nullif(v_checkout.payload->>'contactEmail', ''),
    nullif(v_checkout.payload->>'contactPhone', ''),
    nullif(v_checkout.payload->>'deliveryAddress', ''),
    nullif(v_checkout.payload->>'servicePoint', ''),
    coalesce(v_checkout.payload->>'notes', ''),
    v_checkout.total,
    v_checkout.total,
    'pending'
  );

  for v_item in select value from jsonb_array_elements(v_checkout.payload->'items')
  loop
    v_item_type := v_item->>'itemType';
    v_item_id := nullif(v_item->>'id', '');
    v_quantity := (v_item->>'quantity')::integer;
    v_unit_price := (v_item->>'unitPrice')::numeric;
    v_line_total := (v_item->>'lineTotal')::numeric;

    if v_item_type not in ('drink', 'food') or v_item_id is null or v_quantity is null or v_quantity < 1
       or v_unit_price is null or v_line_total is null then
      raise exception 'Annex checkout contains an invalid item';
    end if;

    insert into public.bar_order_items (
      id, order_id, drink_id, menu_item_id, item_type, drink_name,
      unit_price, quantity, line_total
    ) values (
      md5(random()::text || clock_timestamp()::text),
      p_order_id,
      case when v_item_type = 'drink' then v_item_id else null end,
      case when v_item_type = 'food' then v_item_id else null end,
      v_item_type,
      coalesce(v_item->>'name', 'Item'),
      v_unit_price,
      v_quantity,
      v_line_total
    );
  end loop;

  update public.bar_order_checkouts
  set status = 'paid', payment_reference = p_payment_reference, updated_at = now()
  where id = v_checkout.id;

  return jsonb_build_object('order_id', p_order_id, 'order_reference', p_order_reference, 'created', true);
end;
$$;

revoke all on function public.settle_annex_order_checkout(text, text, text, text) from public, anon, authenticated;
grant execute on function public.settle_annex_order_checkout(text, text, text, text) to service_role;
