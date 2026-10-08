import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { canAccessContactMessages } from '../_shared/contactMessageAccess.ts'
import { contactMessageEmail } from '../_shared/contactMessageEmail.ts'

type QueueMessage = { message_id: number; read_count: number; message: { job_id?: string } }
type Job = {
  id: string
  user_id: string | null
  type: string
  payload: { conversation_id?: string; message_id?: string; to?: string; subject?: string; html?: string; text?: string; idempotency_key?: string; include_account_cta?: boolean }
  idempotency_key?: string
  attempts: number
  max_attempts: number
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const resendApiKey = Deno.env.get('RESEND_API_KEY')!
const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL')!
const siteUrl = Deno.env.get('SITE_URL') || 'https://bluepairsignature.com'
const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })

function hasCronSecret(request: Request) {
  const configuredKeys = [serviceRoleKey]
  const secretKeysJson = Deno.env.get('SUPABASE_SECRET_KEYS')
  if (secretKeysJson) {
    try {
      const secretKeys = JSON.parse(secretKeysJson)
      if (secretKeys && typeof secretKeys === 'object') {
        configuredKeys.push(...Object.values(secretKeys).filter((key): key is string => typeof key === 'string'))
      }
    } catch {
      console.error('[background-jobs] SUPABASE_SECRET_KEYS is not valid JSON')
    }
  }

  const apiKey = request.headers.get('apikey')?.trim()
  const authorization = request.headers.get('authorization')?.trim().replace(/^Bearer\s+/i, '')
  return configuredKeys.some(key => Boolean(key) && (apiKey === key || authorization === key))
}

async function sendEmail(input: { to: string; subject: string; text: string; html: string; idempotencyKey: string; jobId: string; recipientType: string }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': input.idempotencyKey },
    body: JSON.stringify({ from: resendFromEmail, to: [input.to], subject: input.subject, text: input.text, html: input.html }),
  })
  const result = await response.json().catch(() => null)
  if (!response.ok) {
    const providerError = result && typeof result === 'object'
      ? { name: (result as any).name, message: (result as any).message, statusCode: (result as any).statusCode }
      : null
    throw new Error(`Resend returned ${response.status}${providerError?.name ? ` (${providerError.name})` : ''}${providerError?.message ? `: ${providerError.message}` : ''}`)
  }
  console.info('[background-jobs] Resend accepted email', {
    jobId: input.jobId,
    recipientType: input.recipientType,
    status: response.status,
    providerId: result?.id ?? null,
  })
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
  if (!eligibleIds.length) {
    console.warn('[background-jobs] no staff accounts have Guest Messages access')
    return []
  }

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
  const recipients = [...byEmail.values()]
  console.info('[background-jobs] resolved Guest Messages staff recipients', { count: recipients.length })
  return recipients
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

  let messageQuery = admin.from('contact_messages').select('id,sender_type').eq('conversation_id', conversationId)
  if (job.payload.message_id) messageQuery = messageQuery.eq('id', job.payload.message_id)
  const { data: contactMessage, error: messageError } = await messageQuery.order('created_at', { ascending: !job.payload.message_id }).limit(1).maybeSingle()
  if (messageError) throw messageError
  if (!contactMessage) throw new Error('Contact message was not found')

  const senderType = contactMessage.sender_type
  if (senderType !== 'guest' && senderType !== 'staff') throw new Error('Contact message sender type is invalid')
  const { data: claim, error: claimError } = await admin.rpc('claim_contact_message_email', {
    p_conversation_id: conversationId,
    p_sender_type: senderType,
    p_job_id: job.id,
  })
  if (claimError) throw claimError
  if (claim === 'suppressed') {
    console.info('[background-jobs] suppressed contact email; this sender was already notified for the current turn', {
      jobId: job.id,
      conversationId,
      messageId: contactMessage.id,
      senderType,
    })
    return
  }
  if (claim !== 'claimed') throw new Error('Contact email notification is busy; retry this job')

  const guestEmail = String(conversation.guest_email || '').trim().toLowerCase()
  try {
    if (!/^\S+@\S+\.\S+$/.test(guestEmail)) throw new Error('Guest contact email is invalid')

    const conversationPath = `/admin/contact-messages?conversation=${conversation.id}`
    const guestPath = `/account/messages?conversation=${conversation.id}`
    const guestUrl = conversation.user_id
      ? `${siteUrl}${guestPath}`
      : `${siteUrl}/account/register?redirect=${encodeURIComponent(guestPath)}`
    const notificationKey = `contact-message:${contactMessage.id}`
    if (senderType === 'guest') {
      const staffRecipients = await getContactStaffRecipients()
      if (!staffRecipients.length) throw new Error('No staff member currently has access to Guest Messages')
      const staffEmail = contactMessageEmail({ recipientName: 'Team', recipientType: 'staff', conversationUrl: `${siteUrl}${conversationPath}` })
      await Promise.all(staffRecipients.map(recipient => sendEmail({
        to: recipient.email,
        ...staffEmail,
        idempotencyKey: `${notificationKey}:staff:${recipient.userId}`,
        jobId: job.id,
        recipientType: 'contact_staff',
      })))
    } else {
      const guestEmailContent = contactMessageEmail({ recipientName: String(conversation.guest_name || 'Guest'), recipientType: 'guest', guestNeedsAccount: !conversation.user_id, conversationUrl: guestUrl })
      await sendEmail({
        to: guestEmail,
        ...guestEmailContent,
        idempotencyKey: `${notificationKey}:guest`,
        jobId: job.id,
        recipientType: 'contact_guest',
      })
    }
    console.info('[background-jobs] sending contact conversation email', {
      jobId: job.id,
      conversationId,
      messageId: contactMessage.id,
      senderType,
      guestEmailPresent: Boolean(guestEmail),
    })
    const { error: finalizeError } = await admin.rpc('finalize_contact_message_email', {
      p_conversation_id: conversationId,
      p_sender_type: senderType,
      p_job_id: job.id,
    })
    if (finalizeError) throw finalizeError
  } catch (error) {
    const { error: releaseError } = await admin.rpc('release_contact_message_email', { p_conversation_id: conversationId, p_job_id: job.id })
    if (releaseError) console.error('[background-jobs] could not release contact email claim', { jobId: job.id, conversationId, message: releaseError.message })
    throw error
  }
}

