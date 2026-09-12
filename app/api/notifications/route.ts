import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../lib/supabase/server'

export async function GET(request: Request) {
  const server = createSupabaseServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const url = new URL(request.url)
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 30), 1), 100)
  const { data, error } = await server
    .from('guest_notifications')
    .select('id,type,title,body,href,metadata,read_at,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { count } = await server
    .from('guest_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('read_at', null)

  return NextResponse.json({ notifications: data ?? [], unreadCount: count ?? 0 })
}

export async function PATCH(request: Request) {
  const server = createSupabaseServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const action = String(body.action || '')
  if (!['read', 'all_read'].includes(action)) return NextResponse.json({ error: 'Invalid notification action.' }, { status: 400 })

  if (action === 'all_read') {
    const { error } = await server.from('guest_notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const id = String(body.id || '')
    if (!id) return NextResponse.json({ error: 'Notification id is required.' }, { status: 400 })
    const { error } = await server.from('guest_notifications').update({ read_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
