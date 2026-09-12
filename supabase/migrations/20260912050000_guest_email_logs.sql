create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  event text not null,
  booking_id text,
  request_id text,
  recipient text not null,
  subject text not null,
  resend_id text,
  created_at timestamptz not null default now()
);

alter table public.email_logs enable row level security;

comment on table public.email_logs is 'Server-side audit and idempotency log for Blue Pair transactional emails';
