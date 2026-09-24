-- Atomically replace the items for a still-pending Annex order.
create or replace function public.replace_annex_order_items(
  p_order_id text,
  p_items jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.bar_order_items where order_id = p_order_id;

  insert into public.bar_order_items (
    id, order_id, drink_id, menu_item_id, item_type, drink_name, unit_price, quantity, line_total
  )
  select
    'aoi_' || md5(random()::text || clock_timestamp()::text || x.ord::text),
    p_order_id,
    case when x.item->>'itemType' = 'drink' then x.item->>'id' else null end,
    case when x.item->>'itemType' = 'food' then x.item->>'id' else null end,
    case when x.item->>'itemType' = 'drink' then 'drink' else 'food' end,
    x.item->>'name',
    (x.item->>'unitPrice')::numeric,
    greatest(1, least(50, (x.item->>'quantity')::integer)),
    (x.item->>'lineTotal')::numeric
  from jsonb_array_elements(p_items) with ordinality as x(item, ord);
end;
$$;

revoke execute on function public.replace_annex_order_items(text, jsonb) from public, anon, authenticated;
grant execute on function public.replace_annex_order_items(text, jsonb) to service_role;
