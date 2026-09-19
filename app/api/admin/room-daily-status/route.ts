import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'

export const dynamic = 'force-dynamic'

const STATUSES = ['available', 'cleaning_required', 'cleaning', 'maintenance', 'available_soon'] as const

async function staff() {
  const auth = createSupabaseServerClient()
  const { data: { user }, error: authError } = await auth.auth.getUser()
  if (!user) return { allowed: false, reason: 'not-authenticated' }
  const db = createSupabaseAdminClient()
  const { data, error } = await db.from('user_roles').select('role').eq('user_id', user.id)
  const roles = (data ?? []).map((r: any) => String(r.role))
  const allowed = roles.some((role) => ['super_admin', 'manager', 'reception', 'housekeeping'].includes(role))
  console.info('[room-status][auth]', { authenticated: true, userId: user.id, roles, allowed, authError: authError?.message ?? null, queryError: error?.message ?? null })
  return { allowed, reason: allowed ? 'role-allowed' : 'role-not-allowed' }
}

export async function POST(request: Request) {
  const requestId = `status_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  const startedAt = Date.now()
  try {
    const access = await staff()
    if (!access.allowed) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    const roomId = String(body.roomId || '')
    const status = String(body.status || '')
    if (!roomId || !STATUSES.includes(status as any)) {
      return NextResponse.json({ error: 'Room and valid room status are required.' }, { status: 400 })
    }

    const db = createSupabaseAdminClient()
    const { data: room, error: roomError } = await db.from('rooms').select('id,room_number,status').eq('id', roomId).maybeSingle()
    if (roomError) throw roomError
    if (!room) return NextResponse.json({ error: 'Room not found.' }, { status: 404 })

    console.info('[room-status][update]', { requestId, roomId, roomNumber: room.room_number, from: room.status, to: status })

    if (status === 'maintenance' || status === 'available_soon') {
      const { error } = await db.from('rooms').update({ status }).eq('id', roomId)
      if (error) throw error
      await db.from('room_daily_statuses').delete().eq('room_id', roomId)
    } else if (status === 'available') {
      const { error } = await db.from('rooms').update({ status: 'available' }).eq('id', roomId)
      if (error) throw error
      const { error: clearError } = await db.from('room_daily_statuses').delete().eq('room_id', roomId)
      if (clearError) throw clearError
    } else {
      const { error } = await db.from('rooms').update({ status: 'available' }).eq('id', roomId)
      if (error) throw error
      const { error: upsertError } = await db.from('room_daily_statuses').upsert({
        room_id: roomId,
        status,
        status_date: null,
        updated_at: new Date().toISOString(),
        notes: `Current room operational status: ${status}`,
      }, { onConflict: 'room_id' })
      if (upsertError) throw upsertError
    }

    console.info('[room-status][saved]', { requestId, roomId, roomNumber: room.room_number, status, elapsedMs: Date.now() - startedAt })
    return NextResponse.json({ ok: true, roomId, status, requestId })
  } catch (error: any) {
    console.error('[room-status][error]', { requestId, message: error?.message, code: error?.code, details: error?.details, stack: error?.stack })
    return NextResponse.json({ error: error?.message || 'Unable to update room status.' }, { status: 500 })
  }
}
