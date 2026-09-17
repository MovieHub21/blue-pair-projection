-- Guest inventory model:
-- Cleaning/cleaning_required/maintenance remain operational states only.
-- Customers are blocked only when a room is explicitly marked available_soon,
-- or when a paid/active payment-hold booking overlaps their dates.
-- Early checkout releases the unused reservation dates.

create or replace function public.claim_room_reservation(
  p_customer_id text, p_room_type_id text, p_room_id text, p_check_in date, p_check_out date,
  p_adults integer, p_children integer, p_amount numeric, p_special_requests text default null,
  p_extra_services jsonb default '[]'::jsonb, p_source text default 'online', p_created_by uuid default null
)
returns table(id text, reference text, room_id text, reservation_expires_at timestamptz, status text)
language plpgsql security definer set search_path = public as $$
declare r public.rooms%rowtype; b public.bookings%rowtype; v_id text; v_reference text; v_expires timestamptz := now() + interval '10 minutes';
begin
  if p_check_in >= p_check_out then raise exception 'CHECKOUT_MUST_BE_AFTER_CHECKIN'; end if;
  if p_source not in ('online','walk_in') then raise exception 'INVALID_BOOKING_SOURCE'; end if;
  if p_room_id is not null then
    select * into r from public.rooms where public.rooms.id=p_room_id and public.rooms.room_type_id=p_room_type_id for update;
    if not found then raise exception 'ROOM_NOT_FOUND'; end if;
    if r.status='available_soon' then raise exception 'ROOM_NOT_AVAILABLE'; end if;
  else
    select * into r from public.rooms x where x.room_type_id=p_room_type_id and x.status<>'available_soon'
      and not exists(select 1 from public.bookings bx where bx.room_id=x.id and bx.payment_status='paid' and bx.status not in ('cancelled','refunded')
        and p_check_in < coalesce(least(bx.checked_out_at::date,bx.check_out),bx.check_out) and p_check_out > bx.check_in)
      order by x.room_number for update skip locked limit 1;
    if not found then raise exception 'ROOM_NOT_AVAILABLE'; end if;
  end if;
  if exists(select 1 from public.bookings bx where bx.room_id=r.id and bx.payment_status='paid' and bx.status not in ('cancelled','refunded')
    and p_check_in < coalesce(least(bx.checked_out_at::date,bx.check_out),bx.check_out) and p_check_out > bx.check_in) then raise exception 'ROOM_SOLD'; end if;
  v_id := 'b_'||floor(extract(epoch from clock_timestamp())*1000)::bigint::text||'_'||substr(md5(random()::text),1,8);
  v_reference := 'BPH-'||upper(substr(md5(v_id||random()::text),1,7));
  insert into public.bookings(id,reference,customer_id,room_type_id,room_id,check_in,check_out,adults,children,amount,payment_status,status,reservation_expires_at,special_requests,extra_services,source,created_by)
  values(v_id,v_reference,p_customer_id,p_room_type_id,r.id,p_check_in,p_check_out,greatest(1,coalesce(p_adults,2)),greatest(0,coalesce(p_children,0)),p_amount,'pending','pending',v_expires,nullif(p_special_requests,''),coalesce(p_extra_services,'[]'::jsonb),p_source,p_created_by)
  returning * into b;
  return query select b.id,b.reference,b.room_id,b.reservation_expires_at,b.status;
exception when exclusion_violation then raise exception 'ROOM_SOLD'; end; $$;

create or replace function public.acquire_payment_lock(p_booking_id text,p_user_id uuid)
returns table(acquired boolean,reason text,expires_at timestamptz)
language plpgsql security definer set search_path=public as $$
declare b public.bookings%rowtype; r public.rooms%rowtype; existing_customer_user uuid; existing_hold public.payment_holds%rowtype; lock_until timestamptz:=now()+interval '10 minutes';
begin
  select * into b from public.bookings where id=p_booking_id for update;
  if not found then return query select false,'booking_not_found',null::timestamptz; return; end if;
  if b.payment_status='paid' or b.status in ('confirmed','checked_in') then return query select false,'already_paid',null::timestamptz; return; end if;
  if b.status='cancelled' then return query select false,'cancelled',null::timestamptz; return; end if;
  select c.user_id into existing_customer_user from public.customers c where c.id=b.customer_id;
  if existing_customer_user is distinct from p_user_id then return query select false,'not_owner',null::timestamptz; return; end if;
  if b.room_id is null then return query select false,'room_not_assigned',null::timestamptz; return; end if;
  select * into r from public.rooms where id=b.room_id for update;
  if not found then return query select false,'room_not_found',null::timestamptz; return; end if;
  if r.status='available_soon' then return query select false,'room_not_available',null::timestamptz; return; end if;
  delete from public.payment_holds ph where ph.room_id=b.room_id and ph.expires_at<=now();
  select * into existing_hold from public.payment_holds h where h.room_id=b.room_id and h.booking_id<>b.id and h.expires_at>now() and b.check_in<h.check_out and b.check_out>h.check_in order by h.expires_at desc limit 1;
  if found then return query select false,'payment_in_progress',existing_hold.expires_at; return; end if;
  if exists(select 1 from public.bookings x where x.room_id=b.room_id and x.id<>b.id and x.payment_status='paid' and x.status not in ('cancelled','refunded')
    and b.check_in<coalesce(least(x.checked_out_at::date,x.check_out),x.check_out) and b.check_out>x.check_in) then return query select false,'room_already_sold',null::timestamptz; return; end if;
  select * into existing_hold from public.payment_holds ph where ph.booking_id=b.id and ph.expires_at>now();
  if found then return query select true,'already_locked',existing_hold.expires_at; return; end if;
  insert into public.payment_holds(id,booking_id,room_id,check_in,check_out,expires_at) values('ph_'||floor(extract(epoch from clock_timestamp())*1000)::bigint::text||'_'||substr(md5(random()::text),1,8),b.id,b.room_id,b.check_in,b.check_out,lock_until);
  update public.bookings set reservation_expires_at=lock_until where id=b.id and payment_status<>'paid' and status='pending';
  return query select true,'acquired',lock_until;
end; $$;
