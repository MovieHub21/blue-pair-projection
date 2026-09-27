alter table public.bar_orders
  add column if not exists service_point text;

alter table public.bar_order_checkouts
  add column if not exists service_point text;
