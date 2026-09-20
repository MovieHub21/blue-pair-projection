create table if not exists public.bar_orders (
  id text primary key,
  reference text not null unique,
  customer_id text not null references public.customers(id) on delete cascade,
  booking_id text references public.bookings(id) on delete set null,
  delivery_location text not null check (delivery_location in ('room','short_let','bar','outdoor_eatery','vip_lounge')),
  delivery_label text not null,
  notes text not null default '',
  subtotal numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  status text not null default 'pending' check (status in ('pending','accepted','preparing','ready','delivered','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  accepted_at timestamptz,
  delivered_at timestamptz
);

create table if not exists public.bar_order_items (
  id text primary key,
  order_id text not null references public.bar_orders(id) on delete cascade,
  drink_id text references public.drinks(id) on delete set null,
  drink_name text not null,
  unit_price numeric(12,2) not null default 0,
  quantity integer not null check (quantity > 0 and quantity <= 50),
  line_total numeric(12,2) not null default 0
);

create index if not exists bar_orders_customer_idx on public.bar_orders(customer_id, created_at desc);
create index if not exists bar_orders_status_idx on public.bar_orders(status, created_at desc);
create index if not exists bar_order_items_order_idx on public.bar_order_items(order_id);

alter table public.bar_orders enable row level security;
alter table public.bar_order_items enable row level security;

drop policy if exists "Guests can view their bar orders" on public.bar_orders;
create policy "Guests can view their bar orders"
on public.bar_orders for select to authenticated
using (customer_id in (select id from public.customers where user_id = auth.uid()));

drop policy if exists "Guests can view their bar order items" on public.bar_order_items;
create policy "Guests can view their bar order items"
on public.bar_order_items for select to authenticated
using (order_id in (
  select id from public.bar_orders
  where customer_id in (select id from public.customers where user_id = auth.uid())
));

create or replace function public.touch_bar_order()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bar_orders_touch on public.bar_orders;
create trigger bar_orders_touch
before update on public.bar_orders
for each row execute function public.touch_bar_order();

alter table public.bar_orders replica identity full;
alter table public.bar_order_items replica identity full;
