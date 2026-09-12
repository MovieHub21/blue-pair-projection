-- Production finance ledger + room lifecycle automation.
-- Keeps existing booking/payment tables intact while adding an auditable ledger
-- and deterministic room -> housekeeping -> availability transitions.

create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_type text not null check (transaction_type in ('sale','refund','expense','adjustment')),
  direction text not null check (direction in ('credit','debit')),
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'NGN' check (currency = 'NGN'),
  status text not null default 'posted' check (status in ('posted','voided')),
  source_type text not null,
  source_id text not null,
  booking_id text references public.bookings(id) on delete set null,
  customer_id text references public.customers(id) on delete set null,
  outlet text,
  method text,
  reference text,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists financial_transactions_source_idx
  on public.financial_transactions(source_type, source_id, transaction_type, direction);
create index if not exists financial_transactions_occurred_at_idx
  on public.financial_transactions(occurred_at desc);
create index if not exists financial_transactions_outlet_idx
  on public.financial_transactions(outlet);
create index if not exists financial_transactions_booking_idx
  on public.financial_transactions(booking_id);

create table if not exists public.financial_expenses (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  category text not null,
  vendor text,
  description text not null,
  amount numeric(14,2) not null check (amount > 0),
  method text not null check (method in ('Cash','POS','Bank Transfer','Card')),
  status text not null default 'posted' check (status in ('posted','voided')),
  incurred_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists financial_expenses_incurred_at_idx
  on public.financial_expenses(incurred_at desc);

alter table public.financial_transactions enable row level security;
alter table public.financial_expenses enable row level security;

drop policy if exists financial_transactions_staff_read on public.financial_transactions;
create policy financial_transactions_staff_read
  on public.financial_transactions for select
  using (public.is_staff(auth.uid()));

drop policy if exists financial_expenses_staff_read on public.financial_expenses;
create policy financial_expenses_staff_read
  on public.financial_expenses for select
  using (public.is_staff(auth.uid()));

drop policy if exists financial_expenses_staff_insert on public.financial_expenses;
create policy financial_expenses_staff_insert
  on public.financial_expenses for insert
  with check (public.is_staff(auth.uid()));

drop policy if exists financial_expenses_staff_update on public.financial_expenses;
create policy financial_expenses_staff_update
  on public.financial_expenses for update
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

-- Ledger helper: inserts are idempotent through the unique source index.
create or replace function public.record_financial_transaction(
  p_transaction_type text,
  p_direction text,
  p_amount numeric,
  p_source_type text,
  p_source_id text,
  p_description text,
  p_booking_id text default null,
  p_customer_id text default null,
  p_outlet text default null,
  p_method text default null,
  p_reference text default null,
  p_occurred_at timestamptz default now(),
  p_created_by uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.financial_transactions (
    transaction_type, direction, amount, source_type, source_id,
    booking_id, customer_id, outlet, method, reference, description,
    metadata, occurred_at, created_by
  ) values (
    p_transaction_type, p_direction, p_amount, p_source_type, p_source_id,
    p_booking_id, p_customer_id, p_outlet, p_method, p_reference, p_description,
    coalesce(p_metadata, '{}'::jsonb), coalesce(p_occurred_at, now()), p_created_by
  )
  on conflict (source_type, source_id, transaction_type, direction) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id
    from public.financial_transactions
    where source_type = p_source_type
      and source_id = p_source_id
      and transaction_type = p_transaction_type
      and direction = p_direction
    limit 1;
  end if;
  return v_id;
end;
$$;

create or replace function public.sync_payment_to_financial_ledger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking_id text;
  v_customer_id text;
  v_occurred_at timestamptz;
begin
  if new.status not in ('success','refunded') then
    return new;
  end if;

  select b.id, b.customer_id into v_booking_id, v_customer_id
  from public.bookings b
  where b.reference = new.booking_ref
  limit 1;

  v_customer_id := coalesce(new.customer_id, v_customer_id);
  v_occurred_at := coalesce(new.date::timestamptz, now());

  -- A refunded payment represents the original sale plus a matching debit.
  if new.status = 'refunded' then
    perform public.record_financial_transaction(
      'sale','credit',new.amount,'payment',new.id,
      'Payment received for booking ' || new.booking_ref,
      v_booking_id,v_customer_id,'rooms',new.method,new.reference,v_occurred_at,null,
      jsonb_build_object('payment_id',new.id,'booking_ref',new.booking_ref)
    );
    perform public.record_financial_transaction(
      'refund','debit',new.amount,'payment_refund',new.id,
      'Refund issued for payment ' || new.reference,
      v_booking_id,v_customer_id,'rooms',new.method,new.reference,now(),null,
      jsonb_build_object('payment_id',new.id,'booking_ref',new.booking_ref)
    );
  else
    perform public.record_financial_transaction(
      'sale','credit',new.amount,'payment',new.id,
      'Payment received for booking ' || new.booking_ref,
      v_booking_id,v_customer_id,'rooms',new.method,new.reference,v_occurred_at,null,
      jsonb_build_object('payment_id',new.id,'booking_ref',new.booking_ref)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists payments_financial_ledger_trigger on public.payments;
create trigger payments_financial_ledger_trigger
after insert or update of status, amount, method, booking_ref, customer_id, date on public.payments
for each row execute function public.sync_payment_to_financial_ledger();

create or replace function public.sync_expense_to_financial_ledger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'posted' then
    perform public.record_financial_transaction(
      'expense','debit',new.amount,'expense',new.id,new.description,
      null,null,'general',new.method,new.reference,new.incurred_at,new.created_by,
      jsonb_build_object('category',new.category,'vendor',new.vendor)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists expenses_financial_ledger_trigger on public.financial_expenses;
create trigger expenses_financial_ledger_trigger
after insert or update of status, amount, method, reference, description, incurred_at on public.financial_expenses
for each row execute function public.sync_expense_to_financial_ledger();

-- Backfill the existing payment history exactly once through the same ledger function.
do $$
declare r record;
begin
  for r in select * from public.payments where status in ('success','refunded') loop
    perform public.sync_payment_to_financial_ledger(r);
  end loop;
end $$;

-- Room lifecycle.
alter table public.housekeeping_tasks
  add column if not exists room_id text references public.rooms(id) on delete set null,
  add column if not exists booking_id text references public.bookings(id) on delete set null;

create index if not exists housekeeping_tasks_room_id_idx on public.housekeeping_tasks(room_id);
create index if not exists housekeeping_tasks_booking_id_idx on public.housekeeping_tasks(booking_id);
create unique index if not exists housekeeping_tasks_one_active_room_idx
  on public.housekeeping_tasks(room_id)
  where room_id is not null and status <> 'completed';

create or replace function public.sync_booking_room_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_number text;
  v_room_type text;
  v_task_id text;
begin
  if new.room_id is null then
    return new;
  end if;

  if new.status = 'checked_in' and (old.status is distinct from new.status or old.room_id is distinct from new.room_id) then
    update public.rooms set status = 'occupied' where id = new.room_id;
  elsif new.status = 'checked_out' and old.status is distinct from new.status then
    update public.rooms set status = 'cleaning_required' where id = new.room_id;

    select r.room_number, rt.name into v_room_number, v_room_type
    from public.rooms r
    left join public.room_types rt on rt.id = r.room_type_id
    where r.id = new.room_id;

    if v_room_number is not null then
      insert into public.housekeeping_tasks (
        id, room, room_type, checkout_time, priority, assigned_to, status, notes, room_id, booking_id
      ) values (
        'hk_' || floor(extract(epoch from clock_timestamp()) * 1000)::bigint,
        v_room_number, coalesce(v_room_type,''), to_char(now() at time zone 'Africa/Lagos','HH12:MI AM'),
        'High','Unassigned','pending','Auto-created after guest checkout.',new.room_id,new.id
      ) on conflict (room_id) where room_id is not null and status <> 'completed' do nothing;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists booking_room_lifecycle_trigger on public.bookings;
create trigger booking_room_lifecycle_trigger
after update of status, room_id on public.bookings
for each row execute function public.sync_booking_room_lifecycle();

create or replace function public.sync_housekeeping_room_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.room_id is null then return new; end if;

  if new.status = 'in_progress' then
    update public.rooms set status = 'cleaning' where id = new.room_id and status <> 'occupied';
  elsif new.status = 'completed' then
    if exists (
      select 1 from public.maintenance_tickets mt
      where mt.room = new.room and mt.status <> 'resolved'
    ) then
      update public.rooms set status = 'maintenance' where id = new.room_id and status <> 'occupied';
    elsif not exists (
      select 1 from public.bookings b
      where b.room_id = new.room_id and b.status = 'checked_in'
    ) then
      update public.rooms set status = 'available' where id = new.room_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists housekeeping_room_lifecycle_trigger on public.housekeeping_tasks;
create trigger housekeeping_room_lifecycle_trigger
after insert or update of status, room_id on public.housekeeping_tasks
for each row execute function public.sync_housekeeping_room_lifecycle();

create or replace function public.sync_maintenance_room_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_id text;
begin
  select id into v_room_id from public.rooms where room_number = new.room limit 1;
  if v_room_id is null then return new; end if;

  if new.status <> 'resolved' then
    update public.rooms set status = 'maintenance' where id = v_room_id and status <> 'occupied';
  elsif not exists (
    select 1 from public.maintenance_tickets mt
    where mt.room = new.room and mt.status <> 'resolved'
  ) then
    if exists (select 1 from public.housekeeping_tasks hk where hk.room_id = v_room_id and hk.status <> 'completed') then
      update public.rooms set status = 'cleaning_required' where id = v_room_id and status <> 'occupied';
    elsif not exists (select 1 from public.bookings b where b.room_id = v_room_id and b.status = 'checked_in') then
      update public.rooms set status = 'available' where id = v_room_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists maintenance_room_lifecycle_trigger on public.maintenance_tickets;
create trigger maintenance_room_lifecycle_trigger
after insert or update of status, room on public.maintenance_tickets
for each row execute function public.sync_maintenance_room_lifecycle();

-- Finance is visible to super admins/managers/accountants; other roles stay unchanged.
insert into public.role_permissions (role, section, label, allowed, sort_order)
values
  ('manager','finance','Finance',true,240),
  ('accountant','finance','Finance',true,240),
  ('reception','finance','Finance',false,240),
  ('housekeeping','finance','Finance',false,240),
  ('maintenance','finance','Finance',false,240),
  ('restaurant','finance','Finance',false,240),
  ('bar','finance','Finance',false,240)
on conflict (role, section) do update set label=excluded.label, allowed=excluded.allowed, sort_order=excluded.sort_order, updated_at=now();
