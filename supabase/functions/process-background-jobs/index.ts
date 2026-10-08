import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { canAccessContactMessages } from '../_shared/contactMessageAccess.ts'
import { contactMessageEmail } from '../_shared/contactMessageEmail.ts'

type QueueMessage = { message_id: number; read_count: number; message: { job_id?: string } }
type Job = {
  id: string
  user_id: string | null
  type: string
  payload: { conversation_id?: string }
  attempts: number
  max_attempts: number
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendApiKey = Deno.env.get('RESEND_API_KEY')!
const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL')!
const siteUrl = Deno.env.get('SITE_URL') || 'https://bluepairsignature.com'
const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })

async function sendEmail(input: { to: string; subject: string; text: string; html: string; idempotencyKey: string }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': input.idempotencyKey },
    body: JSON.stringify({ from: resendFromEmail, to: [input.to], subject: input.subject, text: input.text, html: input.html }),
  })
  const result = await response.json().catch(() => null)
  if (!response.ok) throw new Error(`Resend returned ${response.status}: ${JSON.stringify(result)}`)
}

async function getContactStaffRecipients() {
  const [{ data: roleRows, error: roleError }, { data: permissionRows, error: permissionError }] = await Promise.all([
    admin.from('user_roles').select('user_id,role'),
    admin.from('role_permissions').select('role,section,allowed').eq('section', 'reception'),
  ])
  if (roleError) throw roleError
  if (permissionError) throw permissionError

  const rolesByUser = new Map<string, string[]>()
  for (const row of roleRows ?? []) {
    const userId = String(row.user_id || '')
    if (!userId) continue
    rolesByUser.set(userId, [...(rolesByUser.get(userId) ?? []), String(row.role)])
  }
  const eligibleIds = [...rolesByUser.entries()]
    .filter(([, roles]) => canAccessContactMessages(roles, permissionRows ?? []))
    .map(([userId]) => userId)
  if (!eligibleIds.length) return []

  const [{ data: profiles, error: profileError }, { data: staffRows, error: staffError }] = await Promise.all([
    admin.from('profiles').select('id,name,email').in('id', eligibleIds),
    admin.from('staff').select('user_id,name,email').in('user_id', eligibleIds),
  ])
  if (profileError) throw profileError
  if (staffError) throw staffError

  const byEmail = new Map<string, { userId: string; name: string; email: string }>()
  for (const userId of eligibleIds) {
    const profile = (profiles ?? []).find((row: any) => row.id === userId)
    const staff = (staffRows ?? []).find((row: any) => row.user_id === userId)
    const email = String(profile?.email || staff?.email || '').trim().toLowerCase()
    if (!/^\S+@\S+\.\S+$/.test(email)) continue
    byEmail.set(email, { userId, name: String(profile?.name || staff?.name || 'Team'), email })
  }
  return [...byEmail.values()]
}

async function handleContactMessageEmail(job: Job) {
  const conversationId = job.payload?.conversation_id
  if (!conversationId || !/^[0-9a-f-]{36}$/i.test(conversationId)) throw new Error('Invalid conversation id')

  const { data: conversation, error } = await admin
    .from('contact_conversations')
    .select('id,user_id,guest_name,guest_email')
    .eq('id', conversationId)
    .maybeSingle()
  if (error) throw error
  if (!conversation) throw new Error('Contact conversation was not found')

  const guestEmail = String(conversation.guest_email || '').trim().toLowerCase()
  if (!/^\S+@\S+\.\S+$/.test(guestEmail)) throw new Error('Guest contact email is invalid')

  const staffRecipients = await getContactStaffRecipients()
  if (!staffRecipients.length) throw new Error('No staff member currently has access to Guest Messages')

  const conversationPath = `/admin/contact-messages?conversation=${conversation.id}`
  const guestPath = `/account/messages?conversation=${conversation.id}`
  const guestUrl = conversation.user_id
    ? `${siteUrl}${guestPath}`
    : `${siteUrl}/account/register?redirect=${encodeURIComponent(guestPath)}`
  const staffEmail = contactMessageEmail({
    recipientName: 'Team',
    recipientType: 'staff',
    conversationUrl: `${siteUrl}${conversationPath}`,
  })
  const guestEmailContent = contactMessageEmail({
    recipientName: String(conversation.guest_name || 'Guest'),
    recipientType: 'guest',
    guestNeedsAccount: !conversation.user_id,
    conversationUrl: guestUrl,
  })

  await Promise.all(staffRecipients.map(recipient => sendEmail({
    to: recipient.email,
    ...staffEmail,
    idempotencyKey: `contact-message:${conversation.id}:staff:${recipient.userId}`,
  })))
  await sendEmail({
    to: guestEmail,
    ...guestEmailContent,
    idempotencyKey: `contact-message:${conversation.id}:guest`,
  })
}

