-- Annex short-let reservations use the same bookings/payment ledger as hotel rooms.
alter table public.bookings
  add column if not exists short_let_id text references public.short_lets(id) on delete set null;

alter table public.bookings
  alter column room_type_id drop not null;

create index if not exists bookings_short_let_id_idx
  on public.bookings(short_let_id, check_in, check_out);

create or replace function public.claim_short_let_reservation(
  p_customer_id text,
  p_short_let_id text,
  p_check_in date,
  p_check_out date,
  p_adults integer,
  p_children integer,
  p_amount numeric,
  p_special_requests text default null,
  p_source text default 'online',
  p_created_by uuid default null
)
returns table(id text, reference text, short_let_id text, reservation_expires_at timestamptz, status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.short_lets%rowtype;
  b public.bookings%rowtype;
  v_id text;
  v_reference text;
  v_expires timestamptz := now() + interval '10 minutes';
begin
  if p_check_in >= p_check_out then raise exception 'CHECKOUT_MUST_BE_AFTER_CHECKIN'; end if;
  if p_source not in ('online','walk_in') then raise exception 'INVALID_BOOKING_SOURCE'; end if;

  select * into s from public.short_lets where id = p_short_let_id for update;
  if not found then raise exception 'SHORTLET_NOT_FOUND'; end if;
  if not s.available then raise exception 'SHORTLET_NOT_AVAILABLE'; end if;

  if exists (
    select 1 from public.bookings bx
    where bx.short_let_id = s.id
      and (
        (bx.status in ('confirmed','checked_in') and bx.payment_status = 'paid')
        or (bx.status = 'pending' and bx.payment_status <> 'paid'
            and bx.reservation_expires_at is not null and bx.reservation_expires_at > now())
      )
      and p_check_in < bx.check_out and p_check_out > bx.check_in
  ) then
    raise exception 'SHORTLET_SOLD';
  end if;

  v_id := 'b_' || floor(extract(epoch from clock_timestamp()) * 1000)::bigint::text || '_' || substr(md5(random()::text),1,8);
  v_reference := 'BPH-' || upper(substr(md5(v_id || random()::text),1,7));

  insert into public.bookings(
    id, reference, customer_id, room_type_id, room_id, short_let_id,
    check_in, check_out, adults, children, amount, payment_status, status,
    reservation_expires_at, special_requests, extra_services, source, created_by
  )
  values(
    v_id, v_reference, p_customer_id, null, null, s.id,
    p_check_in, p_check_out, greatest(1,coalesce(p_adults,2)), greatest(0,coalesce(p_children,0)),
    p_amount, 'pending', 'pending', v_expires, nullif(p_special_requests,''), '[]'::jsonb,
    p_source, p_created_by
  )
  returning * into b;

  return query select b.id, b.reference, b.short_let_id, b.reservation_expires_at, b.status;
exception
  when exclusion_violation then raise exception 'SHORTLET_SOLD';
end;
$$;

revoke all on function public.claim_short_let_reservation(text,text,date,date,integer,integer,numeric,text,text,uuid) from public;
grant execute on function public.claim_short_let_reservation(text,text,date,date,integer,integer,numeric,text,text,uuid) to authenticated, service_role;
