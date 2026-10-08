import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { notifyContactMessage } from '../../../../lib/staffEvents'
import { enqueueBackgroundJob } from '../../../../lib/backgroundJobs'

const CATEGORIES = ['Booking', 'Existing reservation', 'Rooms', 'Restaurant & dining', 'Events', 'Short-let', 'Facilities', 'Payment', 'Complaint', 'General enquiry', 'Other']

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

    await notifyContactMessage(admin, { conversationId: conversation.id, guestName: name, subject, isReply: false })
    let job: { id: string }
    try {
      job = await enqueueBackgroundJob({
        type: 'contact_message_email',
        userId: user?.id ?? null,
        payload: { conversation_id: conversation.id },
        idempotencyKey: `contact-message:${conversation.id}`,
        maxAttempts: 3,
      })
    } catch {
      // Keep the durable conversation and tell the caller that email delivery was not queued.
      console.error('[contact-conversation-create] background email was not queued', { conversationId: conversation.id })
      return NextResponse.json({ error: 'Your message is saved, but email delivery could not be queued. Please try again later.', conversationId: conversation.id }, { status: 503 })
    }

    return NextResponse.json({ success: true, conversationId: conversation.id, guestAccountRequired: isGuestWithoutAccount, jobId: job.id })
  } catch (error: any) {
    console.error('[contact-conversation-create]', error)
    return NextResponse.json({ error: error?.message || 'Unable to start the conversation.' }, { status: 500 })
  }
}
