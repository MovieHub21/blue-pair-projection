import { createSupabaseAdminClient } from './supabase/admin'

export type BackgroundJobType = 'contact_message_email' | 'email_delivery'
export type BackgroundEmailPayload = { to: string; subject: string; html: string; text?: string; idempotency_key?: string; include_account_cta?: boolean }

type EnqueueBackgroundJobInput = {
  type: BackgroundJobType
  userId: string | null
  payload: { conversation_id: string; message_id?: string } | BackgroundEmailPayload
  idempotencyKey: string
  maxAttempts?: number
}

/** Server-only enqueue helper. The RPC inserts the job and pgmq message atomically. */
export async function enqueueBackgroundJob(input: EnqueueBackgroundJobInput): Promise<{ id: string }> {
  const admin = createSupabaseAdminClient()
  const { data, error } = await admin.rpc('enqueue_background_job', {
    p_user_id: input.userId,
    p_type: input.type,
    p_payload: input.payload,
    p_idempotency_key: input.idempotencyKey,
    p_max_attempts: input.maxAttempts ?? 3,
  })

  if (error || typeof data !== 'string') {
    console.error('[background-jobs] enqueue failed', { type: input.type, code: error?.code })
    throw new Error('Unable to queue this request.')
  }
  return { id: data }
}

export function enqueueBackgroundEmail(input: BackgroundEmailPayload & { queueKey: string }): Promise<{ id: string }> {
  const { queueKey, ...email } = input
  return enqueueBackgroundJob({
    type: 'email_delivery',
    userId: null,
    payload: { ...email, idempotency_key: email.idempotency_key || queueKey },
    idempotencyKey: queueKey,
  })
}
