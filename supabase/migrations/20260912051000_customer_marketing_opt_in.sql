alter table public.customers
  add column if not exists marketing_email_opt_in boolean not null default false;
