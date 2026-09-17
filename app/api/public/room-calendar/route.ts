import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'

export const dynamic = 'force-dynamic'

function validDate(v: string | null) {
  return !!v && /^\d{4}-\d{2}-\d{2}$/.test(v)
}

function overlaps(a: string, b: string, c: string, d: string) {
  return a < d && b > c
}

function addDays(date: string, n: number) {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export async function GET(request: Request) {
  try {
    const p = new URL(request.url).searchParams
    const roomId = p.get('roomId')
    const from = p.get('from')
    const to = p.get('to')

    console.info('[room-calendar][request]', { roomId, from, to })

    if (!roomId || !validDate(from) || !validDate(to) || !from || !to || from >= to) {
      console.warn('[room-calendar][invalid-request]', { roomId, from, to })
      return NextResponse.json({ error: 'Valid room and calendar range are required.' }, { status: 400 })
    }

    const db = createSupabaseAdminClient()

    const [{ data: room, error: roomError }, { data: bookings, error: bookingError }] = await Promise.all([
      db
        .from('rooms')
        .select('id,room_number,status,room_type_id')
        .eq('id', roomId)
        .maybeSingle(),
      // Fetch every booking for this physical room that could overlap the
      // requested calendar range. Do NOT filter by booking status here.
      // Status/payment eligibility is resolved below so a valid paid booking
      // cannot disappear from the calendar because of a query-side filter.
      db
        .from('bookings')
        .select('id,reference,check_in,check_out,status,payment_status,reservation_expires_at,source,customer_id')
        .eq('room_id', roomId)
        .lt('check_in', to)
        .gt('check_out', from)
        .order('check_in', { ascending: true }),
    ])

    if (roomError) throw roomError
    if (bookingError) throw bookingError

    if (!room) {
      console.warn('[room-calendar][room-not-found]', { roomId })
      return NextResponse.json({ error: 'Room not found.' }, { status: 404 })
    }

    console.info('[room-calendar][source]', {
      roomId,
      roomNumber: room.room_number,
      roomStatus: room.status,
      range: { from, to },
      bookingCount: bookings?.length ?? 0,
      bookings: (bookings ?? []).map((b: any) => ({
        id: b.id,
        reference: b.reference,
        check_in: b.check_in,
        check_out: b.check_out,
        status: b.status,
        payment_status: b.payment_status,
        reservation_expires_at: b.reservation_expires_at,
        source: b.source,
      })),
    })

    const rows: any[] = []

    for (let day = from; day < to; day = addDays(day, 1)) {
      const next = addDays(day, 1)

      const active = (bookings ?? []).find((b: any) => {
        if (!overlaps(day, next, b.check_in, b.check_out)) return false

        const paidReservation =
          ['confirmed', 'checked_in'].includes(b.status) && b.payment_status === 'paid'

        const activePendingHold =
          b.status === 'pending' &&
          b.payment_status !== 'paid' &&
          b.reservation_expires_at &&
          new Date(b.reservation_expires_at).getTime() > Date.now()

        return paidReservation || activePendingHold
      })

      let status = 'available'
      if (active) status = active.status === 'pending' ? 'held' : 'booked'
      else if (['maintenance', 'cleaning'].includes(room.status)) status = 'availableSoon'

      rows.push({
        date: day,
        status,
        reference: active?.reference ?? null,
        source: active?.source ?? null,
        check_in: active?.check_in ?? null,
        check_out: active?.check_out ?? null,
      })

      if (active) {
        console.info('[room-calendar][day-taken]', {
          roomId,
          roomNumber: room.room_number,
          date: day,
          status,
          reference: active.reference,
          bookingStatus: active.status,
          paymentStatus: active.payment_status,
          check_in: active.check_in,
          check_out: active.check_out,
        })
      }
    }

    console.info('[room-calendar][result]', {
      roomId,
      roomNumber: room.room_number,
      days: rows.map((d: any) => ({ date: d.date, status: d.status, reference: d.reference })),
      takenDays: rows.filter((d) => d.status === 'booked').map((d) => d.date),
    })

    return NextResponse.json({
      room,
      from,
      to,
      checkInTime: '15:00',
      checkOutTime: '12:00',
      days: rows,
    })
  } catch (e: any) {
    console.error('[room-calendar][error]', {
      message: e?.message,
      code: e?.code,
      details: e?.details,
      stack: e?.stack,
    })

    return NextResponse.json({ error: 'Unable to load room calendar.' }, { status: 500 })
  }
}