async function processMessage(message: QueueMessage) {
  const jobId = message.message?.job_id
  if (!jobId || !/^[0-9a-f-]{36}$/i.test(jobId)) {
    const { error } = await admin.rpc('archive_background_job_message', { p_message_id: message.message_id })
    if (error) throw error
    return
  }

  const { data: claimed, error: claimError } = await admin.rpc('claim_background_job', { p_job_id: jobId })
  if (claimError) throw claimError
  const job = (claimed as Job[] | null)?.[0]
  if (!job) {
    const { data: current, error } = await admin.from('background_jobs').select('status,locked_until,attempts,max_attempts').eq('id', jobId).maybeSingle()
    if (error) throw error
    if (!current || current.status === 'completed' || current.status === 'failed') {
      const { error: archiveError } = await admin.rpc('archive_background_job_message', { p_message_id: message.message_id })
      if (archiveError) throw archiveError
    } else if (current.status === 'processing' && current.attempts >= current.max_attempts && current.locked_until && new Date(current.locked_until).getTime() <= Date.now()) {
      const { error: failError } = await admin.rpc('fail_abandoned_background_job', { p_job_id: jobId, p_message_id: message.message_id })
      if (failError) throw failError
    }
    // A live lease means another worker owns it. Leave this message to become visible again.
    return
  }

  try {
    if (job.type !== 'contact_message_email') throw new Error(`Unsupported job type: ${job.type}`)
    await handleContactMessageEmail(job)
    const { error } = await admin.rpc('complete_background_job', { p_job_id: job.id, p_result: { email_delivery: 'sent' } })
    if (error) throw error
    const { error: archiveError } = await admin.rpc('archive_background_job_message', { p_message_id: message.message_id })
    if (archiveError) throw archiveError
  } catch (error) {
    console.error('[background-jobs] handler failed', { jobId: job.id, attempt: job.attempts, error: error instanceof Error ? error.message : String(error) })
    if (job.attempts < job.max_attempts) {
      const delaySeconds = Math.min(30 * (2 ** (job.attempts - 1)), 900)
      const { error: retryError } = await admin.rpc('retry_background_job', {
        p_job_id: job.id,
        p_message_id: message.message_id,
        p_delay_seconds: delaySeconds,
        p_safe_error: 'We could not deliver your message by email yet.',
      })
      if (retryError) throw retryError
      return
    }

    const { error: failError } = await admin.rpc('fail_background_job', {
      p_job_id: job.id,
      p_message_id: message.message_id,
      p_safe_error: 'We could not complete your request. Your conversation is saved; please try again.',
    })
    if (failError) throw failError
  }
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !resendFromEmail) return new Response('Worker configuration is incomplete', { status: 500 })

  const { data: messages, error } = await admin.rpc('read_background_job_queue', { p_visibility_seconds: 600, p_batch_size: 5 })
  if (error) {
    console.error('[background-jobs] queue read failed', { code: error.code, message: error.message })
    return new Response('Unable to read job queue', { status: 500 })
  }

  let processed = 0
  for (const message of (messages ?? []) as QueueMessage[]) {
    try {
      await processMessage(message)
      processed++
    } catch (jobError) {
      console.error('[background-jobs] message processing deferred', { messageId: message.message_id, error: jobError instanceof Error ? jobError.message : String(jobError) })
    }
  }
  return Response.json({ ok: true, processed })
})
