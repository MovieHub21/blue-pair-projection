import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../../../lib/supabase/admin'
import { createSupabaseServerClient } from '../../../../../../lib/supabase/server'
import { withContactAttachmentUrls } from '../../../../../../lib/contactAttachments'

const STAFF_ROLES = new Set(['super_admin', 'manager', 'reception'])

export async function GET(request: Request) {
  const server = createSupabaseServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  const { data: roles } = await server.from('user_roles').select('role').eq('user_id', user.id)
  if (!(roles ?? []).some((row: any) => STAFF_ROLES.has(row.role))) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 })
  const id = new URL(request.url).searchParams.get('conversationId')
  if (!id) return NextResponse.json({ error: 'Conversation is required.' }, { status: 400 })
  const admin = createSupabaseAdminClient()
  const { data: messages, error } = await admin.from('contact_messages').select('id,attachment_path,attachment_name,attachment_mime_type,attachment_size').eq('conversation_id', id).not('attachment_path', 'is', null)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ messages: await withContactAttachmentUrls(messages ?? []) })
}