async function handleEmailDelivery(job: Job) {
  const { to, subject, html, text } = job.payload
  if (!to || !/^\S+@\S+\.\S+$/.test(to) || !subject || !html) throw new Error('Invalid email delivery payload')
  const logoUrl = `${siteUrl.replace(/\/$/, '')}/icon-192.png`
  let emailHtml = html.replace(/(<body[^>]*>)/i, `$1<div style="text-align:center;padding:0 0 20px"><img src="${logoUrl}" width="76" height="76" alt="Blue Pair Signature" style="display:inline-block;width:76px;height:76px;border-radius:16px;object-fit:cover;border:0" /></div>`)
  let emailText = text || ''
  if (job.payload.include_account_cta !== false && subject.toLowerCase().includes('payment confirmed')) {
    const accountUrl = `${siteUrl.replace(/\/$/, '')}/account/register`
    const htmlCta = `<div style="margin:28px 0 4px;padding:20px;background:#f8f6f0;border:1px solid #e9e4d8;border-radius:12px"><p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#101a35">Keep track of your booking online</p><p style="margin:0 0 14px;color:#566079;line-height:1.7">You can create a guest account with this same email address to view your booking, payment and stay updates online.</p><p style="margin:0"><a href="${accountUrl}" style="display:inline-block;background:#0b1633;color:#fff;padding:12px 18px;text-decoration:none;border-radius:8px;font-weight:700">Create your guest account</a></p><p style="margin:12px 0 0;color:#777f91;font-size:12px">${siteUrl}</p></div>`
    emailHtml = emailHtml.replace(/(<div[^>]*padding:32px[^>]*>)/i, `$1${htmlCta}`)
    emailText += `\n\nKeep track of your booking online:\nCreate a guest account with this same email address to view your booking, payment and stay updates: ${accountUrl}\n`
  }
  await sendEmail({
    to,
    subject,
    html: emailHtml,
    text: emailText,
    idempotencyKey: job.payload.idempotency_key || `background-job:${job.id}`,
    jobId: job.id,
    recipientType: 'transactional',
  })
}

