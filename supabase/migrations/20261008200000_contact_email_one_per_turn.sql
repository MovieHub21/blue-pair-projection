-- Contact email alerts are sent once per side's turn. Repeated messages from
-- the same side are quiet until the other side replies.
alter table public.contact_conversations
  add column if not exists last_email_notified_sender text,
  add column if not exists email_notification_claim_job_id uuid,
  add column if not exists email_notification_claimed_until timestamptz;

alter table public.contact_conversations
  drop constraint if exists contact_conversations_last_email_notified_sender_check;
alter table public.contact_conversations
  add constraint contact_conversations_last_email_notified_sender_check
  check (last_email_notified_sender is null or last_email_notified_sender in ('guest', 'staff'));

create or replace function public.claim_contact_message_email(
  p_conversation_id uuid,
  p_sender_type text,
  p_job_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conversation public.contact_conversations;
begin
  if p_sender_type not in ('guest', 'staff') then
    raise exception 'Invalid contact message sender type';
  end if;

  select * into v_conversation
  from public.contact_conversations
  where id = p_conversation_id
  for update;
  if not found then raise exception 'Contact conversation not found'; end if;

  if v_conversation.email_notification_claim_job_id = p_job_id then
    return 'claimed';
  end if;
  if v_conversation.email_notification_claim_job_id is not null
     and v_conversation.email_notification_claimed_until > now() then
    return 'busy';
  end if;
  if v_conversation.last_email_notified_sender = p_sender_type then
    return 'suppressed';
  end if;

  update public.contact_conversations
  set email_notification_claim_job_id = p_job_id,
      email_notification_claimed_until = now() + interval '5 minutes'
  where id = p_conversation_id;
  return 'claimed';
end;
$$;

create or replace function public.finalize_contact_message_email(
  p_conversation_id uuid,
  p_sender_type text,
  p_job_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.contact_conversations
  set last_email_notified_sender = p_sender_type,
      email_notification_claim_job_id = null,
      email_notification_claimed_until = null
  where id = p_conversation_id
    and email_notification_claim_job_id = p_job_id;
  return found;
end;
$$;

create or replace function public.release_contact_message_email(
  p_conversation_id uuid,
  p_job_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.contact_conversations
  set email_notification_claim_job_id = null,
      email_notification_claimed_until = null
  where id = p_conversation_id
    and email_notification_claim_job_id = p_job_id;
  return found;
end;
$$;

revoke all on function public.claim_contact_message_email(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.finalize_contact_message_email(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.release_contact_message_email(uuid, uuid) from public, anon, authenticated;
grant execute on function public.claim_contact_message_email(uuid, text, uuid) to service_role;
grant execute on function public.finalize_contact_message_email(uuid, text, uuid) to service_role;
grant execute on function public.release_contact_message_email(uuid, uuid) to service_role;
