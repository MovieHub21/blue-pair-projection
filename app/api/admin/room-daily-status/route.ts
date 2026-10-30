import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { notifyRoomTask } from '../../../../lib/roomTaskNotifications'

export const dynamic = 'force-dynamic'

const STATUSES = ['available', 'cleaning_required', 'cleaning', 'maintenance', 'available_soon'] as const

async function staff() {
  const auth = createSupabaseServerClient()
  const { data: { user }, error: authError } = await auth.auth.getUser()
  if (!user) return { allowed: false, reason: 'not-authenticated' }
  const db = createSupabaseAdminClient()
  const { data, error } = await db.from('user_roles').select('role').eq('user_id', user.id)
  const roles = (data ?? []).map((r: any) => String(r.role))
  const allowed = roles.some((role) => ['super_admin', 'manager', 'reception', 'housekeeping', 'maintenance'].includes(role))
  console.info('[BP-DIAG][room-status][auth]', { authenticated: true, userId: user.id, roles, allowed, authError: authError?.message ?? null, queryError: error?.message ?? null })
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
    const { data: room, error: roomError } = await db.from('rooms').select('id,room_number,status,room_type_id').eq('id', roomId).maybeSingle()
    if (roomError) throw roomError
    if (!room) return NextResponse.json({ error: 'Room not found.' }, { status: 404 })

    console.info('[BP-DIAG][room-status][update]', { requestId, roomId, roomNumber: room.room_number, from: room.status, to: status })

    let taskNotification: { department: 'housekeeping' | 'maintenance'; id: string } | null = null
    if (status === 'maintenance' || status === 'available_soon') {
      const { error } = await db.from('rooms').update({ status }).eq('id', roomId)
      if (error) throw error
      await db.from('room_daily_statuses').delete().eq('room_id', roomId)
      if (status === 'maintenance') {
        const { data: ticket, error: ticketError } = await db.from('maintenance_tickets').select('id,room').eq('room', room.room_number).not('status', 'in', '(resolved,closed,completed)').order('date_reported', { ascending: false }).limit(1).maybeSingle()
        if (ticketError) throw ticketError
        if (ticket) taskNotification = { department: 'maintenance', id: ticket.id }
        else {
          const { data: created, error: createError } = await db.from('maintenance_tickets').insert({ room: room.room_number, issue: 'Room marked for maintenance', priority: 'Medium', assigned_to: 'Unassigned', date_reported: new Date().toISOString().slice(0, 10), status: 'open', notes: 'Created when room status was changed to maintenance.' }).select('id').maybeSingle()
          if (createError) throw createError
          if (created) taskNotification = { department: 'maintenance', id: created.id }
        }
      }
    } else if (status === 'available') {
      const { error } = await db.from('rooms').update({ status: 'available' }).eq('id', roomId)
      if (error) throw error
      const { error: clearError } = await db.from('room_daily_statuses').delete().eq('room_id', roomId)
      if (clearError) throw clearError
      const { error: resolveError } = await db.from('maintenance_tickets').update({ status: 'resolved' }).eq('room', room.room_number).not('status', 'in', '(resolved,closed,completed)')
      if (resolveError) throw resolveError
    } else {
      const operationalStatus = 'cleaning_required'
      const { error: upsertError } = await db.from('room_daily_statuses').upsert({
        room_id: roomId,
        status: operationalStatus,
        status_date: null,
        updated_at: new Date().toISOString(),
        notes: 'Room requires housekeeping. Waiting for a cleaner to accept or reception to assign.',
      }, { onConflict: 'room_id' })
      if (upsertError) throw upsertError
      const { data: existing, error: existingError } = await db.from('housekeeping_tasks').select('id').eq('room_id', roomId).neq('status', 'completed').maybeSingle()
      if (existingError) throw existingError
      if (!existing) {
        const { data: roomType } = await db.from('room_types').select('name').eq('id', room.room_type_id).maybeSingle()
        const { data: task, error: taskError } = await db.from('housekeeping_tasks').insert({ id: `hk_${crypto.randomUUID()}`, room: room.room_number, room_type: roomType?.name || '', checkout_time: new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }), priority: 'High', assigned_to: 'Unassigned', status: 'pending', notes: 'Room manually marked for cleaning.', room_id: roomId }).select('id').maybeSingle()
        if (taskError) {
          // A concurrent room update may have created the task after the check above.
          const activeTask = await db.from('housekeeping_tasks').select('id').eq('room_id', roomId).neq('status', 'completed').maybeSingle()
          if (activeTask.error || !activeTask.data) throw taskError
          taskNotification = { department: 'housekeeping', id: activeTask.data.id }
        } else if (task?.id) {
          taskNotification = { department: 'housekeeping', id: task.id }
        }
      }
    }

    if (taskNotification?.department === 'housekeeping') {
      await notifyRoomTask({ admin: db, department: 'housekeeping', subject: `Room ${room.room_number} needs cleaning`, html: `<div style="font-family:Arial,sans-serif"><h2>New housekeeping task</h2><p>Room <strong>${room.room_number}</strong> is waiting for a cleaner.</p><p>A cleaner can accept the task, or reception can assign it from the Housekeeping portal.</p></div>`, text: `Room ${room.room_number} needs cleaning. A cleaner can accept the task or reception can assign it.`, dedupeKey: `housekeeping-task:${taskNotification.id}` })
    }
    if (taskNotification?.department === 'maintenance') {
      await notifyRoomTask({ admin: db, department: 'maintenance', subject: `Maintenance required — Room ${room.room_number}`, html: `<div style="font-family:Arial,sans-serif"><h2>New maintenance task</h2><p>Room <strong>${room.room_number}</strong> has been marked for maintenance.</p><p>A maintenance staff member can accept it, or reception can assign it from the Maintenance portal.</p></div>`, text: `Room ${room.room_number} has been marked for maintenance. A staff member can accept it or reception can assign it.`, dedupeKey: `maintenance-task:${taskNotification.id}` })
    }

    const { data: verifiedRoom, error: verifyError } = await db.from('rooms').select('id,room_number,status').eq('id',roomId).maybeSingle()
    console.info('[BP-DIAG][room-status][saved]', { requestId, roomId, roomNumber: room.room_number, requestedStatus: status, verifiedDbStatus: verifiedRoom?.status ?? null, verifyError: verifyError?.message ?? null, elapsedMs: Date.now() - startedAt })
    return NextResponse.json({ ok: true, roomId, status, requestId })
  } catch (error: any) {
    console.error('[BP-DIAG][room-status][error]', { requestId, message: error?.message, code: error?.code, details: error?.details, stack: error?.stack })
    return NextResponse.json({ error: error?.message || 'Unable to update room status.' }, { status: 500 })
  }
}
