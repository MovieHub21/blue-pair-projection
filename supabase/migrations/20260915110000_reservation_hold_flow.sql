alter table public.bookings add column if not exists reservation_expires_at timestamptz null;
alter table public.rooms add column if not exists pending_hold boolean not null default false;
create index if not exists bookings_reservation_expires_at_idx on public.bookings (reservation_expires_at) where status = 'pending' and payment_status <> 'paid';

create or replace function public.prepare_pending_room_hold()
returns trigger language plpgsql security definer set search_path = public as $$
declare existing_id text; room_state text; assigned_room text;
begin
  if new.status = 'pending' and new.payment_status <> 'paid' then
    select b.id into existing_id from public.bookings b where b.customer_id = new.customer_id and b.status = 'pending' and b.payment_status <> 'paid' and b.id is distinct from new.id and (b.reservation_expires_at is null or b.reservation_expires_at > now()) limit 1;
    if existing_id is not null then raise exception 'You already have a pending room reservation.' using errcode = '23505'; end if;
    if new.room_id is null then
      select r.id into assigned_room from public.rooms r where r.room_type_id = new.room_type_id and r.status = 'available' order by r.room_number limit 1;
      new.room_id := assigned_room;
    end if;
    if new.room_id is not null then
      select r.status into room_state from public.rooms r where r.id = new.room_id;
      if room_state = 'available' and new.reservation_expires_at is null then new.reservation_expires_at := now() + interval '10 minutes'; end if;
    end if;
  end if;
  if new.status = 'confirmed' and new.payment_status = 'paid' then new.reservation_expires_at := null; end if;
  return new;
end;
$$;
drop trigger if exists bookings_prepare_pending_room_hold on public.bookings;
create trigger bookings_prepare_pending_room_hold before insert or update of status, payment_status, room_id, customer_id, reservation_expires_at on public.bookings for each row execute function public.prepare_pending_room_hold();

create or replace function public.expire_pending_reservation_holds()
returns void language sql security definer set search_path = public as $$
  update public.bookings set status = 'cancelled' where status = 'pending' and payment_status <> 'paid' and reservation_expires_at is not null and reservation_expires_at <= now();
$$;

create or replace function public.refresh_room_pending_hold(target_room_id text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if target_room_id is null then return; end if;
  update public.rooms r set pending_hold = exists (select 1 from public.bookings b where b.room_id = r.id and b.status = 'pending' and b.payment_status <> 'paid' and (b.reservation_expires_at is null or b.reservation_expires_at > now())) where r.id = target_room_id;
end;
$$;
create or replace function public.refresh_booking_room_pending_hold()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.refresh_room_pending_hold(coalesce(new.room_id, old.room_id));
  if tg_op = 'UPDATE' and old.room_id is distinct from new.room_id then perform public.refresh_room_pending_hold(old.room_id); end if;
  return coalesce(new, old);
end;
$$;
drop trigger if exists bookings_refresh_room_pending_hold on public.bookings;
create trigger bookings_refresh_room_pending_hold after insert or update or delete on public.bookings for each row execute function public.refresh_booking_room_pending_hold();

update public.rooms r set pending_hold = exists (select 1 from public.bookings b where b.room_id = r.id and b.status = 'pending' and b.payment_status <> 'paid' and (b.reservation_expires_at is null or b.reservation_expires_at > now()));

create extension if not exists pg_cron with schema extensions;
select cron.schedule('expire-blue-pair-pending-reservations', '* * * * *', $$select public.expire_pending_reservation_holds();$$)
where not exists (select 1 from cron.job where jobname = 'expire-blue-pair-pending-reservations');
