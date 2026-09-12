import { NextResponse } from 'next/server'
import { sendResendEmail } from '../../../../../lib/email/resend'
import { SITE_EMAIL, SITE_URL } from '../../../../../lib/siteConfig'
import { createSupabaseAdminClient } from '../../../../../lib/supabase/admin'
import { createSupabaseServerClient } from '../../../../../lib/supabase/server'

async function getCompanyEmail(admin: ReturnType<typeof createSupabaseAdminClient>) {
  const { data } = await admin.from('site_content').select('key,value').eq('key', 'hotel_email').maybeSingle()
  return data?.value || SITE_EMAIL
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const server = createSupabaseServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  const admin = createSupabaseAdminClient()
  const { data: conversation } = await admin.from('contact_conversations').select('*').eq('id', params.id).or(`user_id.eq.${user.id},guest_email.eq.${(user.email || '').toLowerCase()}`).maybeSingle()
  if (!conversation) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 })
  if (!conversation.user_id) await admin.from('contact_conversations').update({ user_id: user.id }).eq('id', conversation.id)
  const { data: messages, error } = await admin.from('contact_messages').select('*').eq('conversation_id', conversation.id).order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await admin.from('contact_messages').update({ read_at: new Date().toISOString() }).eq('conversation_id', conversation.id).eq('sender_type', 'staff').is('read_at', null)
  return NextResponse.json({ conversation, messages: messages ?? [] })
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const server = createSupabaseServerClient()
    const { data: { user } } = await server.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    const body = await request.json()
    const message = String(body.message ?? '').trim()
    if (message.length < 2 || message.length > 5000) return NextResponse.json({ error: 'Message must be between 2 and 5000 characters.' }, { status: 400 })

    const admin = createSupabaseAdminClient()
    const { data: conversation } = await admin.from('contact_conversations').select('*').eq('id', params.id).or(`user_id.eq.${user.id},guest_email.eq.${(user.email || '').toLowerCase()}`).maybeSingle()
    if (!conversation) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 })
    if (conversation.status === 'resolved') return NextResponse.json({ error: 'This conversation is resolved. Start a new message if you need further help.' }, { status: 409 })

    const { error } = await admin.from('contact_messages').insert({ conversation_id: conversation.id, sender_type: 'guest', sender_user_id: user.id, message })
    if (error) throw error

    const companyEmail = await getCompanyEmail(admin)
    const conversationUrl = `${SITE_URL}/admin/contact-messages?conversation=${conversation.id}`
    await sendResendEmail({
      to: companyEmail,
      subject: `New guest reply: ${conversation.subject}`,
      text: `${conversation.guest_name} has sent a new reply in an existing Blue Pair Hotel conversation.\n\nSubject: ${conversation.subject}\n\nOpen the conversation in the staff portal: ${conversationUrl}`,
      html: `<h2>New guest reply</h2><p><strong>${conversation.guest_name}</strong> has sent a new reply in an existing Blue Pair Hotel conversation.</p><p><strong>Subject:</strong> ${conversation.subject}</p><p><a href="${conversationUrl}">Open the conversation in the staff portal</a></p>`,
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[contact-conversation-guest-reply]', error)
    return NextResponse.json({ error: error?.message || 'Unable to send your reply.' }, { status: 500 })
  }
}
