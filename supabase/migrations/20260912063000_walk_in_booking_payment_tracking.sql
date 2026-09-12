-- Walk-in booking and payment tracking
-- Adds booking source/staff attribution, actual check-in/out timestamps,
-- and customer linkage for payment analytics.

alter table public.bookings
  add column if not exists source text not null default 'online',
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists checked_in_at timestamptz,
  add column if not exists checked_out_at timestamptz;

alter table public.payments
  add column if not exists customer_id text references public.customers(id) on delete set null;

alter table public.bookings
  add constraint bookings_source_check check (source in ('online','walk_in'));

alter table public.payments
  add constraint payments_method_check check (method in ('Card','Bank Transfer','Paystack','Cash','POS'));

create index if not exists bookings_source_idx on public.bookings(source);
create index if not exists bookings_created_by_idx on public.bookings(created_by);
create index if not exists payments_customer_id_idx on public.payments(customer_id);
