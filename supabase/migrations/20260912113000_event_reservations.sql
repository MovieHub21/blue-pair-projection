create table if not exists public.event_reservations (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.events(id) on delete cascade,
  user_id uuid null references auth.users(id) on delete set null,
  guest_name text not null,
  guest_email text not null,
  guest_phone text not null,
  guest_count integer not null default 1 check (guest_count > 0),
  notes text null,
  status text not null default 'pending' check (status in ('pending','reserved','declined','cancelled')),
  staff_note text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reserved_at timestamptz null,
  reserved_by uuid null references auth.users(id) on delete set null
);

create index if not exists event_reservations_event_idx on public.event_reservations(event_id, created_at desc);
create index if not exists event_reservations_user_idx on public.event_reservations(user_id, created_at desc);
create index if not exists event_reservations_status_idx on public.event_reservations(status, created_at desc);

alter table public.event_reservations enable row level security;
create policy "Guests can view own event reservations" on public.event_reservations for select using (user_id = auth.uid());
create policy "Guests can create event reservations" on public.event_reservations for insert with check (user_id = auth.uid() or user_id is null);
create policy "Staff can manage event reservations" on public.event_reservations for all using (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid())) with check (exists (select 1 from public.user_roles ur where ur.user_id = auth.uid()));

create or replace function public.set_event_reservation_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists event_reservations_updated_at on public.event_reservations;
create trigger event_reservations_updated_at before update on public.event_reservations for each row execute function public.set_event_reservation_updated_at();

create or replace function public.mark_event_reservation_reserved()
returns trigger language plpgsql as $$ begin if new.status = 'reserved' and old.status is distinct from 'reserved' then new.reserved_at = coalesce(new.reserved_at, now()); end if; return new; end; $$;
drop trigger if exists event_reservation_reserved_at on public.event_reservations;
create trigger event_reservation_reserved_at before update on public.event_reservations for each row execute function public.mark_event_reservation_reserved();
