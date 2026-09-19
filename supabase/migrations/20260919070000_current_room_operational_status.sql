-- Make room operational status current-state based instead of date-specific.
delete from public.room_daily_statuses a
using public.room_daily_statuses b
where a.room_id = b.room_id
  and (a.updated_at < b.updated_at or (a.updated_at = b.updated_at and a.id < b.id));

alter table public.room_daily_statuses drop constraint if exists room_daily_statuses_room_id_status_date_key;
alter table public.room_daily_statuses alter column status_date drop not null;
create unique index if not exists room_daily_statuses_room_id_key on public.room_daily_statuses(room_id);
drop index if exists public.room_daily_statuses_date_idx;

create or replace function public.sync_booking_room_lifecycle()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status='checked_out' and new.room_id is not null then
    if exists (select 1 from public.rooms where id=new.room_id and status in ('maintenance','available_soon')) then return new; end if;
    insert into public.room_daily_statuses(room_id,status,status_date,notes,updated_at)
    values(new.room_id,'cleaning_required',coalesce(new.checked_out_at::date,current_date),'Guest checked out; cleaning required.',now())
    on conflict(room_id) do update set status=excluded.status,status_date=excluded.status_date,notes=excluded.notes,updated_at=now();
  end if;
  return new;
end;
$$;
drop trigger if exists booking_room_lifecycle_trigger on public.bookings;
create trigger booking_room_lifecycle_trigger after update of status,checked_out_at on public.bookings for each row execute function public.sync_booking_room_lifecycle();

create or replace function public.sync_housekeeping_room_lifecycle()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.room_id is null then return new; end if;
  if exists (select 1 from public.rooms where id=new.room_id and status in ('maintenance','available_soon')) then return new; end if;
  if new.status='in_progress' then
    insert into public.room_daily_statuses(room_id,status,status_date,notes,updated_at)
    values(new.room_id,'cleaning',current_date,'Housekeeping in progress.',now())
    on conflict(room_id) do update set status=excluded.status,status_date=excluded.status_date,notes=excluded.notes,updated_at=now();
  elsif new.status='completed' then
    insert into public.room_daily_statuses(room_id,status,status_date,notes,updated_at)
    values(new.room_id,'available',current_date,'Housekeeping completed.',now())
    on conflict(room_id) do update set status=excluded.status,status_date=excluded.status_date,notes=excluded.notes,updated_at=now();
  end if;
  return new;
end;
$$;
drop trigger if exists housekeeping_room_lifecycle_trigger on public.housekeeping_tasks;
create trigger housekeeping_room_lifecycle_trigger after update of status on public.housekeeping_tasks for each row execute function public.sync_housekeeping_room_lifecycle();

create or replace function public.normalize_legacy_room_status()
returns trigger language plpgsql as $$
begin
  if new.status in ('cleaning_required','cleaning','occupied') then new.status:='available'; end if;
  return new;
end;
$$;
drop trigger if exists normalize_legacy_room_status_trigger on public.rooms;
create trigger normalize_legacy_room_status_trigger before insert or update of status on public.rooms for each row execute function public.normalize_legacy_room_status();

comment on table public.room_daily_statuses is 'Current operational room state. Maintenance and Available Soon are indefinite on rooms.status; this table stores the current cleaning/available workflow state.';
