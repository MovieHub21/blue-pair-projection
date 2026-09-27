create or replace function private.is_site_maintainer()
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
      and role in ('super_admin'::public.app_role, 'developer'::public.app_role)
  );
$$;

revoke execute on function private.is_site_maintainer() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_site_maintainer() to authenticated;

drop policy if exists "super admins can update site settings" on public.site_settings;

create policy "developers and super admins can update site settings"
on public.site_settings
for update
to authenticated
using ((select private.is_site_maintainer()))
with check ((select private.is_site_maintainer()));

insert into public.role_permissions (role, section, label, allowed, sort_order)
select
  'developer'::public.app_role,
  v.section,
  v.label,
  false,
  v.sort_order
from (
  select distinct on (section)
    section,
    label,
    sort_order
  from public.role_permissions
  order by section, sort_order
) v
where v.section <> 'developer'
on conflict (role, section) do update
set label = excluded.label,
    sort_order = excluded.sort_order;

insert into public.role_permissions (role, section, label, allowed, sort_order)
values ('developer'::public.app_role, 'developer', 'Developer', true, 999)
on conflict (role, section) do update
set label = excluded.label,
    sort_order = excluded.sort_order,
    allowed = true;
