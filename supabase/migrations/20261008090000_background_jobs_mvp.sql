-- Durable queue-backed background jobs and per-user notifications.
-- Jobs are enqueued and placed on pgmq in the same database transaction.

create schema if not exists pgmq;
create extension if not exists pgmq with schema pgmq;

do $$
begin
  if not exists (select 1 from pgmq.list_queues() where queue_name = 'blue_pair_background_jobs') then
    perform pgmq.create('blue_pair_background_jobs');
  end if;
end;
$$;

create table if not exists public.background_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  type text not null check (type in ('contact_message_email')),
  status text not null default 'queued' check (status in ('queued','processing','completed','failed')),
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  error text,
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 5),
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  locked_until timestamptz,
  completed_at timestamptz
);

create index if not exists background_jobs_user_idx on public.background_jobs(user_id);
create index if not exists background_jobs_status_idx on public.background_jobs(status);
create index if not exists background_jobs_created_idx on public.background_jobs(created_at desc);
create index if not exists background_jobs_type_idx on public.background_jobs(type);

alter table public.background_jobs enable row level security;
revoke all on public.background_jobs from anon, authenticated;
grant select on public.background_jobs to authenticated;
grant all on public.background_jobs to service_role;

drop policy if exists "Users can read their own background jobs" on public.background_jobs;
create policy "Users can read their own background jobs" on public.background_jobs
  for select to authenticated using (user_id = auth.uid());

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references public.background_jobs(id) on delete set null,
  type text not null,
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index if not exists notifications_user_unread_idx on public.notifications(user_id) where read = false;
create unique index if not exists notifications_job_unique_idx on public.notifications(job_id) where job_id is not null;

alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read) on public.notifications to authenticated;
grant all on public.notifications to service_role;

drop policy if exists "Users can read their own notifications" on public.notifications;
create policy "Users can read their own notifications" on public.notifications
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "Users can mark their own notifications read" on public.notifications;
create policy "Users can mark their own notifications read" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and read = true);

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
  if p_type <> 'contact_message_email' then raise exception 'Unsupported background job type'; end if;
  if p_idempotency_key is null or length(p_idempotency_key) < 8 or length(p_idempotency_key) > 200 then
    raise exception 'Invalid idempotency key';
  end if;
  if jsonb_typeof(p_payload) <> 'object' or coalesce(p_payload->>'conversation_id','') = '' then
    raise exception 'Invalid background job payload';
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

create or replace function public.read_background_job_queue(p_visibility_seconds integer default 300, p_batch_size integer default 5)
returns table(message_id bigint, read_count bigint, message jsonb)
language sql
security definer
set search_path = public, pgmq
as $$
  select q.msg_id, q.read_ct, q.message
  from pgmq.read('blue_pair_background_jobs', least(greatest(p_visibility_seconds, 30), 600), least(greatest(p_batch_size, 1), 10)) q;
$$;

create or replace function public.claim_background_job(p_job_id uuid)
returns setof public.background_jobs
language sql
security definer
set search_path = public
as $$
  update public.background_jobs
  set status = 'processing', attempts = attempts + 1, started_at = now(), locked_until = now() + interval '10 minutes', error = null
  where id = p_job_id
    and status in ('queued','processing')
    and (locked_until is null or locked_until <= now())
    and attempts < max_attempts
  returning *;
$$;

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

  if v_job.user_id is not null then
    insert into public.notifications(user_id, job_id, type, title, message)
    values (v_job.user_id, v_job.id, 'background_job_completed', 'Message delivered', 'Your message has been delivered to the Blue Pair team.')
    on conflict (job_id) where job_id is not null do nothing;
  end if;
  return true;
end;
$$;

create or replace function public.retry_background_job(p_job_id uuid, p_message_id bigint, p_delay_seconds integer, p_safe_error text)
returns boolean
language plpgsql
security definer
set search_path = public, pgmq
as $$
begin
  update public.background_jobs set status = 'queued', error = left(coalesce(p_safe_error, 'We could not complete your request yet.'), 300), locked_until = null
  where id = p_job_id and status = 'processing';
  if not found then return false; end if;
  perform pgmq.send('blue_pair_background_jobs', jsonb_build_object('job_id', p_job_id), least(greatest(p_delay_seconds, 1), 3600));
  perform pgmq.archive('blue_pair_background_jobs', p_message_id);
  return true;
end;
$$;

create or replace function public.fail_background_job(p_job_id uuid, p_message_id bigint, p_safe_error text)
returns boolean
language plpgsql
security definer
set search_path = public, pgmq
as $$
declare v_job public.background_jobs;
begin
  update public.background_jobs
  set status = 'failed', error = left(coalesce(p_safe_error, 'We could not complete your request. Please try again.'), 300), completed_at = now(), locked_until = null
  where id = p_job_id and status = 'processing'
  returning * into v_job;
  if not found then return false; end if;

  if v_job.user_id is not null then
    insert into public.notifications(user_id, job_id, type, title, message)
    values (v_job.user_id, v_job.id, 'background_job_failed', 'Request could not be completed', 'We could not deliver your message by email. Your conversation is saved, and you can try again.')
    on conflict (job_id) where job_id is not null do nothing;
  end if;
  perform pgmq.archive('blue_pair_background_jobs', p_message_id);
  return true;
