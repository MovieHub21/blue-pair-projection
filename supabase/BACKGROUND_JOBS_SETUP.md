# Background Jobs MVP setup

The migration creates the durable PGMQ queue, access-controlled job and notification tables, queue RPCs, and enables `pg_cron`/`pg_net`. The Edge Function is `process-background-jobs`. Scheduling is a separate one-time step so this setup does not depend on Supabase Vault.

## Deploy

1. Apply `migrations/20261008090000_background_jobs_mvp.sql` and `migrations/20261008100000_background_email_delivery.sql` using the project's normal Supabase migration deployment process. If `pg_net` is already enabled in the dashboard, the first migration leaves that installation in place.
2. Deploy the worker with the Supabase CLI: `supabase functions deploy process-background-jobs`.
3. Set the worker's email configuration as Supabase Function secrets: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `SITE_URL` (`https://bluepairsignature.com`). Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions.
4. In **Database → Cron → Create job**, create a job named `blue-pair-background-jobs`, set the schedule to `* * * * *`, choose the `process-background-jobs` Edge Function, and save. Use the dashboard's Edge Function job type so Supabase configures the request for the selected project. Do not put the service-role key in the cron job.
5. Confirm the job appears in Cron and inspect Edge Function logs for `process-background-jobs` invocations.

If your Cron UI does not offer an Edge Function job type or reports an authorization error, stop and share the exact message. Do not place a service-role key in the SQL or a URL.

## Handlers

`contact_message_email` sends staff and guest emails after a contact message is durably saved. `email_delivery` handles other already-rendered transactional emails after the related booking, payment, reservation, or request has been saved. Retries reuse Resend idempotency keys. Email jobs are private to the service role and do not create in-app job notifications.

## Local checks

The worker needs Supabase Queue, Cron, and Net extensions. Local deployments must enable those extensions and set the email function secrets before the end-to-end worker flow can run.
