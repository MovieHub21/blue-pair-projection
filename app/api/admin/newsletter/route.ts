import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { dispatchNewsletterBatch } from '../../../../lib/newsletter'

const ALLOWED_ROLES = new Set(['super_admin', 'manager'])

async function requireNewsletterAccess() {
  const server = createSupabaseServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return { user: null, response: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) }
  const { data: roles } = await server.from('user_roles').select('role').eq('user_id', user.id)
  if (!(roles ?? []).some((row: any) => ALLOWED_ROLES.has(row.role))) return { user: null, response: NextResponse.json({ error: 'Newsletter access is restricted to managers.' }, { status: 403 }) }
  return { user, response: null }
}

function cleanHtml(value: string) {
  return value
    .replace(/<\s*(script|iframe|object|embed|form)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, '$1="#"')
}

export async function GET() {
  const access = await requireNewsletterAccess()
  if (access.response) return access.response
  const db = createSupabaseAdminClient()
  const { data: campaigns, error } = await db.from('newsletter_campaigns').select('id,subject,recipient_mode,created_at').order('created_at', { ascending: false }).limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const ids = (campaigns ?? []).map(row => row.id)
  const { data: recipients, error: recipientsError } = ids.length
    ? await db.from('newsletter_recipients').select('campaign_id,status,background_job_id').in('campaign_id', ids).limit(10000)
    : { data: [] as any[] }
  if (recipientsError) return NextResponse.json({ error: 'Unable to load newsletter recipient activity.' }, { status: 500 })
  const jobIds = Array.from(new Set((recipients ?? []).map(row => row.background_job_id).filter(Boolean))) as string[]
  const { data: jobs, error: jobsError } = jobIds.length ? await db.from('background_jobs').select('id,status,error').in('id', jobIds) : { data: [] as any[] }
  if (jobsError) return NextResponse.json({ error: 'Unable to load newsletter delivery statuses.' }, { status: 500 })
  const jobById = new Map((jobs ?? []).map(row => [row.id, row]))
  const summaries = new Map<string, { total: number; queued: number; sent: number; pending: number; failed: number }>()
  for (const recipient of recipients ?? []) {
    const summary = summaries.get(recipient.campaign_id) ?? { total: 0, queued: 0, sent: 0, pending: 0, failed: 0 }
    const job: any = jobById.get(recipient.background_job_id)
    summary.total++
    if (job?.status === 'completed') summary.sent++
    else if (recipient.status === 'failed' || job?.status === 'failed') summary.failed++
    else if (recipient.status === 'pending' || recipient.status === 'dispatching') summary.pending++
    else summary.queued++
    summaries.set(recipient.campaign_id, summary)
  }
  return NextResponse.json({ campaigns: (campaigns ?? []).map(campaign => ({ ...campaign, ...(summaries.get(campaign.id) ?? { total: 0, queued: 0, sent: 0, pending: 0, failed: 0 }) })) })
}

