create table if not exists public.payment_holds (
  id text primary key,
  booking_id text not null unique references public.bookings(id) on delete cascade,
  room_id text not null references public.rooms(id) on delete cascade,
  check_in date not null,
  check_out date not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint payment_holds_valid_dates check (check_in < check_out)
);

create index if not exists payment_holds_room_dates_idx
  on public.payment_holds(room_id, check_in, check_out, expires_at);

create or replace function public.acquire_payment_lock(p_booking_id text, p_user_id uuid)
returns table(acquired boolean, reason text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.bookings%rowtype;
  r public.rooms%rowtype;
  existing_customer_user uuid;
  existing_hold public.payment_holds%rowtype;
  lock_until timestamptz := now() + interval '10 minutes';
begin
  select * into b from public.bookings where id = p_booking_id for update;
  if not found then return query select false, 'booking_not_found', null::timestamptz; return; end if;
  if b.payment_status = 'paid' or b.status in ('confirmed','checked_in') then return query select false, 'already_paid', null::timestamptz; return; end if;
  if b.status = 'cancelled' then return query select false, 'cancelled', null::timestamptz; return; end if;
  select c.user_id into existing_customer_user from public.customers c where c.id = b.customer_id;
  if existing_customer_user is distinct from p_user_id then return query select false, 'not_owner', null::timestamptz; return; end if;
  if b.room_id is null then return query select false, 'room_not_assigned', null::timestamptz; return; end if;

  -- Serialize payment attempts for this physical room only while checking the
  -- date-aware holds. Non-overlapping stays are allowed to proceed together.
  select * into r from public.rooms where id = b.room_id for update;
  if not found then return query select false, 'room_not_found', null::timestamptz; return; end if;
  if r.status <> 'available' then return query select false, 'room_not_available', null::timestamptz; return; end if;

  delete from public.payment_holds where room_id = b.room_id and expires_at <= now();

  select * into existing_hold
  from public.payment_holds h
  where h.room_id = b.room_id
    and h.booking_id <> b.id
    and h.expires_at > now()
    and b.check_in < h.check_out
    and b.check_out > h.check_in
  order by h.expires_at desc
  limit 1;
  if found then
    return query select false, 'payment_in_progress', existing_hold.expires_at;
    return;
  end if;

  if exists (
    select 1 from public.bookings x
    where x.room_id = b.room_id and x.id <> b.id
      and x.payment_status = 'paid'
      and x.status in ('confirmed','checked_in')
      and x.check_in < b.check_out and x.check_out > b.check_in
  ) then
    return query select false, 'room_already_sold', null::timestamptz;
    return;
  end if;

  select * into existing_hold
  from public.payment_holds
  where booking_id = b.id and expires_at > now();
  if found then
    return query select true, 'already_locked', existing_hold.expires_at;
    return;
  end if;

  insert into public.payment_holds(id, booking_id, room_id, check_in, check_out, expires_at)
  values ('ph_' || floor(extract(epoch from clock_timestamp()) * 1000)::bigint::text || '_' || substr(md5(random()::text),1,8), b.id, b.room_id, b.check_in, b.check_out, lock_until);

  update public.bookings
  set reservation_expires_at = lock_until
  where id = b.id and payment_status <> 'paid' and status = 'pending';

  return query select true, 'acquired', lock_until;
end;
$$;

create or replace function public.release_payment_lock(p_booking_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare affected integer;
begin
  delete from public.payment_holds where booking_id = p_booking_id;
  get diagnostics affected = row_count;
  update public.rooms set payment_lock_booking_id = null, payment_lock_expires_at = null where payment_lock_booking_id = p_booking_id;
  return affected > 0;
end;
$$;

create or replace function public.release_expired_payment_locks()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare released integer;
begin
  with cleared as (
    delete from public.payment_holds
    where expires_at <= now()
    returning id
  ) select count(*) into released from cleared;

  update public.rooms set payment_lock_booking_id = null, payment_lock_expires_at = null
  where payment_lock_booking_id is not null and payment_lock_expires_at <= now();

  update public.bookings b set reservation_expires_at = null
  where b.status = 'pending' and b.payment_status <> 'paid' and b.reservation_expires_at <= now()
    and not exists (select 1 from public.payment_holds h where h.booking_id = b.id and h.expires_at > now());

  return released;
end;
$$;

revoke execute on function public.acquire_payment_lock(text, uuid) from public, anon, authenticated;
grant execute on function public.acquire_payment_lock(text, uuid) to service_role;
revoke execute on function public.release_payment_lock(text) from public, anon, authenticated;
grant execute on function public.release_payment_lock(text) to service_role;
revoke execute on function public.release_expired_payment_locks() from public, anon, authenticated;
grant execute on function public.release_expired_payment_locks() to service_role;
