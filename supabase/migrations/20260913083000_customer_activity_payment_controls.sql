-- Customer activity visibility and payment integrity safeguards.
-- Payments are financial records: they may be updated by authorized server workflows,
-- but they can never be deleted. Refund status changes are limited to payment owners.

create or replace function public.prevent_payment_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Payment records cannot be deleted. Use a refund or correction workflow instead.';
end;
$$;

drop trigger if exists prevent_payment_delete on public.payments;
create trigger prevent_payment_delete
before delete on public.payments
for each row execute function public.prevent_payment_delete();

create or replace function public.protect_payment_refund_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'refunded' and new.status <> 'refunded' then
    raise exception 'Refunded payments cannot be reopened or rewritten.';
  end if;

  if new.status = 'refunded' and old.status <> 'refunded' then
    if not exists (
      select 1
      from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role in ('super_admin', 'manager', 'accountant')
    ) then
      raise exception 'Only authorized payment staff can mark a payment as refunded.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_payment_refund_status on public.payments;
create trigger protect_payment_refund_status
before update of status on public.payments
for each row execute function public.protect_payment_refund_status();

drop trigger if exists activity_room_service_orders on public.room_service_orders;
create trigger activity_room_service_orders
after insert or update or delete on public.room_service_orders
for each row execute function public.record_activity_change();

drop trigger if exists activity_financial_transactions on public.financial_transactions;
create trigger activity_financial_transactions
after insert or update or delete on public.financial_transactions
for each row execute function public.record_activity_change();

drop trigger if exists activity_financial_expenses on public.financial_expenses;
create trigger activity_financial_expenses
after insert or update or delete on public.financial_expenses
for each row execute function public.record_activity_change();

create index if not exists activity_logs_metadata_gin_idx
  on public.activity_logs using gin (metadata);
