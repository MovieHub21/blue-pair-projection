import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../lib/supabase/server'
import { readSanitizedJson } from '../../../lib/security/input'

// Guests and staff have separate notification lists: "guest" (default) is the guest portal, "staff" is the
// admin, reception, housekeeping and maintenance portals. Row-level security keeps each list private.
const tableFor = (scope: unknown) => (scope === 'staff' ? 'staff_notifications' : 'guest_notifications')
const columnsFor = (scope: unknown) => (scope === 'staff' ? 'id,type,title,body,href,metadata,read_at,created_at,department' : 'id,type,title,body,href,metadata,read_at,created_at')

export async function GET(request: Request) {
  const server = createSupabaseServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const url = new URL(request.url)
  const scope = url.searchParams.get('scope')
  const table = tableFor(scope)
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 30), 1), 100)
  const { data, error } = await server.from(table).select(columnsFor(scope)).eq('user_id', user.id).order('created_at', { ascending: false }).limit(limit)
  if (error) return NextResponse.json({ error: 'Unable to load notifications.' }, { status: 500 })

  const { count } = await server.from(table).select('id', { count: 'exact', head: true }).eq('user_id', user.id).is('read_at', null)
  return NextResponse.json({ notifications: data ?? [], unreadCount: count ?? 0 })
}

export async function PATCH(request: Request) {
  const server = createSupabaseServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const body = await readSanitizedJson<any>(request).catch(() => ({}))
  const action = String(body.action || '')
  if (!['read', 'all_read'].includes(action)) return NextResponse.json({ error: 'Invalid notification action.' }, { status: 400 })
  const table = tableFor(body.scope)

  if (action === 'all_read') {
    const { error } = await server.from(table).update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null)
    if (error) return NextResponse.json({ error: 'Unable to update notifications.' }, { status: 500 })
  } else {
    const id = String(body.id || '')
    if (!id) return NextResponse.json({ error: 'Notification id is required.' }, { status: 400 })
    const { error } = await server.from(table).update({ read_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id)
    if (error) return NextResponse.json({ error: 'Unable to update notification.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
