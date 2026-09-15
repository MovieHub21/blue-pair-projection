alter table public.rooms
  add column if not exists payment_lock_booking_id text references public.bookings(id),
  add column if not exists payment_lock_expires_at timestamptz;

create index if not exists rooms_payment_lock_idx
  on public.rooms(payment_lock_booking_id, payment_lock_expires_at);

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
  lock_until timestamptz := now() + interval '10 minutes';
begin
  select * into b from public.bookings where id = p_booking_id for update;
  if not found then return query select false, 'booking_not_found', null::timestamptz; return; end if;
  if b.payment_status = 'paid' or b.status in ('confirmed','checked_in') then return query select false, 'already_paid', null::timestamptz; return; end if;
  if b.status = 'cancelled' then return query select false, 'cancelled', null::timestamptz; return; end if;

  select c.user_id into existing_customer_user from public.customers c where c.id = b.customer_id;
  if existing_customer_user is distinct from p_user_id then return query select false, 'not_owner', null::timestamptz; return; end if;
  if b.room_id is null then return query select false, 'room_not_assigned', null::timestamptz; return; end if;

  select * into r from public.rooms where id = b.room_id for update;
  if not found then return query select false, 'room_not_found', null::timestamptz; return; end if;
  if r.status <> 'available' then return query select false, 'room_not_available', null::timestamptz; return; end if;

  if r.payment_lock_booking_id is not null and r.payment_lock_booking_id <> b.id and coalesce(r.payment_lock_expires_at, now()) > now() then
    return query select false, 'payment_in_progress', r.payment_lock_expires_at; return;
  end if;

  if r.payment_lock_booking_id = b.id and coalesce(r.payment_lock_expires_at, now()) > now() then
    return query select true, 'already_locked', r.payment_lock_expires_at; return;
  end if;

  if exists (
    select 1 from public.bookings x
    where x.room_id = b.room_id and x.id <> b.id
      and x.payment_status = 'paid'
      and x.status in ('confirmed','checked_in')
      and x.check_in < b.check_out and x.check_out > b.check_in
  ) then
    return query select false, 'room_already_sold', null::timestamptz; return;
  end if;

  update public.rooms set payment_lock_booking_id = b.id, payment_lock_expires_at = lock_until where id = r.id;
  update public.bookings set reservation_expires_at = lock_until where id = b.id and payment_status <> 'paid' and status = 'pending';
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
  update public.rooms
  set payment_lock_booking_id = null, payment_lock_expires_at = null
  where payment_lock_booking_id = p_booking_id;
  get diagnostics affected = row_count;
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
    update public.rooms
    set payment_lock_booking_id = null, payment_lock_expires_at = null
    where payment_lock_booking_id is not null and payment_lock_expires_at <= now()
    returning id
  ) select count(*) into released from cleared;

  update public.bookings b
  set reservation_expires_at = null
  where b.status = 'pending' and b.payment_status <> 'paid' and b.reservation_expires_at <= now()
    and not exists (
      select 1 from public.rooms r
      where r.payment_lock_booking_id = b.id and r.payment_lock_expires_at > now()
    );
  return released;
end;
$$;

create extension if not exists pg_cron with schema extensions;
select cron.schedule('release-blue-pair-payment-locks', '* * * * *', $$select public.release_expired_payment_locks();$$)
where not exists (select 1 from cron.job where jobname = 'release-blue-pair-payment-locks');
