create table if not exists public.contact_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  guest_name text not null,
  guest_email text not null,
  guest_phone text,
  subject text not null,
  category text not null default 'General enquiry',
  status text not null default 'open' check (status in ('open','waiting_for_guest','waiting_for_staff','resolved')),
  priority text not null default 'normal' check (priority in ('normal','urgent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.contact_conversations(id) on delete cascade,
  sender_type text not null check (sender_type in ('guest','staff')),
  sender_user_id uuid references auth.users(id) on delete set null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists contact_conversations_user_id_idx on public.contact_conversations(user_id);
create index if not exists contact_conversations_email_idx on public.contact_conversations(lower(guest_email));
create index if not exists contact_conversations_status_idx on public.contact_conversations(status, last_message_at desc);
create index if not exists contact_messages_conversation_idx on public.contact_messages(conversation_id, created_at);

create or replace function public.set_contact_conversation_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists contact_conversations_updated_at on public.contact_conversations;
create trigger contact_conversations_updated_at
before update on public.contact_conversations
for each row execute function public.set_contact_conversation_updated_at();

create or replace function public.sync_contact_conversation_after_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.contact_conversations
  set last_message_at = new.created_at,
      updated_at = now(),
      status = case when new.sender_type = 'guest' then 'waiting_for_staff' else 'waiting_for_guest' end
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists contact_messages_sync_conversation on public.contact_messages;
create trigger contact_messages_sync_conversation
after insert on public.contact_messages
for each row execute function public.sync_contact_conversation_after_message();

alter table public.contact_conversations enable row level security;
alter table public.contact_messages enable row level security;

drop policy if exists "Guests can read own contact conversations" on public.contact_conversations;
create policy "Guests can read own contact conversations"
on public.contact_conversations for select
using (auth.uid() = user_id);

drop policy if exists "Guests can read own contact messages" on public.contact_messages;
create policy "Guests can read own contact messages"
on public.contact_messages for select
using (
  exists (
    select 1 from public.contact_conversations c
    where c.id = conversation_id and c.user_id = auth.uid()
  )
);

-- Staff access is enforced by the application/service-role APIs. No public insert/update policies are granted.
