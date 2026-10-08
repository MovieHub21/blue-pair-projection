-- Extend the durable worker queue so non-critical transactional emails do not
-- hold up guest requests after the underlying operation has been saved.
alter table public.background_jobs drop constraint if exists background_jobs_type_check;
alter table public.background_jobs add constraint background_jobs_type_check
  check (type in ('contact_message_email', 'email_delivery'));

create or replace function public.enqueue_background_job(
  p_user_id uuid,
  p_type text,
  p_payload jsonb,
  p_idempotency_key text,
  p_max_attempts integer default 3
)
returns uuid
language plpgsql
security definer
set search_path = public, pgmq
as $$
declare
  v_job_id uuid;
  v_existing_user uuid;
begin
  if p_type not in ('contact_message_email', 'email_delivery') then
    raise exception 'Unsupported background job type';
  end if;
  if p_idempotency_key is null or length(p_idempotency_key) < 8 or length(p_idempotency_key) > 200 then
    raise exception 'Invalid idempotency key';
  end if;
  if jsonb_typeof(p_payload) <> 'object' then raise exception 'Invalid background job payload'; end if;

  if p_type = 'contact_message_email' and coalesce(p_payload->>'conversation_id','') = '' then
    raise exception 'Invalid contact message job payload';
  end if;
  if p_type = 'email_delivery' and (
    coalesce(p_payload->>'to','') !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or coalesce(p_payload->>'subject','') = ''
    or coalesce(p_payload->>'html','') = ''
  ) then
    raise exception 'Invalid email delivery payload';
  end if;

  insert into public.background_jobs(user_id, type, payload, idempotency_key, max_attempts)
  values (p_user_id, p_type, p_payload, p_idempotency_key, least(greatest(coalesce(p_max_attempts, 3), 1), 5))
  on conflict (idempotency_key) do nothing
  returning id into v_job_id;

  if v_job_id is null then
    select id, user_id into v_job_id, v_existing_user
    from public.background_jobs where idempotency_key = p_idempotency_key;
    if v_existing_user is distinct from p_user_id then raise exception 'Idempotency key belongs to another user'; end if;
    return v_job_id;
  end if;

  perform pgmq.send('blue_pair_background_jobs', jsonb_build_object('job_id', v_job_id));
  return v_job_id;
end;
$$;

-- Generic email jobs carry rendered email content. Keep them service-role only,
-- and do not create end-user "message delivered" notifications for them.
create or replace function public.complete_background_job(p_job_id uuid, p_result jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_job public.background_jobs;
begin
  update public.background_jobs
  set status = 'completed', result = coalesce(p_result, '{}'::jsonb), error = null, completed_at = now(), locked_until = null
  where id = p_job_id and status = 'processing'
  returning * into v_job;
  if not found then return false; end if;

  if v_job.user_id is not null and v_job.type = 'contact_message_email' then
    insert into public.notifications(user_id, job_id, type, title, message)
    values (v_job.user_id, v_job.id, 'background_job_completed', 'Message delivered', 'Your message has been delivered to the Blue Pair team.')
    on conflict (job_id) where job_id is not null do nothing;
  end if;
  return true;
end;
$$;

revoke all on function public.enqueue_background_job(uuid,text,jsonb,text,integer) from public, anon, authenticated;
grant execute on function public.enqueue_background_job(uuid,text,jsonb,text,integer) to service_role;
revoke all on function public.complete_background_job(uuid,jsonb) from public, anon, authenticated;
grant execute on function public.complete_background_job(uuid,jsonb) to service_role;
