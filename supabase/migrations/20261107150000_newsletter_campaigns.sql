create table if not exists public.newsletter_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  content_html text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.newsletter_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.newsletter_campaigns(id) on delete cascade,
  email text not null,
  recipient_name text not null default '',
  status text not null default 'pending' check (status in ('pending','dispatching','queued','failed')),
  background_job_id uuid references public.background_jobs(id) on delete set null,
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (campaign_id, email)
);
create index if not exists newsletter_recipients_pending_idx on public.newsletter_recipients(created_at, id) where status = 'pending';
create index if not exists newsletter_recipients_campaign_idx on public.newsletter_recipients(campaign_id, created_at);

create table if not exists public.newsletter_daily_limits (
  dispatch_date date primary key,
  reserved_count integer not null default 0 check (reserved_count between 0 and 50),
  updated_at timestamptz not null default now()
);

alter table public.newsletter_campaigns enable row level security;
alter table public.newsletter_recipients enable row level security;
alter table public.newsletter_daily_limits enable row level security;
revoke all on public.newsletter_campaigns, public.newsletter_recipients, public.newsletter_daily_limits from anon, authenticated;
grant all on public.newsletter_campaigns, public.newsletter_recipients, public.newsletter_daily_limits to service_role;

create or replace function public.claim_newsletter_recipients(p_dispatch_date date, p_limit integer default 50)
returns table(id uuid, campaign_id uuid, email text, recipient_name text, subject text, content_html text)
language plpgsql security definer set search_path = public
as $$
declare v_used integer; v_take integer;
begin
  insert into public.newsletter_daily_limits(dispatch_date, reserved_count) values (p_dispatch_date, 0)
    on conflict (dispatch_date) do nothing;
  select reserved_count into v_used from public.newsletter_daily_limits where dispatch_date = p_dispatch_date for update;
  v_take := least(greatest(coalesce(p_limit, 50), 0), 50 - v_used);
  if v_take <= 0 then return; end if;

  return query
  with chosen as (
    select r.id from public.newsletter_recipients r
    where r.status = 'pending'
    order by r.created_at, r.id
    for update skip locked
    limit v_take
  ), claimed as (
    update public.newsletter_recipients r set status = 'dispatching', error = null
    from chosen c where r.id = c.id returning r.id, r.campaign_id, r.email, r.recipient_name
  )
  select c.id, c.campaign_id, c.email, c.recipient_name, n.subject, n.content_html
  from claimed c join public.newsletter_campaigns n on n.id = c.campaign_id;

  get diagnostics v_take = row_count;
  update public.newsletter_daily_limits set reserved_count = reserved_count + v_take, updated_at = now()
    where dispatch_date = p_dispatch_date;
end;
$$;
revoke all on function public.claim_newsletter_recipients(date, integer) from public, anon, authenticated;
grant execute on function public.claim_newsletter_recipients(date, integer) to service_role;

insert into public.role_permissions (role, section, label, allowed, sort_order)
values ('super_admin', 'newsletter', 'Newsletter', true, 260), ('manager', 'newsletter', 'Newsletter', true, 260)
on conflict (role, section) do update set label = excluded.label, allowed = excluded.allowed, sort_order = excluded.sort_order, updated_at = now();
