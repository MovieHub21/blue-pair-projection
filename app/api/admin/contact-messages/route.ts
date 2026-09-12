import { NextResponse } from 'next/server'
import { sendResendEmail } from '../../../../lib/email/resend'
import { SITE_EMAIL, SITE_URL } from '../../../../lib/siteConfig'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'

const STAFF_ROLES = new Set(['super_admin', 'manager', 'reception'])

async function requireStaff() {
  const server = createSupabaseServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) }
  const { data: roles } = await server.from('user_roles').select('role').eq('user_id', user.id)
  if (!(roles ?? []).some((row: any) => STAFF_ROLES.has(row.role))) return { user: null, error: NextResponse.json({ error: 'Not allowed.' }, { status: 403 }) }
  return { user, error: null }
}

async function getCompanyEmail(admin: ReturnType<typeof createSupabaseAdminClient>) {
  const { data } = await admin.from('site_content').select('key,value').eq('key', 'hotel_email').maybeSingle()
  return data?.value || SITE_EMAIL
}

export async function GET() {
  const { error } = await requireStaff()
  if (error) return error
  const admin = createSupabaseAdminClient()
  const { data, error: dbError } = await admin.from('contact_conversations').select('*').order('last_message_at', { ascending: false })
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ conversations: data ?? [] })
}

export async function POST(request: Request) {
  try {
    const { user, error } = await requireStaff()
    if (error || !user) return error || NextResponse.json({ error: 'Not allowed.' }, { status: 403 })
    const body = await request.json()
    const conversationId = String(body.conversationId ?? '')
    const message = String(body.message ?? '').trim()
    if (!conversationId || message.length < 2 || message.length > 5000) return NextResponse.json({ error: 'A valid conversation and message are required.' }, { status: 400 })

    const admin = createSupabaseAdminClient()
    const { data: conversation } = await admin.from('contact_conversations').select('*').eq('id', conversationId).maybeSingle()
    if (!conversation) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 })
    if (conversation.status === 'resolved') return NextResponse.json({ error: 'This conversation is resolved.' }, { status: 409 })

    const { error: messageError } = await admin.from('contact_messages').insert({ conversation_id: conversation.id, sender_type: 'staff', sender_user_id: user.id, message })
    if (messageError) throw messageError
    await admin.from('contact_conversations').update({ status: 'waiting_for_guest' }).eq('id', conversation.id)

    if (conversation.guest_email) {
      const guestUrl = `${SITE_URL}/account/messages?conversation=${conversation.id}`
      await sendResendEmail({
        to: conversation.guest_email,
        subject: `New message from Blue Pair Hotel: ${conversation.subject}`,
        text: `Blue Pair Hotel has sent you a new message in your guest portal.\n\nSubject: ${conversation.subject}\n\nSign in to your guest portal to view the message and reply: ${guestUrl}`,
        html: `<h2>You have a new message</h2><p>Blue Pair Hotel has sent you a new message in your guest portal.</p><p><strong>Subject:</strong> ${conversation.subject}</p><p><a href="${guestUrl}">View the message and reply</a></p>`,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[admin-contact-message]', error)
    return NextResponse.json({ error: error?.message || 'Unable to send the staff reply.' }, { status: 500 })
  }
}
