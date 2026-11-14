create table if not exists public.newsletter_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  design jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists newsletter_templates_updated_idx
  on public.newsletter_templates(updated_at desc);

alter table public.newsletter_templates enable row level security;
revoke all on public.newsletter_templates from anon, authenticated;
grant all on public.newsletter_templates to service_role;
