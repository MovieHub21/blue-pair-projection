-- Notifications for staff portals (admin, reception, housekeeping, maintenance, restaurant, bar).
--
-- Guests keep their own notifications in guest_notifications. Staff get a separate list here, so
-- someone who is both a guest and a staff member sees guest updates in the guest portal and work
-- updates in the staff portal. Rows are created by server code only, one row per recipient, using the
-- same department routing the department emails use (see lib/staffRecipients.ts).
create table if not exists public.staff_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  department text not null,
  type text not null,
  title text not null,
  body text not null default '',
  href text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists staff_notifications_user_created_idx on public.staff_notifications (user_id, created_at desc);
create index if not exists staff_notifications_user_unread_idx on public.staff_notifications (user_id) where read_at is null;
create index if not exists staff_notifications_dedupe_idx on public.staff_notifications ((metadata ->> 'dedupe_key'));

alter table public.staff_notifications enable row level security;

drop policy if exists "Staff can read their own notifications" on public.staff_notifications;
create policy "Staff can read their own notifications" on public.staff_notifications
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "Staff can mark their own notifications read" on public.staff_notifications;
create policy "Staff can mark their own notifications read" on public.staff_notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- No insert or delete policy on purpose: only server code using the service role creates notifications.

alter table public.staff_notifications replica identity full;

-- Live updates, the same way as every other table (see 20260918100000 and 20260918102000).
drop trigger if exists bluepair_realtime_change on public.staff_notifications;
create trigger bluepair_realtime_change
  after insert or update or delete on public.staff_notifications
  for each row execute function public.broadcast_bluepair_database_change();

do $$
begin
  alter publication supabase_realtime add table public.staff_notifications;
exception
  when duplicate_object then null;
  when undefined_object then null;
end
$$;
