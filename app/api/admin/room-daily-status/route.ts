import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'

export const dynamic = 'force-dynamic'

const DAILY_STATUSES = ['available', 'cleaning', 'available_soon'] as const
const STATUSES = [...DAILY_STATUSES, 'maintenance'] as const

async function staff() {
  const auth = createSupabaseServerClient()
  const { data: { user }, error: authError } = await auth.auth.getUser()

  console.info('[room-daily-status][auth]', {
    authenticated: !!user,
    userId: user?.id ?? null,
    authError: authError?.message ?? null,
  })

  if (!user) return { allowed: false, reason: 'not-authenticated' }

  const db = createSupabaseAdminClient()
  const { data, error } = await db
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  const roles = (data ?? []).map((r: any) => String(r.role))
  const allowed = roles.some((role) =>
    ['super_admin', 'manager', 'reception', 'housekeeping'].includes(role),
  )

  console.info('[room-daily-status][roles]', {
    userId: user.id,
    roles,
    allowed,
    queryError: error?.message ?? null,
  })

  return { allowed, reason: allowed ? 'role-allowed' : 'role-not-allowed' }
}

export async function POST(request: Request) {
  const requestId = `status_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  const startedAt = Date.now()

  try {
    console.info('[room-daily-status][start]', {
      requestId,
      method: request.method,
      url: request.url,
      receivedAt: new Date().toISOString(),
    })

    const access = await staff()
    console.info('[room-daily-status][access]', { requestId, ...access })

    if (!access.allowed) {
      console.warn('[room-daily-status][denied]', { requestId, reason: access.reason })
      return NextResponse.json({ error: 'Not allowed.' }, { status: 403 })
    }

    const body = await request.json().catch((error) => {
      console.error('[room-daily-status][body-parse-error]', {
        requestId,
        message: error?.message,
      })
      return {}
    })
    const roomId = String(body.roomId || '')
    const date = String(body.statusDate || '')
    const status = String(body.status || '')

    console.info('[room-daily-status][parsed]', {
      requestId,
      roomId,
      date,
      status,
    })

    if (
      !roomId ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !STATUSES.includes(status as any)
    ) {
      console.warn('[room-daily-status][validation-failed]', {
        requestId,
        roomId,
        date,
        status,
      })
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

    if (roomError) {
      console.error('[room-daily-status][room-query-error]', {
        requestId,
        message: roomError.message,
        code: roomError.code,
        details: roomError.details,
      })
      throw roomError
    }
    if (!room) {
      console.warn('[room-daily-status][room-not-found]', { requestId, roomId })
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
      console.info('[room-daily-status][db-update-room]', {
        requestId,
        roomId,
        from: room.status,
        to: 'maintenance',
      })

      const { error } = await db
        .from('rooms')
        .update({ status: 'maintenance' })
        .eq('id', roomId)

      if (error) {
        console.error('[room-daily-status][db-update-room-error]', {
          requestId,
          message: error.message,
          code: error.code,
          details: error.details,
        })
        throw error
      }

      console.info('[room-daily-status][db-update-room-ok]', { requestId, roomId })

      // A maintenance room is blocked indefinitely. Remove only the selected
      // day's temporary override so it cannot conflict with maintenance.
      const { error: deleteError } = await db
        .from('room_daily_statuses')
        .delete()
        .eq('room_id', roomId)
        .eq('status_date', date)

      if (deleteError) {
        console.error('[room-daily-status][db-delete-daily-error]', {
          requestId,
          message: deleteError.message,
          code: deleteError.code,
          details: deleteError.details,
        })
        throw deleteError
      }
      console.info('[room-daily-status][db-delete-daily-ok]', { requestId, roomId, date })
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

        if (error) {
          console.error('[room-daily-status][db-delete-override-error]', {
            requestId,
            message: error.message,
            code: error.code,
            details: error.details,
          })
          throw error
        }
        console.info('[room-daily-status][db-delete-override-ok]', { requestId, roomId, date })
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

        if (error) {
          console.error('[room-daily-status][db-upsert-error]', {
            requestId,
            message: error.message,
            code: error.code,
            details: error.details,
          })
          throw error
        }
        console.info('[room-daily-status][db-upsert-ok]', { requestId, roomId, date, status })
      }

      // Leaving maintenance releases the indefinite room block.
      if (room.status === 'maintenance') {
        const { error } = await db
          .from('rooms')
          .update({ status: 'available' })
          .eq('id', roomId)

        if (error) {
          console.error('[room-daily-status][db-release-maintenance-error]', {
            requestId,
            message: error.message,
            code: error.code,
            details: error.details,
          })
          throw error
        }
        console.info('[room-daily-status][db-release-maintenance-ok]', { requestId, roomId })
      }
    }

    console.info('[room-daily-status][saved]', {
      roomId,
      roomNumber: room.room_number,
      date,
      status,
      elapsedMs: Date.now() - startedAt,
      requestId,
    })

    return NextResponse.json({ ok: true, roomId, date, status, requestId })
  } catch (error: any) {
    console.error('[room-daily-status][error]', {
      requestId,
      elapsedMs: Date.now() - startedAt,
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
