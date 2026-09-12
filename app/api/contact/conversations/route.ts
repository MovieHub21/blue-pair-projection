import { NextResponse } from 'next/server'
import { sendResendEmail } from '../../../../lib/email/resend'
import { SITE_EMAIL, SITE_URL } from '../../../../lib/siteConfig'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'

const CATEGORIES = ['Booking', 'Existing reservation', 'Rooms', 'Restaurant & dining', 'Events', 'Short-let', 'Facilities', 'Payment', 'Complaint', 'General enquiry', 'Other']

async function getCompanyEmail(admin: ReturnType<typeof createSupabaseAdminClient>) {
  const { data } = await admin.from('site_content').select('key,value').eq('key', 'hotel_email').maybeSingle()
  return data?.value || SITE_EMAIL
}

export async function GET() {
  const server = createSupabaseServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  const admin = createSupabaseAdminClient()
  const email = (user.email || '').toLowerCase()
  const { data, error } = await admin.from('contact_conversations').select('*').or(`user_id.eq.${user.id},guest_email.eq.${email}`).order('last_message_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const conversations = data ?? []
  const unclaimed = conversations.filter((conversation: any) => !conversation.user_id)
  if (unclaimed.length) {
    await admin.from('contact_conversations').update({ user_id: user.id }).in('id', unclaimed.map((conversation: any) => conversation.id))
    conversations.forEach((conversation: any) => { if (!conversation.user_id) conversation.user_id = user.id })
  }
  return NextResponse.json({ conversations })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = String(body.name ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const phone = String(body.phone ?? '').trim()
    const subject = String(body.subject ?? '').trim()
    const category = CATEGORIES.includes(String(body.category)) ? String(body.category) : 'General enquiry'
    const message = String(body.message ?? '').trim()
    if (!name || !email || !subject || !message) return NextResponse.json({ error: 'Please complete all required fields.' }, { status: 400 })
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    if (message.length < 2 || message.length > 5000) return NextResponse.json({ error: 'Message must be between 2 and 5000 characters.' }, { status: 400 })

    const server = createSupabaseServerClient()
    const { data: { user } } = await server.auth.getUser()
    const admin = createSupabaseAdminClient()
    const isGuestWithoutAccount = !user

    const { data: conversation, error: conversationError } = await admin.from('contact_conversations').insert({
      user_id: user?.id ?? null,
      guest_name: name,
      guest_email: email,
      guest_phone: phone || null,
      subject,
      category,
      status: 'waiting_for_staff',
      priority: category === 'Complaint' ? 'urgent' : 'normal',
    }).select('*').single()
    if (conversationError) throw conversationError

    const { error: messageError } = await admin.from('contact_messages').insert({ conversation_id: conversation.id, sender_type: 'guest', sender_user_id: user?.id ?? null, message })
    if (messageError) throw messageError

    const companyEmail = await getCompanyEmail(admin)
    const conversationUrl = `${SITE_URL}/admin/contact-messages?conversation=${conversation.id}`
    await sendResendEmail({
      to: companyEmail,
      subject: `New guest message: ${subject}`,
      text: `${name} has sent a new message through the Blue Pair Hotel website.\n\nSubject: ${subject}\nCategory: ${category}\n\nOpen the conversation in the staff portal: ${conversationUrl}`,
      html: `<h2>New guest message</h2><p><strong>${name}</strong> has sent a new message through the Blue Pair Hotel website.</p><p><strong>Subject:</strong> ${subject}<br /><strong>Category:</strong> ${category}</p><p><a href="${conversationUrl}">Open the conversation in the staff portal</a></p>`,
    })

    const guestUrl = `${SITE_URL}/account/messages?conversation=${conversation.id}`
    const registerUrl = `${SITE_URL}/account/register?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&redirect=${encodeURIComponent(`/account/messages?conversation=${conversation.id}`)}`
    await sendResendEmail({
      to: email,
      subject: isGuestWithoutAccount ? `Your message is saved — create your Blue Pair guest account` : `Your message has been received by Blue Pair Hotel`,
      text: isGuestWithoutAccount
        ? `Your message has been received and saved by Blue Pair Hotel. To see the conversation and future replies in your guest portal, create a guest account using this same email address: ${email}\n\nCreate your guest account: ${registerUrl}`
        : `Your message has been received by Blue Pair Hotel. The team will review it and notify you by email when they reply.\n\nOpen your guest portal: ${guestUrl}`,
      html: isGuestWithoutAccount
        ? `<h2>Your message is saved</h2><p>Blue Pair Hotel has received your message and saved the conversation.</p><p>To see the conversation and future replies in your guest portal, create a guest account using this same email address: <strong>${email}</strong>.</p><p><a href="${registerUrl}">Create your guest account</a></p><p>Your existing conversation will be linked to the account automatically.</p>`
        : `<h2>Your message has been received</h2><p>Blue Pair Hotel has received your message. The team will notify you by email when they reply.</p><p><a href="${guestUrl}">Open your guest portal</a></p>`,
    })

    return NextResponse.json({ success: true, conversationId: conversation.id, guestAccountRequired: isGuestWithoutAccount })
  } catch (error: any) {
    console.error('[contact-conversation-create]', error)
    return NextResponse.json({ error: error?.message || 'Unable to start the conversation.' }, { status: 500 })
  }
}
