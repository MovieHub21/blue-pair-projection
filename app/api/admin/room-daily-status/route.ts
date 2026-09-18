import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'

export const dynamic = 'force-dynamic'

const DAILY_STATUSES = ['available', 'cleaning', 'available_soon'] as const
const STATUSES = [...DAILY_STATUSES, 'maintenance'] as const

async function staff() {
  const auth = createSupabaseServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return false

  const db = createSupabaseAdminClient()
  const { data } = await db
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  return (data ?? []).some((r: any) =>
    ['super_admin', 'manager', 'reception', 'housekeeping'].includes(String(r.role)),
  )
}

export async function POST(request: Request) {
  try {
    if (!(await staff())) {
      return NextResponse.json({ error: 'Not allowed.' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const roomId = String(body.roomId || '')
    const date = String(body.statusDate || '')
    const status = String(body.status || '')

    if (
      !roomId ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !STATUSES.includes(status as any)
    ) {
      return NextResponse.json(
        { error: 'Room, date and valid room status are required.' },
        { status: 400 },
      )
    }

    const db = createSupabaseAdminClient()
    const { data: room, error: roomError } = await db
      .from('rooms')
      .select('id,room_number,status')
      .eq('id', roomId)
      .maybeSingle()

    if (roomError) throw roomError
    if (!room) {
      return NextResponse.json({ error: 'Room not found.' }, { status: 404 })
    }

    console.info('[room-daily-status][request]', {
      roomId,
      roomNumber: room.room_number,
      date,
      status,
      previousPhysicalStatus: room.status,
    })

    if (status === 'maintenance') {
      const { error } = await db
        .from('rooms')
        .update({ status: 'maintenance' })
        .eq('id', roomId)

      if (error) throw error

      // A maintenance room is blocked indefinitely. Remove only the selected
      // day's temporary override so it cannot conflict with maintenance.
      const { error: deleteError } = await db
        .from('room_daily_statuses')
        .delete()
        .eq('room_id', roomId)
        .eq('status_date', date)

      if (deleteError) throw deleteError
    } else {
      // "Available" means there is no date-specific override.
      // Deleting the row is important: an old Available Soon/Cleaning row
      // must not continue to make the room unavailable.
      if (status === 'available') {
        const { error } = await db
          .from('room_daily_statuses')
          .delete()
          .eq('room_id', roomId)
          .eq('status_date', date)

        if (error) throw error
      } else {
        const { error } = await db
          .from('room_daily_statuses')
          .upsert(
            {
              room_id: roomId,
              status,
              status_date: date,
              updated_at: new Date().toISOString(),
              notes: `Admin daily status: ${status}`,
            },
            { onConflict: 'room_id,status_date' },
          )

        if (error) throw error
      }

      // Leaving maintenance releases the indefinite room block.
      if (room.status === 'maintenance') {
        const { error } = await db
          .from('rooms')
          .update({ status: 'available' })
          .eq('id', roomId)

        if (error) throw error
      }
    }

    console.info('[room-daily-status][saved]', {
      roomId,
      roomNumber: room.room_number,
      date,
      status,
    })

    return NextResponse.json({ ok: true, roomId, date, status })
  } catch (error: any) {
    console.error('[room-daily-status][error]', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      stack: error?.stack,
    })

    return NextResponse.json(
      { error: error?.message || 'Unable to update room status.' },
      { status: 500 },
    )
  }
}
