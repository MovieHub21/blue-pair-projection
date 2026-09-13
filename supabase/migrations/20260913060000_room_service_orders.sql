create table if not exists public.room_service_orders (
  id text primary key,
  reference text not null unique,
  customer_id text not null references public.customers(id) on delete cascade,
  booking_ref text not null default '',
  room text not null,
  guest_name text not null default '',
  items jsonb not null default '[]'::jsonb,
  notes text not null default '',
  total numeric(12,2) not null default 0,
  payment_reference text unique,
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  status text not null default 'pending' check (status in ('pending','being_attended_to','attended','delivered','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  attended_at timestamptz,
  delivered_at timestamptz
);

create index if not exists room_service_orders_customer_idx on public.room_service_orders(customer_id, created_at desc);
create index if not exists room_service_orders_status_idx on public.room_service_orders(status, created_at desc);

alter table public.room_service_orders enable row level security;

drop policy if exists "Guests can view their room service orders" on public.room_service_orders;
create policy "Guests can view their room service orders"
on public.room_service_orders for select to authenticated
using (customer_id in (select id from public.customers where user_id = auth.uid()));

create or replace function public.touch_room_service_order()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists room_service_orders_touch on public.room_service_orders;
create trigger room_service_orders_touch
before update on public.room_service_orders
for each row execute function public.touch_room_service_order();

alter table public.room_service_orders replica identity full;
