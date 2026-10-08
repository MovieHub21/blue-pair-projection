-- Keep user notifications focused on delivery failures. Successful message
-- delivery is recorded in background_jobs and does not need a toast/bell item.
create or replace function public.complete_background_job(p_job_id uuid, p_result jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.background_jobs
  set status = 'completed',
      result = coalesce(p_result, '{}'::jsonb),
      error = null,
      completed_at = now(),
      locked_until = null
  where id = p_job_id and status = 'processing';
  return found;
end;
$$;

revoke all on function public.complete_background_job(uuid,jsonb) from public, anon, authenticated;
grant execute on function public.complete_background_job(uuid,jsonb) to service_role;
