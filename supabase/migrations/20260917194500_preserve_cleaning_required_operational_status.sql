-- Preserve Cleaning Required as a real admin operational state.
-- The previous normalizer converted it to Cleaning immediately, which hid the
-- checkout queue from staff. Only the legacy occupied value is normalized.

create or replace function public.normalize_room_operational_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'occupied' then
    new.status := 'available';
  end if;
  return new;
end;
$$;
