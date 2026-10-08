import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { readSanitizedJson } from '../../../../lib/security/input'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const [{ data, error }, { count, error: countError }] = await Promise.all([
    supabase.from('notifications')
    .select('id,job_id,type,title,message,read,created_at')
    .eq('user_id', user.id)
    .eq('type', 'background_job_failed')
    .order('created_at', { ascending: false })
    .limit(30),
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('type', 'background_job_failed').eq('read', false),
  ])
  if (error) return NextResponse.json({ error: 'Unable to load notifications.' }, { status: 500 })
  if (countError) return NextResponse.json({ error: 'Unable to load notifications.' }, { status: 500 })
  return NextResponse.json({ notifications: data ?? [], unreadCount: count ?? 0 }, { headers: { 'Cache-Control': 'private, no-store' } })
}

export async function PATCH(request: Request) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const body = await readSanitizedJson<{ id?: unknown; action?: unknown }>(request).catch(() => ({} as { id?: unknown; action?: unknown }))
  const action = body.action
  const id = typeof body.id === 'string' ? body.id : ''
  if (action !== 'read' && action !== 'all_read') {
    return NextResponse.json({ error: 'Invalid notification.' }, { status: 400 })
  }

  let query = supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
  if (action === 'read') {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Invalid notification.' }, { status: 400 })
    query = query.eq('id', id)
  }
  const { error } = await query
  if (error) return NextResponse.json({ error: 'Unable to update notification.' }, { status: 500 })
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'private, no-store' } })
}
