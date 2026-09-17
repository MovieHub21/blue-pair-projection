-- Room availability is date-aware. Physical room status only controls operational readiness.
-- Reservation dates block a room for those dates; check-in/out do not create an occupied status.

update public.rooms set status='available' where status='occupied';
update public.rooms set status='cleaning' where status='cleaning_required';

create or replace function public.sync_booking_room_lifecycle()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_room_number text; v_room_type text;
begin
  if new.room_id is null then return new; end if;
  if new.status='checked_out' and old.status is distinct from new.status then
    update public.rooms set status='cleaning' where id=new.room_id;
    select r.room_number,rt.name into v_room_number,v_room_type
    from public.rooms r left join public.room_types rt on rt.id=r.room_type_id where r.id=new.room_id;
    if v_room_number is not null then
      insert into public.housekeeping_tasks (id,room,room_type,checkout_time,priority,assigned_to,status,notes,room_id,booking_id)
      values ('hk_'||floor(extract(epoch from clock_timestamp())*1000)::bigint,v_room_number,coalesce(v_room_type,''),
        to_char(now() at time zone 'Africa/Lagos','HH12:MI AM'),'High','Unassigned','pending','Auto-created after guest checkout.',new.room_id,new.id)
      on conflict (room_id) where room_id is not null and status <> 'completed' do nothing;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists booking_room_lifecycle_trigger on public.bookings;
create trigger booking_room_lifecycle_trigger after update of status, room_id on public.bookings
for each row execute function public.sync_booking_room_lifecycle();

create or replace function public.sync_housekeeping_room_lifecycle()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.room_id is null then return new; end if;
  if new.status='in_progress' then
    update public.rooms set status='cleaning' where id=new.room_id;
  elsif new.status='completed' then
    if exists (select 1 from public.maintenance_tickets mt where mt.room=new.room and mt.status <> 'resolved') then
      update public.rooms set status='maintenance' where id=new.room_id;
    elsif not exists (select 1 from public.bookings b where b.room_id=new.room_id and b.status='checked_in') then
      update public.rooms set status='available' where id=new.room_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists housekeeping_room_lifecycle_trigger on public.housekeeping_tasks;
create trigger housekeeping_room_lifecycle_trigger after insert or update of status, room_id on public.housekeeping_tasks
for each row execute function public.sync_housekeeping_room_lifecycle();

create or replace function public.sync_maintenance_room_lifecycle()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v_room_id text;
begin
  select id into v_room_id from public.rooms where room_number=new.room limit 1;
  if v_room_id is null then return new; end if;
  if new.status <> 'resolved' then
    update public.rooms set status='maintenance' where id=v_room_id;
  elsif not exists (select 1 from public.maintenance_tickets mt where mt.room=new.room and mt.status <> 'resolved') then
    if exists (select 1 from public.housekeeping_tasks hk where hk.room_id=v_room_id and hk.status <> 'completed') then
      update public.rooms set status='cleaning' where id=v_room_id;
    elsif not exists (select 1 from public.bookings b where b.room_id=v_room_id and b.status='checked_in') then
      update public.rooms set status='available' where id=v_room_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists maintenance_room_lifecycle_trigger on public.maintenance_tickets;
create trigger maintenance_room_lifecycle_trigger after insert or update of status, room on public.maintenance_tickets
for each row execute function public.sync_maintenance_room_lifecycle();
