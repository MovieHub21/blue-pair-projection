alter table public.newsletter_campaigns
  add column if not exists recipient_mode text not null default 'all'
  check (recipient_mode in ('all','custom'));