end;
$$;

create or replace function public.fail_abandoned_background_job(p_job_id uuid, p_message_id bigint)
returns boolean
language plpgsql
security definer
set search_path = public, pgmq
as $$
declare v_job public.background_jobs;
begin
  update public.background_jobs
  set status = 'failed', error = 'We could not complete your request. Your conversation is saved; please try again.', completed_at = now(), locked_until = null
  where id = p_job_id and status = 'processing' and attempts >= max_attempts and locked_until <= now()
  returning * into v_job;
  if not found then return false; end if;

  if v_job.user_id is not null then
    insert into public.notifications(user_id, job_id, type, title, message)
    values (v_job.user_id, v_job.id, 'background_job_failed', 'Request could not be completed', 'We could not deliver your message by email. Your conversation is saved, and you can try again.')
    on conflict (job_id) where job_id is not null do nothing;
  end if;
  perform pgmq.archive('blue_pair_background_jobs', p_message_id);
  return true;
end;
$$;

create or replace function public.archive_background_job_message(p_message_id bigint)
returns boolean
language sql
security definer
set search_path = public, pgmq
as $$
  select pgmq.archive('blue_pair_background_jobs', p_message_id);
$$;

revoke all on function public.enqueue_background_job(uuid,text,jsonb,text,integer) from public, anon, authenticated;
revoke all on function public.read_background_job_queue(integer,integer) from public, anon, authenticated;
revoke all on function public.claim_background_job(uuid) from public, anon, authenticated;
revoke all on function public.complete_background_job(uuid,jsonb) from public, anon, authenticated;
revoke all on function public.retry_background_job(uuid,bigint,integer,text) from public, anon, authenticated;
revoke all on function public.fail_background_job(uuid,bigint,text) from public, anon, authenticated;
revoke all on function public.fail_abandoned_background_job(uuid,bigint) from public, anon, authenticated;
revoke all on function public.archive_background_job_message(bigint) from public, anon, authenticated;
grant execute on function public.enqueue_background_job(uuid,text,jsonb,text,integer) to service_role;
grant execute on function public.read_background_job_queue(integer,integer) to service_role;
grant execute on function public.claim_background_job(uuid) to service_role;
grant execute on function public.complete_background_job(uuid,jsonb) to service_role;
grant execute on function public.retry_background_job(uuid,bigint,integer,text) to service_role;
grant execute on function public.fail_background_job(uuid,bigint,text) to service_role;
grant execute on function public.fail_abandoned_background_job(uuid,bigint) to service_role;
grant execute on function public.archive_background_job_message(bigint) to service_role;

-- Supabase Cron invokes the Edge Function once per minute. The URL and service
-- credentials are read from Vault at runtime and are never stored in this repo.
create schema if not exists extensions;
create schema if not exists net;
create schema if not exists vault;
create extension if not exists pg_cron;
create extension if not exists pg_net with schema net;
create extension if not exists supabase_vault with schema vault;

create or replace function public.invoke_background_jobs_worker()
returns void
language plpgsql
security definer
set search_path = public, extensions, vault, net, pg_temp
as $$
declare
  v_project_url text;
  v_service_role_key text;
  v_anon_key text;
begin
  select decrypted_secret into v_project_url from vault.decrypted_secrets where name = 'blue_pair_project_url';
  select decrypted_secret into v_service_role_key from vault.decrypted_secrets where name = 'blue_pair_service_role_key';
  select decrypted_secret into v_anon_key from vault.decrypted_secrets where name = 'blue_pair_anon_key';
  if coalesce(v_project_url, '') = '' or coalesce(v_service_role_key, '') = '' or coalesce(v_anon_key, '') = '' then
    return;
  end if;

  perform net.http_post(
    url := rtrim(v_project_url, '/') || '/functions/v1/process-background-jobs',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', v_anon_key,
      'Authorization', 'Bearer ' || v_service_role_key
    ),
    body := '{}'::jsonb
  );
end;
$$;
revoke all on function public.invoke_background_jobs_worker() from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'blue-pair-background-jobs') then
    perform cron.schedule('blue-pair-background-jobs', '* * * * *', 'select public.invoke_background_jobs_worker();');
  end if;
end;
$$;

alter table public.notifications replica identity full;
drop trigger if exists bluepair_realtime_change on public.notifications;
create trigger bluepair_realtime_change after insert or update or delete on public.notifications
  for each row execute function public.broadcast_bluepair_database_change();
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; when undefined_object then null; end $$;

