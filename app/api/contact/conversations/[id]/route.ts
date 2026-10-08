import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../../lib/supabase/admin'
import { createSupabaseServerClient } from '../../../../../lib/supabase/server'
import { uploadContactAttachment, withContactAttachmentUrls } from '../../../../../lib/contactAttachments'
import { notifyContactMessage } from '../../../../../lib/staffEvents'
import { enqueueBackgroundJob } from '../../../../../lib/backgroundJobs'

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
  return NextResponse.json({ conversation, messages: await withContactAttachmentUrls(messages ?? []) })
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const server = createSupabaseServerClient()
    const { data: { user } } = await server.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    const contentType = request.headers.get('content-type') || ''
    const multipart = contentType.includes('multipart/form-data')
    const body = multipart ? await request.formData() : await request.json()
    const message = String(multipart ? body.get('message') ?? '' : body.message ?? '').trim()
    const value = multipart ? body.get('file') : null
    const file = value instanceof File && value.size > 0 ? value : null
    if ((!message && !file) || message.length > 5000) return NextResponse.json({ error: 'Add a message or attachment. Messages can be up to 5000 characters.' }, { status: 400 })

    const admin = createSupabaseAdminClient()
    const { data: conversation } = await admin.from('contact_conversations').select('*').eq('id', params.id).or(`user_id.eq.${user.id},guest_email.eq.${(user.email || '').toLowerCase()}`).maybeSingle()
    if (!conversation) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 })
    if (conversation.status === 'resolved') return NextResponse.json({ error: 'This conversation is resolved. Start a new message if you need further help.' }, { status: 409 })

    const attachment = file ? await uploadContactAttachment(file, conversation.id, 'guest') : null
    const { data: savedMessage, error } = await admin.from('contact_messages').insert({ conversation_id: conversation.id, sender_type: 'guest', sender_user_id: user.id, message: message || '', ...(attachment || {}) }).select('*').single()
    if (error) throw error

    await notifyContactMessage(admin, { conversationId: conversation.id, guestName: conversation.guest_name, subject: conversation.subject, isReply: true })
    try {
      await enqueueBackgroundJob({
        type: 'contact_message_email',
        userId: user.id,
        payload: { conversation_id: conversation.id, message_id: savedMessage.id },
        idempotencyKey: `contact-message:${savedMessage.id}`,
        maxAttempts: 5,
      })
    } catch (queueError) {
      console.error('[contact-conversation-guest-reply] email notification was not queued', { messageId: savedMessage.id, error: queueError })
    }
    return NextResponse.json({ success: true, message: savedMessage })
  } catch (error: any) {
    console.error('[contact-conversation-guest-reply]', error)
    return NextResponse.json({ error: error?.message || 'Unable to send your reply.' }, { status: 500 })
  }
}