async function processMessage(message: QueueMessage) {
  const jobId = message.message?.job_id
  console.info('[background-jobs] queue message received', { messageId: message.message_id, readCount: message.read_count, jobId: jobId ?? null })
  if (!jobId || !/^[0-9a-f-]{36}$/i.test(jobId)) {
    const { error } = await admin.rpc('archive_background_job_message', { p_message_id: message.message_id })
    if (error) throw error
    console.warn('[background-jobs] archived queue message with invalid job id', { messageId: message.message_id })
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
      console.info('[background-jobs] archived message for terminal or missing job', { jobId, status: current?.status ?? 'missing' })
    } else if (current.status === 'processing' && current.attempts >= current.max_attempts && current.locked_until && new Date(current.locked_until).getTime() <= Date.now()) {
      const { error: failError } = await admin.rpc('fail_abandoned_background_job', { p_job_id: jobId, p_message_id: message.message_id })
      if (failError) throw failError
      console.error('[background-jobs] marked abandoned job failed', { jobId, attempts: current.attempts })
    } else {
      console.info('[background-jobs] job was not claimed; lease or status prevents processing', {
        jobId,
        status: current?.status ?? 'missing',
        attempts: current?.attempts ?? null,
        lockedUntil: current?.locked_until ?? null,
      })
    }
    // A live lease means another worker owns it. Leave this message to become visible again.
    return
  }

  console.info('[background-jobs] processing job', { jobId: job.id, type: job.type, attempt: job.attempts, maxAttempts: job.max_attempts })
  try {
    if (job.type === 'contact_message_email') await handleContactMessageEmail(job)
    else if (job.type === 'email_delivery') await handleEmailDelivery(job)
    else throw new Error(`Unsupported job type: ${job.type}`)
    const { error } = await admin.rpc('complete_background_job', { p_job_id: job.id, p_result: { email_delivery: 'sent' } })
    if (error) throw error
    const { error: archiveError } = await admin.rpc('archive_background_job_message', { p_message_id: message.message_id })
    if (archiveError) throw archiveError
    console.info('[background-jobs] job completed', { jobId: job.id, type: job.type, attempt: job.attempts })
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
      console.warn('[background-jobs] job scheduled for retry', { jobId: job.id, attempt: job.attempts, delaySeconds })
      return
    }

    const { error: failError } = await admin.rpc('fail_background_job', {
      p_job_id: job.id,
      p_message_id: message.message_id,
      p_safe_error: 'We could not complete your request. Your conversation is saved; please try again.',
    })
    if (failError) throw failError
    console.error('[background-jobs] job failed after final attempt', { jobId: job.id, attempt: job.attempts, maxAttempts: job.max_attempts })
  }
}

Deno.serve(async (request) => {
  const invocationId = crypto.randomUUID()
  console.info('[background-jobs] invocation started', { invocationId, method: request.method })
  try {
    if (request.method !== 'POST') {
      console.warn('[background-jobs] rejected non-POST invocation', { invocationId, method: request.method })
      return new Response('Method not allowed', { status: 405 })
    }
    if (!hasCronSecret(request)) {
      console.error('[background-jobs] rejected invocation with missing or unrecognized secret key', {
        invocationId,
        apiKeyPresent: request.headers.has('apikey'),
        authorizationPresent: request.headers.has('authorization'),
      })
      return new Response('Unauthorized', { status: 401 })
    }
    const missingConfig = [
      !supabaseUrl && 'SUPABASE_URL',
      !serviceRoleKey && 'SUPABASE_SERVICE_ROLE_KEY',
      !resendApiKey && 'RESEND_API_KEY',
      !resendFromEmail && 'RESEND_FROM_EMAIL',
    ].filter(Boolean)
    if (missingConfig.length) {
      console.error('[background-jobs] worker configuration incomplete', { invocationId, missing: missingConfig })
      return new Response('Worker configuration is incomplete', { status: 500 })
    }

    const { data: messages, error } = await admin.rpc('read_background_job_queue', { p_visibility_seconds: 600, p_batch_size: 5 })
    if (error) {
      console.error('[background-jobs] queue read failed', { invocationId, code: error.code, message: error.message })
      return new Response('Unable to read job queue', { status: 500 })
    }

    console.info('[background-jobs] queue read succeeded', { invocationId, messageCount: messages?.length ?? 0 })
    let processed = 0
    for (const message of (messages ?? []) as QueueMessage[]) {
      try {
        await processMessage(message)
        processed++
      } catch (jobError) {
        console.error('[background-jobs] message processing deferred', { messageId: message.message_id, error: jobError instanceof Error ? jobError.message : String(jobError) })
      }
    }
    console.info('[background-jobs] invocation finished', { invocationId, queueMessageCount: messages?.length ?? 0, processed })
    return Response.json({ ok: true, processed, invocationId })
  } catch (error) {
    console.error('[background-jobs] unhandled invocation error', {
      invocationId,
      error: error instanceof Error ? error.message : String(error),
    })
    return new Response('Worker failed', { status: 500 })
  }
})
