-- Keep every room marked for maintenance visible in the maintenance task queue,
-- including status changes made outside the admin UI.
create or replace function public.ensure_room_maintenance_ticket()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status <> 'maintenance' then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    if old.status is not distinct from new.status then
      return new;
    end if;
  end if;
  if not exists (
      select 1 from public.maintenance_tickets mt
      where mt.room = new.room_number and mt.status not in ('resolved', 'closed', 'completed')
  ) then
    insert into public.maintenance_tickets
      (room, issue, priority, assigned_to, date_reported, status, notes)
    values
      (new.room_number, 'Room marked for maintenance', 'Medium', 'Unassigned',
       current_date::text, 'open', 'Created automatically when the room was marked for maintenance.');
  end if;
  return new;
end;
$$;

drop trigger if exists ensure_room_maintenance_ticket_trigger on public.rooms;
create trigger ensure_room_maintenance_ticket_trigger
after insert or update of status on public.rooms
for each row execute function public.ensure_room_maintenance_ticket();

-- Backfill maintenance rooms that were set before the room-to-ticket workflow existed.
insert into public.maintenance_tickets
  (room, issue, priority, assigned_to, date_reported, status, notes)
select
  r.room_number, 'Room marked for maintenance', 'Medium', 'Unassigned',
  current_date::text, 'open', 'Created automatically for an existing room marked for maintenance.'
from public.rooms r
where r.status = 'maintenance'
  and not exists (
    select 1 from public.maintenance_tickets mt
    where mt.room = r.room_number and mt.status not in ('resolved', 'closed', 'completed')
  );

-- The current checkout trigger only set the room's daily state; ensure it also
-- creates the task that cleaners and reception work from.
create or replace function public.sync_booking_room_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_number text;
  v_room_type text;
begin
  if new.status <> 'checked_out' or old.status is not distinct from new.status or new.room_id is null then
    return new;
  end if;

  if exists (select 1 from public.rooms where id = new.room_id and status in ('maintenance', 'available_soon')) then
    return new;
  end if;

  insert into public.room_daily_statuses (room_id, status, status_date, notes, updated_at)
  values (new.room_id, 'cleaning_required', coalesce(new.checked_out_at::date, current_date), 'Guest checked out; cleaning required.', now())
  on conflict (room_id) do update set status = excluded.status, status_date = excluded.status_date, notes = excluded.notes, updated_at = now();

  select r.room_number, rt.name into v_room_number, v_room_type
  from public.rooms r left join public.room_types rt on rt.id = r.room_type_id
  where r.id = new.room_id;
  if v_room_number is not null then
    insert into public.housekeeping_tasks
      (id, room, room_type, checkout_time, priority, assigned_to, status, notes, room_id, booking_id)
    values
      ('hk_' || gen_random_uuid()::text, v_room_number, coalesce(v_room_type, ''),
       to_char(coalesce(new.checked_out_at, now()) at time zone 'Africa/Lagos', 'HH12:MI AM'),
       'High', 'Unassigned', 'pending', 'Auto-created after guest checkout.', new.room_id, new.id)
    on conflict (room_id) where room_id is not null and status <> 'completed' do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists booking_room_lifecycle_trigger on public.bookings;
create trigger booking_room_lifecycle_trigger
after update of status, checked_out_at on public.bookings
for each row execute function public.sync_booking_room_lifecycle();

-- When maintenance finishes, restore the housekeeping state if the room still
-- has a cleaning task so it cannot appear ready for a guest too early.
create or replace function public.sync_maintenance_room_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_id text;
  v_room_status text;
  v_housekeeping_status text;
begin
  select id, status into v_room_id, v_room_status
  from public.rooms where room_number = new.room limit 1;
  if v_room_id is null then return new; end if;

  if new.status not in ('resolved', 'closed', 'completed') then
    if v_room_status <> 'available_soon' then update public.rooms set status = 'maintenance' where id = v_room_id; end if;
    return new;
  end if;

  if exists (select 1 from public.maintenance_tickets mt where mt.room = new.room and mt.status not in ('resolved', 'closed', 'completed')) then
    return new;
  end if;
  if v_room_status = 'available_soon' then return new; end if;

  select status into v_housekeeping_status
  from public.housekeeping_tasks where room_id = v_room_id and status <> 'completed'
  order by checkout_time desc limit 1;
  if v_housekeeping_status is not null then
    insert into public.room_daily_statuses (room_id, status, status_date, notes, updated_at)
    values (v_room_id, case when v_housekeeping_status = 'in_progress' then 'cleaning' else 'cleaning_required' end,
      current_date, 'Maintenance completed; housekeeping is still required.', now())
    on conflict (room_id) do update set status = excluded.status, status_date = excluded.status_date, notes = excluded.notes, updated_at = now();
    update public.rooms set status = 'available' where id = v_room_id;
  elsif not exists (select 1 from public.bookings b where b.room_id = v_room_id and b.status = 'checked_in') then
    delete from public.room_daily_statuses where room_id = v_room_id;
    update public.rooms set status = 'available' where id = v_room_id;
  end if;
  return new;
end;
$$;

-- Existing checkouts with no live task should also appear in the queue.
insert into public.housekeeping_tasks
  (id, room, room_type, checkout_time, priority, assigned_to, status, notes, room_id, booking_id)
select distinct on (r.id)
  'hk_' || gen_random_uuid()::text, r.room_number, coalesce(rt.name, ''),
  to_char(coalesce(b.checked_out_at, now()) at time zone 'Africa/Lagos', 'HH12:MI AM'),
  'High', 'Unassigned', 'pending', 'Backfilled after guest checkout.', r.id, b.id
from public.bookings b
join public.rooms r on r.id = b.room_id
join public.room_daily_statuses rs on rs.room_id = r.id and rs.status in ('cleaning_required', 'cleaning')
left join public.room_types rt on rt.id = r.room_type_id
where b.status = 'checked_out'
  and r.status not in ('maintenance', 'available_soon')
  and not exists (
    select 1 from public.housekeeping_tasks hk
    where hk.room_id = r.id and hk.status <> 'completed'
  )
order by r.id, b.checked_out_at desc nulls last;
