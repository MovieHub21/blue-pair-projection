-- Include complete old booking rows in realtime UPDATE payloads.
-- GuestEmailWatcher compares old and new status values to decide which
-- lifecycle notification, if any, should be sent.
alter table public.bookings replica identity full;
