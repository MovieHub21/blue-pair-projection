create or replace function public.link_walk_in_customer_to_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null or btrim(new.email) = '' then
    return new;
  end if;

  update public.customers
  set user_id = new.id,
      name = coalesce(nullif(btrim(new.name), ''), name),
      phone = coalesce(nullif(btrim(new.phone), ''), phone)
  where user_id is null
    and lower(btrim(email)) = lower(btrim(new.email));

  return new;
end;
$$;

drop trigger if exists link_walk_in_customer_on_profile on public.profiles;
create trigger link_walk_in_customer_on_profile
after insert or update of email, name, phone on public.profiles
for each row execute function public.link_walk_in_customer_to_profile();
