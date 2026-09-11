-- Staff accounts use their existing guest credentials. Only a Super Admin
-- may attach staff access or alter portal roles.
drop policy if exists "admins manage staff" on public.staff;
create policy "super admins manage staff" on public.staff
  for all to authenticated
  using (public.has_role(auth.uid(), 'super_admin'))
  with check (public.has_role(auth.uid(), 'super_admin'));

drop policy if exists "admins manage roles" on public.user_roles;
create policy "super admins manage roles" on public.user_roles
  for all to authenticated
  using (public.has_role(auth.uid(), 'super_admin'))
  with check (public.has_role(auth.uid(), 'super_admin'));
