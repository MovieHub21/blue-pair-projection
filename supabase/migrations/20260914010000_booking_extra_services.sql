alter table public.bookings
  add column if not exists extra_services jsonb not null default '[]'::jsonb;
