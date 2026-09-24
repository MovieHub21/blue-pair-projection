-- Unified Annex food + drink ordering, guest self-service controls, and payment references.
-- Existing bar orders remain valid and are treated as the Annex Bar outlet.

alter table public.bar_orders
  add column if not exists outlet text not null default 'bar',
  add column if not exists payment_reference text;

alter table public.bar_orders
  drop constraint if exists bar_orders_outlet_check;

alter table public.bar_orders
  add constraint bar_orders_outlet_check
  check (outlet in ('bar','restaurant','grilling','outdoor_eatery'));

alter table public.bar_orders
  drop constraint if exists bar_orders_status_check;

alter table public.bar_orders
  add constraint bar_orders_status_check
  check (status in ('pending','accepted','preparing','ready','delivered','cancelled'));

create index if not exists bar_orders_outlet_idx
  on public.bar_orders(outlet, created_at desc);

alter table public.bar_order_items
  add column if not exists item_type text not null default 'drink',
  add column if not exists menu_item_id text references public.menu_items(id) on delete set null;

alter table public.bar_order_items
  drop constraint if exists bar_order_items_item_type_check;

alter table public.bar_order_items
  add constraint bar_order_items_item_type_check
  check (item_type in ('drink','food'));

create index if not exists bar_order_items_menu_item_idx
  on public.bar_order_items(menu_item_id);

alter table public.bar_orders replica identity full;
alter table public.bar_order_items replica identity full;

drop trigger if exists bluepair_realtime_change on public.bar_orders;
create trigger bluepair_realtime_change
after insert or update or delete on public.bar_orders
for each row execute function public.broadcast_bluepair_database_change();

drop trigger if exists bluepair_realtime_change on public.bar_order_items;
create trigger bluepair_realtime_change
after insert or update or delete on public.bar_order_items
for each row execute function public.broadcast_bluepair_database_change();
