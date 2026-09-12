import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { sendResendEmail } from '../../../../lib/email/resend'
import { announcementEmail } from '../../../../lib/email/templates'

const staffRoles = new Set(['admin', 'manager', 'reception', 'front_desk', 'super_admin'])

export async function POST(request: Request) {
  try {
    const authClient = createSupabaseServerClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: staff } = await authClient.from('staff').select('role').eq('user_id', user.id).maybeSingle()
    const role = String(staff?.role || '').toLowerCase().replace(/\s+/g, '_')
    if (!staff || !staffRoles.has(role)) return NextResponse.json({ error: 'Staff permission required' }, { status: 403 })

    const body = await request.json()
    const title = String(body.title || '').trim()
    const message = String(body.message || '').trim()
    if (!title || !message) return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })

    const admin = createSupabaseAdminClient()
    let query = admin.from('customers').select('id,name,email').eq('marketing_email_opt_in', true)
    if (Array.isArray(body.customerIds) && body.customerIds.length) query = query.in('id', body.customerIds.map(String))
    const { data: customers, error } = await query
    if (error) throw error

    let sent = 0
    for (const customer of customers ?? []) {
      if (!customer.email) continue
      const email = announcementEmail({ guestName: customer.name || 'Guest', title, message, offerUrl: body.offerUrl ? String(body.offerUrl) : undefined })
      await sendResendEmail({ to: customer.email, subject: email.subject, html: email.html, text: email.text })
      sent++
    }

    return NextResponse.json({ ok: true, sent })
  } catch (error) {
    console.error('[announcement-email] failed', error)
    return NextResponse.json({ error: 'Unable to send announcement' }, { status: 500 })
  }
}
