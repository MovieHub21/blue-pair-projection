create or replace function public.sync_maintenance_room_lifecycle()
returns trigger language plpgsql security definer set search_path=public
as $$
declare v_room_id text; v_current_status text;
begin
  select id,status into v_room_id,v_current_status
  from public.rooms
  where room_number=new.room
  limit 1;

  if v_room_id is null then return new; end if;

  if new.status <> 'resolved' then
    if v_current_status <> 'available_soon' then
      update public.rooms set status='maintenance' where id=v_room_id;
    end if;
  elsif not exists (
    select 1 from public.maintenance_tickets mt
    where mt.room=new.room and mt.status <> 'resolved'
  ) then
    if v_current_status = 'available_soon' then
      return new;
    elsif exists (
      select 1 from public.housekeeping_tasks hk
      where hk.room_id=v_room_id and hk.status <> 'completed'
    ) then
      update public.rooms set status='available' where id=v_room_id;
    elsif not exists (
      select 1 from public.bookings b
      where b.room_id=v_room_id and b.status='checked_in'
    ) then
      update public.rooms set status='available' where id=v_room_id;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists maintenance_room_lifecycle_trigger on public.maintenance_tickets;
create trigger maintenance_room_lifecycle_trigger
after insert or update of status, room on public.maintenance_tickets
for each row execute function public.sync_maintenance_room_lifecycle();
