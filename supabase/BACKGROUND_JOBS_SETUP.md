# Background Jobs MVP setup

The migration creates the durable PGMQ queue, access-controlled job and notification tables, queue RPCs, and enables `pg_cron`/`pg_net`. The Edge Function is `process-background-jobs`. Scheduling is a separate one-time step so this setup does not depend on Supabase Vault.

## Deploy

1. Apply `migrations/20261008090000_background_jobs_mvp.sql` using the project's normal Supabase migration deployment process. If `pg_net` is already enabled in the dashboard, the migration leaves that installation in place.
2. Deploy the worker with the Supabase CLI: `supabase functions deploy process-background-jobs`.
3. Set the worker's email configuration as Supabase Function secrets: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `SITE_URL` (`https://bluepairsignature.com`). Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions.
4. In **Database → Cron → Create job**, create a job named `blue-pair-background-jobs`, set the schedule to `* * * * *`, choose the `process-background-jobs` Edge Function, and save. Use the dashboard's Edge Function job type so Supabase configures the request for the selected project. Do not put the service-role key in the cron job.
5. Confirm the job appears in Cron and inspect Edge Function logs for `process-background-jobs` invocations.

If your Cron UI does not offer an Edge Function job type or reports an authorization error, stop and share the exact message. Do not place a service-role key in the SQL or a URL.

## First handler

`contact_message_email` sends the staff and guest emails after the contact conversation is durably saved. Retries reuse recipient-specific Resend idempotency keys, so a partial attempt does not send duplicate emails. The guest's in-app notification is created only for authenticated users; anonymous contact-form visitors do not have a user account to notify.

## Local checks

The worker needs Supabase Queue, Cron, and Net extensions. Local deployments must enable those extensions and set the email function secrets before the end-to-end worker flow can run.