export async function POST(request: Request) {
  const access = await requireNewsletterAccess()
  if (access.response) return access.response
  try {
    const body = await request.json()
    const subject = String(body.subject ?? '').trim().slice(0, 180)
    const contentHtml = cleanHtml(String(body.html ?? '').trim())
    const recipientMode = body.recipientMode === 'custom' ? 'custom' : 'all'
    if (!subject || !contentHtml || contentHtml.replace(/<[^>]*>/g, '').trim().length < 2) return NextResponse.json({ error: 'Add a subject and email content.' }, { status: 400 })

    // Persist the send attempt before resolving recipients. This keeps an
    // auditable campaign record even if the audience lookup or queue step fails.
    const db = createSupabaseAdminClient()
    const { data: campaign, error: campaignError } = await db.from('newsletter_campaigns')
      .insert({ subject, content_html: contentHtml, recipient_mode: recipientMode, created_by: access.user!.id })
      .select('id,subject,recipient_mode,created_at').single()
    if (campaignError) throw campaignError

    let recipients: Array<{ email: string; recipient_name: string }> = []
    if (recipientMode === 'custom') {
      const emails = String(body.customEmails ?? '').split(/[\s,;]+/).map((value: string) => value.trim().toLowerCase()).filter(Boolean)
      const invalid = emails.filter((email: string) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      if (invalid.length) return NextResponse.json({ campaign, recipientCount: 0, queuedToday: 0, queuedLater: 0, error: `Campaign saved to the log, but check these email addresses: ${invalid.slice(0, 5).join(', ')}` }, { status: 400 })
      recipients = Array.from(new Set(emails)).filter((email: string) => !email.endsWith('@bluepairsignature.com')).map((email: string) => ({ email, recipient_name: '' }))
    } else {
      const customerRows: any[] = []
      for (let offset = 0; offset < 100000; offset += 1000) {
        const { data, error: customerError } = await db.from('customers').select('name,email').not('email', 'is', null).order('id').range(offset, offset + 999)
        if (customerError) {
          console.error('[admin/newsletter] audience lookup failed', { campaignId: campaign.id, code: customerError.code })
          return NextResponse.json({ campaign, recipientCount: 0, queuedToday: 0, queuedLater: 0, error: 'Campaign saved to the log, but we could not load guest email addresses. You can review it and try again.' }, { status: 202 })
        }
        customerRows.push(...(data ?? []))
        if (!data || data.length < 1000) break
      }
      const eligible = customerRows.map(row => ({ email: String(row.email || '').trim().toLowerCase(), recipient_name: String(row.name || '') }))
        .filter(row => !!row.email && !row.email.endsWith('@bluepairsignature.com'))
      recipients = Array.from(new Map(eligible.map(row => [row.email, row])).values())
    }
    if (!recipients.length) return NextResponse.json({ campaign, recipientCount: 0, queuedToday: 0, queuedLater: 0, error: 'Campaign saved to the log, but no eligible email addresses were found.' }, { status: 202 })

    for (let index = 0; index < recipients.length; index += 500) {
      const { error: insertError } = await db.from('newsletter_recipients').insert(recipients.slice(index, index + 500).map(recipient => ({ ...recipient, campaign_id: campaign.id })))
      if (insertError) {
        console.error('[admin/newsletter] recipient save failed', { campaignId: campaign.id, code: insertError.code })
        return NextResponse.json({ campaign, recipientCount: 0, queuedToday: 0, queuedLater: 0, error: 'Campaign saved to the log, but the recipient list could not be saved. Please retry.' }, { status: 202 })
      }
    }

    // Dispatch creates durable email jobs; the separate background worker sends
    // them after this request returns, so delivery does not hold the page open.
    let dispatch: { claimed: number; queued: number } = { claimed: 0, queued: 0 }
    let dispatchFailed = false
    try {
      dispatch = await dispatchNewsletterBatch()
    } catch (dispatchError: any) {
      dispatchFailed = true
      console.error('[admin/newsletter] background queue start failed', { campaignId: campaign.id, message: dispatchError?.message })
    }
    const { data: queuedRows } = await db.from('newsletter_recipients').select('id').eq('campaign_id', campaign.id).eq('status', 'queued')
    const queuedToday = queuedRows?.length ?? 0
    const message = dispatchFailed
      ? 'Your newsletter is saved in the activity log, but delivery could not start. It remains pending for the next background dispatch.'
      : dispatch.queued > 0
        ? 'Your newsletter is saved and delivery has started in the background.'
        : 'Your newsletter is saved. The daily sending limit has been reached, so delivery will continue in the next daily batch.'
    return NextResponse.json({ campaign, recipientCount: recipients.length, queuedToday, queuedLater: Math.max(0, recipients.length - queuedToday), queueStarted: dispatch.queued > 0, message }, { status: 201 })
  } catch (error: any) {
    console.error('[admin/newsletter]', error)
    return NextResponse.json({ error: error?.message || 'Unable to queue this newsletter.' }, { status: 500 })
  }
}
