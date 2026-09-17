create extension if not exists btree_gist;
create index if not exists bookings_room_dates_idx on public.bookings (room_id, check_in, check_out);
create index if not exists bookings_room_status_dates_idx on public.bookings (room_id, status, payment_status, check_in, check_out);
alter table public.bookings drop constraint if exists bookings_room_dates_no_overlap;
alter table public.bookings add constraint bookings_room_dates_no_overlap exclude using gist (room_id with =, daterange(check_in, check_out, '[)') with &&) where (room_id is not null and status in ('confirmed','checked_in') and payment_status = 'paid');
create or replace function public.booking_policy() returns jsonb language sql immutable as $$ select jsonb_build_object('check_in_time','15:00','check_out_time','12:00','timezone','Africa/Lagos','minimum_nights',1); $$;
