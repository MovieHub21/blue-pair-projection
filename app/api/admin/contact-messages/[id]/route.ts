import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../../lib/supabase/admin'
import { createSupabaseServerClient } from '../../../../../lib/supabase/server'

const STAFF_ROLES = new Set(['super_admin', 'manager', 'reception'])
const STATUSES = new Set(['open', 'waiting_for_guest', 'waiting_for_staff', 'resolved'])

async function requireStaff() {
  const server = createSupabaseServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) }
  const { data: roles } = await server.from('user_roles').select('role').eq('user_id', user.id)
  if (!(roles ?? []).some((row: any) => STAFF_ROLES.has(row.role))) return { user: null, error: NextResponse.json({ error: 'Not allowed.' }, { status: 403 }) }
  return { user, error: null }
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { error } = await requireStaff()
  if (error) return error
  const admin = createSupabaseAdminClient()
  const { data: conversation } = await admin.from('contact_conversations').select('*').eq('id', params.id).maybeSingle()
  if (!conversation) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 })
  const { data: messages, error: messageError } = await admin.from('contact_messages').select('*').eq('conversation_id', params.id).order('created_at', { ascending: true })
  if (messageError) return NextResponse.json({ error: messageError.message }, { status: 500 })
  await admin.from('contact_messages').update({ read_at: new Date().toISOString() }).eq('conversation_id', params.id).eq('sender_type', 'guest').is('read_at', null)
  return NextResponse.json({ conversation, messages: messages ?? [] })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { error } = await requireStaff()
  if (error) return error
  try {
    const body = await request.json()
    const status = String(body.status ?? '')
    const priority = String(body.priority ?? '')
    if (!STATUSES.has(status) && !['normal', 'urgent'].includes(priority)) return NextResponse.json({ error: 'No valid update supplied.' }, { status: 400 })
    const admin = createSupabaseAdminClient()
    const update: Record<string, string> = {}
    if (STATUSES.has(status)) update.status = status
    if (['normal', 'urgent'].includes(priority)) update.priority = priority
    const { data, error: dbError } = await admin.from('contact_conversations').update(update).eq('id', params.id).select('*').single()
    if (dbError) throw dbError
    return NextResponse.json({ conversation: data })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unable to update conversation.' }, { status: 500 })
  }
}
