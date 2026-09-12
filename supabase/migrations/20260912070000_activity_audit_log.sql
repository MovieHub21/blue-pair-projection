-- Central operational audit trail for owner/admin visibility.
-- Trigger-based logging means actions are captured even when a change is made
-- outside the React UI (for example, from a server route or future integration).

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid null,
  action text not null,
  entity_type text not null,
  entity_id text null,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_created_at_idx on public.activity_logs(created_at desc);
create index if not exists activity_logs_entity_idx on public.activity_logs(entity_type, entity_id);
create index if not exists activity_logs_actor_idx on public.activity_logs(actor_user_id, created_at desc);

alter table public.activity_logs enable row level security;

drop policy if exists "Staff can read activity logs" on public.activity_logs;
create policy "Staff can read activity logs"
  on public.activity_logs for select
  to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
    )
  );

drop policy if exists "Staff can insert activity logs" on public.activity_logs;
create policy "Staff can insert activity logs"
  on public.activity_logs for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
    )
  );

create or replace function public.record_activity_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_data jsonb;
  record_id text;
  action_label text;
  description_text text;
begin
  if tg_op = 'DELETE' then
    row_data := to_jsonb(old);
    record_id := coalesce(row_data->>'id', row_data->>'reference', row_data->>'booking_ref');
  else
    row_data := to_jsonb(new);
    record_id := coalesce(row_data->>'id', row_data->>'reference', row_data->>'booking_ref');
  end if;

  -- Keep the audit trail useful without copying potentially sensitive fields.
  row_data := row_data - array['password', 'password_hash', 'token', 'access_token', 'refresh_token', 'service_role_key'];

  action_label := lower(tg_op);
  description_text := initcap(replace(tg_table_name, '_', ' ')) || ' ' || lower(tg_op);

  insert into public.activity_logs (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  ) values (
    auth.uid(),
    action_label,
    tg_table_name,
    record_id,
    description_text,
    jsonb_build_object('operation', tg_op, 'table', tg_table_name, 'row', row_data)
  );

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

-- Core hotel operations and owner-visible configuration changes.
drop trigger if exists activity_bookings on public.bookings;
create trigger activity_bookings after insert or update or delete on public.bookings
for each row execute function public.record_activity_change();

drop trigger if exists activity_payments on public.payments;
create trigger activity_payments after insert or update or delete on public.payments
for each row execute function public.record_activity_change();

drop trigger if exists activity_rooms on public.rooms;
create trigger activity_rooms after insert or update or delete on public.rooms
for each row execute function public.record_activity_change();

drop trigger if exists activity_customers on public.customers;
create trigger activity_customers after insert or update or delete on public.customers
for each row execute function public.record_activity_change();

drop trigger if exists activity_guest_requests on public.guest_requests;
create trigger activity_guest_requests after insert or update or delete on public.guest_requests
for each row execute function public.record_activity_change();

drop trigger if exists activity_maintenance on public.maintenance_tickets;
create trigger activity_maintenance after insert or update or delete on public.maintenance_tickets
for each row execute function public.record_activity_change();

drop trigger if exists activity_housekeeping on public.housekeeping_tasks;
create trigger activity_housekeeping after insert or update or delete on public.housekeeping_tasks
for each row execute function public.record_activity_change();

drop trigger if exists activity_staff on public.staff;
create trigger activity_staff after insert or update or delete on public.staff
for each row execute function public.record_activity_change();

drop trigger if exists activity_room_types on public.room_types;
create trigger activity_room_types after insert or update or delete on public.room_types
for each row execute function public.record_activity_change();

drop trigger if exists activity_menu_items on public.menu_items;
create trigger activity_menu_items after insert or update or delete on public.menu_items
for each row execute function public.record_activity_change();

drop trigger if exists activity_drinks on public.drinks;
create trigger activity_drinks after insert or update or delete on public.drinks
for each row execute function public.record_activity_change();

drop trigger if exists activity_short_lets on public.short_lets;
create trigger activity_short_lets after insert or update or delete on public.short_lets
for each row execute function public.record_activity_change();

drop trigger if exists activity_events on public.events;
create trigger activity_events after insert or update or delete on public.events
for each row execute function public.record_activity_change();

drop trigger if exists activity_billboards on public.billboards;
create trigger activity_billboards after insert or update or delete on public.billboards
for each row execute function public.record_activity_change();

drop trigger if exists activity_offers on public.offers;
create trigger activity_offers after insert or update or delete on public.offers
for each row execute function public.record_activity_change();

drop trigger if exists activity_gallery on public.gallery_images;
create trigger activity_gallery after insert or update or delete on public.gallery_images
for each row execute function public.record_activity_change();

drop trigger if exists activity_amenities on public.amenities;
create trigger activity_amenities after insert or update or delete on public.amenities
for each row execute function public.record_activity_change();
