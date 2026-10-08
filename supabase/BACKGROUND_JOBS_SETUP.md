# Background Jobs MVP setup

The migration creates the `blue_pair_background_jobs` durable PGMQ queue, access-controlled job and notification tables, atomic queue RPCs, and a once-per-minute Supabase Cron invocation. The Edge Function is `process-background-jobs`.

## Deploy

1. Apply `migrations/20261008090000_background_jobs_mvp.sql` using the project's normal Supabase migration deployment process.
2. Deploy the worker with the Supabase CLI: `supabase functions deploy process-background-jobs`.
3. Set the worker's email configuration as Supabase Function secrets: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `SITE_URL` (`https://bluepairsignature.com`). Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions.
4. In Supabase Vault, save these three values under the exact names below. The service role key is a secret and must only be stored in Vault; never add it to client code or commit it.

| Vault secret name | Value |
| --- | --- |
| `blue_pair_project_url` | The project's Supabase URL, such as `https://<project-ref>.supabase.co` |
| `blue_pair_service_role_key` | The project's service role/secret key |
| `blue_pair_anon_key` | The project's publishable/anon key |

The scheduled function intentionally does nothing until all three Vault entries exist. After adding them, verify that `cron.job` contains `blue-pair-background-jobs` and check Supabase Edge Function logs for `process-background-jobs` invocations.

## First handler

`contact_message_email` sends the staff and guest emails after the contact conversation is durably saved. Retries reuse recipient-specific Resend idempotency keys, so a partial attempt does not send duplicate emails. The guest's in-app notification is created only for authenticated users; anonymous contact-form visitors do not have a user account to notify.

## Local checks

The worker needs Supabase Queue, Vault, Cron, and Net extensions. Local deployments must enable those extensions and configure the corresponding local secrets before the end-to-end worker flow can run.
