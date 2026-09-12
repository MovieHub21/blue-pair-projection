import { NextResponse } from 'next/server'
import { sendResendEmail } from '../../../lib/email/resend'
import { SITE_EMAIL } from '../../../lib/siteConfig'
import { createSupabasePublicClient } from '../../../lib/supabase/server'

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char] as string))
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = String(body.name ?? '').trim()
    const email = String(body.email ?? '').trim()
    const subject = String(body.subject ?? '').trim()
    const message = String(body.message ?? '').trim()
    if (!name || !email || !subject || !message) return NextResponse.json({ error: 'Please complete all fields.' }, { status: 400 })
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    if (message.length > 5000) return NextResponse.json({ error: 'Message is too long.' }, { status: 400 })

    const db = createSupabasePublicClient()
    const { data: content } = await db.from('site_content').select('key,value').in('key', ['hotel_email'])
    const configuredEmail = (content ?? []).find((row: any) => row.key === 'hotel_email')?.value || SITE_EMAIL

    await sendResendEmail({
      to: configuredEmail,
      subject: `Website enquiry: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
      html: `<h2>New website enquiry</h2><p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Subject:</strong> ${escapeHtml(subject)}</p><p>${escapeHtml(message).replace(/\n/g, '<br />')}</p>`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[contact]', error)
    return NextResponse.json({ error: error?.message || 'Unable to send your message right now.' }, { status: 500 })
  }
}
