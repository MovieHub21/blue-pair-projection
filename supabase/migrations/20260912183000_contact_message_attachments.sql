-- Chat attachments for Guest <-> Blue Pair staff conversations.
-- Files are kept in a private bucket and are served through short-lived signed URLs.

insert into storage.buckets (id, name, public)
values ('contact-attachments', 'contact-attachments', false)
on conflict (id) do update set public = false;

alter table public.contact_messages
  add column if not exists attachment_path text,
  add column if not exists attachment_name text,
  add column if not exists attachment_mime_type text,
  add column if not exists attachment_size bigint;

create index if not exists contact_messages_attachment_idx
  on public.contact_messages(attachment_path)
  where attachment_path is not null;

-- The application uploads/reads through the Supabase service role after checking
-- the authenticated guest or staff member. No public storage policies are granted.
