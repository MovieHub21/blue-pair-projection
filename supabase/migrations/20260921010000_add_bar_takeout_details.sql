alter table public.bar_orders
  add column if not exists takeout boolean not null default false,
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists delivery_address text;

create index if not exists bar_orders_takeout_idx
  on public.bar_orders(takeout, created_at desc);
