create schema if not exists private;

create or replace function private.is_super_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role = 'super_admin'
  );
$$;

revoke execute on function private.is_super_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_super_admin() to authenticated;

create table public.site_settings (
  environment text primary key check (environment in ('development', 'preview', 'production')),
  maintenance_mode boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (environment)
values ('development'), ('preview'), ('production')
on conflict (environment) do nothing;

grant select on public.site_settings to anon, authenticated;
grant update on public.site_settings to authenticated;
grant all on public.site_settings to service_role;

alter table public.site_settings enable row level security;

create policy "public can read site settings"
on public.site_settings
for select
to anon, authenticated
using (true);

create policy "super admins can update site settings"
on public.site_settings
for update
to authenticated
using ((select private.is_super_admin()))
with check ((select private.is_super_admin()));

create trigger site_settings_touch_updated_at
before update on public.site_settings
for each row execute function public.touch_updated_at();
