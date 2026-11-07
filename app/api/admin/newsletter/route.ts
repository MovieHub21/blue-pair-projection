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
  const { data: campaigns, error } = await db.from('newsletter_campaigns').select('id,subject,created_at').order('created_at', { ascending: false }).limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const ids = (campaigns ?? []).map(row => row.id)
  const { data: recipients } = ids.length
    ? await db.from('newsletter_recipients').select('campaign_id,status,background_job_id').in('campaign_id', ids).limit(10000)
    : { data: [] as any[] }
  const jobIds = Array.from(new Set((recipients ?? []).map(row => row.background_job_id).filter(Boolean))) as string[]
  const { data: jobs } = jobIds.length ? await db.from('background_jobs').select('id,status,error').in('id', jobIds) : { data: [] as any[] }
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
    if (!subject || !contentHtml || contentHtml.replace(/<[^>]*>/g, '').trim().length < 2) return NextResponse.json({ error: 'Add a subject and email content.' }, { status: 400 })

    const db = createSupabaseAdminClient()
    const customerRows: any[] = []
    for (let offset = 0; offset < 100000; offset += 1000) {
      const { data, error: customerError } = await db.from('customers').select('name,email').not('email', 'is', null).order('id').range(offset, offset + 999)
      if (customerError) throw customerError
      customerRows.push(...(data ?? []))
      if (!data || data.length < 1000) break
    }
    const eligible = customerRows.map(row => {
      const email = String(row.email || '').trim().toLowerCase()
      return { email, recipient_name: String(row.name || '') }
    }).filter(row => !!row.email && !row.email.endsWith('@bluepairsignature.com'))
    const recipients = Array.from(new Map(eligible.map(row => [row.email, row])).values())
    if (!recipients.length) return NextResponse.json({ error: 'No eligible customer email addresses were found.' }, { status: 400 })

    const { data: campaign, error } = await db.from('newsletter_campaigns').insert({ subject, content_html: contentHtml, created_by: access.user!.id }).select('id,subject,created_at').single()
    if (error) throw error
    for (let index = 0; index < recipients.length; index += 500) {
      const { error: insertError } = await db.from('newsletter_recipients').insert(recipients.slice(index, index + 500).map(recipient => ({ ...recipient, campaign_id: campaign.id })))
      if (insertError) throw insertError
    }
    await dispatchNewsletterBatch()
    const { data: queuedRows } = await db.from('newsletter_recipients').select('id').eq('campaign_id', campaign.id).eq('status', 'queued')
    const queuedToday = queuedRows?.length ?? 0
    return NextResponse.json({ campaign, recipientCount: recipients.length, queuedToday, queuedLater: Math.max(0, recipients.length - queuedToday) }, { status: 201 })
  } catch (error: any) {
    console.error('[admin/newsletter]', error)
    return NextResponse.json({ error: error?.message || 'Unable to queue this newsletter.' }, { status: 500 })
  }
}
