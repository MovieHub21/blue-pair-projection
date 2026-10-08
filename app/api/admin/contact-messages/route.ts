import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { enqueueBackgroundJob } from '../../../../lib/backgroundJobs'

const STAFF_ROLES = new Set(['super_admin', 'manager', 'reception'])

async function requireStaff() {
  const server = createSupabaseServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) }
  const { data: roles } = await server.from('user_roles').select('role').eq('user_id', user.id)
  if (!(roles ?? []).some((row: any) => STAFF_ROLES.has(row.role))) return { user: null, error: NextResponse.json({ error: 'Not allowed.' }, { status: 403 }) }
  return { user, error: null }
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
    const contentType = request.headers.get('content-type') || ''
    const isJson = contentType.includes('application/json')
    const body: any = isJson ? await request.json() : await request.formData()
    const conversationId = String(isJson ? body.conversationId ?? '' : body.get('conversationId') ?? '')
    const message = String(isJson ? body.message ?? '' : body.get('message') ?? '').trim()
    if (!conversationId || !message || message.length > 5000) return NextResponse.json({ error: 'A conversation and message are required. Messages can be up to 5000 characters.' }, { status: 400 })

    const admin = createSupabaseAdminClient()
    const { data: conversation } = await admin.from('contact_conversations').select('*').eq('id', conversationId).maybeSingle()
    if (!conversation) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 })
    if (conversation.status === 'resolved') return NextResponse.json({ error: 'This conversation is resolved.' }, { status: 409 })

    const { data: savedMessage, error: messageError } = await admin.from('contact_messages').insert({ conversation_id: conversation.id, sender_type: 'staff', sender_user_id: user.id, message }).select('*').single()
    if (messageError) throw messageError
    await admin.from('contact_conversations').update({ status: 'waiting_for_guest' }).eq('id', conversation.id)

    try {
      await enqueueBackgroundJob({ type: 'contact_message_email', userId: user.id, payload: { conversation_id: conversation.id, message_id: savedMessage.id }, idempotencyKey: `contact-message:${savedMessage.id}`, maxAttempts: 5 })
    } catch (queueError) {
      console.error('[admin-contact-message] guest email notification was not queued', { messageId: savedMessage.id, error: queueError })
    }
    return NextResponse.json({ success: true, message: savedMessage })
  } catch (error: any) {
    console.error('[admin-contact-message]', error)
    return NextResponse.json({ error: error?.message || 'Unable to send the staff reply.' }, { status: 500 })
  }
}
