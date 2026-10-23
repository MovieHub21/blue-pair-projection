create table if not exists public.club_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  price numeric(12,2) not null default 0 check (price >= 0),
  description text not null default '',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists club_events_public_date_idx
  on public.club_events (date) where published = true;

alter table public.club_events enable row level security;

create policy "Public can read published club events"
  on public.club_events for select using (published = true);

create policy "Staff can manage club events"
  on public.club_events for all
  using (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid()))
  with check (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid()));

create or replace function public.set_club_event_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists club_events_updated_at on public.club_events;
create trigger club_events_updated_at before update on public.club_events
  for each row execute function public.set_club_event_updated_at();

drop trigger if exists bluepair_realtime_change on public.club_events;
create trigger bluepair_realtime_change after insert or update or delete on public.club_events
  for each row execute function public.broadcast_bluepair_database_change();

insert into public.role_permissions (role, section, label, allowed, sort_order)
select roles.role, 'club', 'Club', coalesce(events.allowed, true), coalesce(events.sort_order + 1, 81)
from unnest(enum_range(null::public.app_role)) as roles(role)
left join public.role_permissions events on events.role = roles.role and events.section = 'events'
on conflict (role, section) do update
set label = excluded.label, sort_order = excluded.sort_order;
