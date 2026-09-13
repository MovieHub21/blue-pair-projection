-- Keep expense ledger entries synchronized when expenses are edited, voided, or deleted.
create or replace function public.sync_expense_to_financial_ledger()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    update public.financial_transactions
      set status = 'voided'
    where source_type = 'expense'
      and source_id = old.id::text
      and transaction_type = 'expense'
      and direction = 'debit';
    return old;
  end if;

  if new.status = 'posted' then
    insert into public.financial_transactions (
      transaction_type, direction, amount, source_type, source_id,
      booking_id, customer_id, outlet, method, reference, description,
      metadata, occurred_at, created_by, status
    ) values (
      'expense', 'debit', new.amount, 'expense', new.id::text,
      null, null, 'general', new.method, new.reference, new.description,
      jsonb_build_object('category', new.category, 'vendor', new.vendor),
      new.incurred_at, new.created_by, 'posted'
    )
    on conflict (source_type, source_id, transaction_type, direction)
    do update set
      amount = excluded.amount,
      method = excluded.method,
      reference = excluded.reference,
      description = excluded.description,
      metadata = excluded.metadata,
      occurred_at = excluded.occurred_at,
      created_by = excluded.created_by,
      status = 'posted';
  else
    update public.financial_transactions
      set status = 'voided'
    where source_type = 'expense'
      and source_id = new.id::text
      and transaction_type = 'expense'
      and direction = 'debit';
  end if;

  return new;
end;
$$;

drop trigger if exists expenses_financial_ledger_trigger on public.financial_expenses;
create trigger expenses_financial_ledger_trigger
after insert or update of status, amount, method, reference, description, incurred_at, category, vendor or delete on public.financial_expenses
for each row execute function public.sync_expense_to_financial_ledger();
