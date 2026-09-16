import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { readSanitizedJson } from '../../../../lib/security/input'

function validDate(value: unknown): value is string { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) }
function overlaps(start: string, end: string, bookingStart: string, bookingEnd: string) { return start < bookingEnd && end > bookingStart }
const HOLD_MINUTES = 10

export async function POST(request: Request) {
  try {
    const authDb = createSupabaseServerClient()
    const { data: { user } } = await authDb.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Please sign in before reserving a room.' }, { status: 401 })

    const body = await readSanitizedJson<{ roomTypeId?: unknown; roomId?: unknown; checkIn?: unknown; checkOut?: unknown; adults?: unknown; children?: unknown; amount?: unknown; specialRequests?: unknown; extraServices?: unknown }>(request)
    const { roomTypeId, roomId, checkIn, checkOut, adults = 2, children = 0, amount, specialRequests, extraServices } = body ?? {}
    if (!roomTypeId || !validDate(checkIn) || !validDate(checkOut) || checkIn >= checkOut) return NextResponse.json({ error: 'Valid room and stay dates are required.' }, { status: 400 })

    const db = createSupabaseAdminClient()
    const [{ data: roomType, error: roomTypeError }, { data: paidBookings, error: bookingsError }] = await Promise.all([
      db.from('room_types').select('id,price').eq('id', roomTypeId).maybeSingle(),
      db.from('bookings').select('id,room_id,check_in,check_out,status,payment_status').in('status', ['confirmed', 'checked_in']).eq('payment_status', 'paid'),
    ])
    if (roomTypeError) throw roomTypeError
    if (bookingsError) throw bookingsError
    if (!roomType) return NextResponse.json({ error: 'That room type could not be found.' }, { status: 404 })

    const existingCustomer = (await db.from('customers').select('id').eq('user_id', user.id).maybeSingle()).data
    let customerId = existingCustomer?.id as string | undefined
    if (!customerId) {
      const normalizedEmail = (user.email ?? '').trim().toLowerCase()
      const { data: emailCustomer } = normalizedEmail ? await db.from('customers').select('id,user_id').ilike('email', normalizedEmail).maybeSingle() : { data: null as any }
      if (emailCustomer && (!emailCustomer.user_id || emailCustomer.user_id === user.id)) {
        customerId = emailCustomer.id
        if (!emailCustomer.user_id) await db.from('customers').update({ user_id: user.id }).eq('id', customerId).is('user_id', null)
      }
    }
    if (!customerId) {
      customerId = `c_${Date.now()}`
      const { error } = await db.from('customers').insert({ id: customerId, user_id: user.id, name: user.user_metadata?.name || user.user_metadata?.full_name || '', email: user.email ?? '', phone: user.user_metadata?.phone || '' })
      if (error) throw error
    }

    await db.from('bookings').update({ status: 'cancelled' }).eq('customer_id', customerId).eq('status', 'pending').neq('payment_status', 'paid').not('reservation_expires_at', 'is', null).lte('reservation_expires_at', new Date().toISOString())

    const { data: existingReservations } = await db.from('bookings').select('id,reference,room_id,check_in,check_out,reservation_expires_at').eq('customer_id', customerId).eq('status', 'pending').neq('payment_status', 'paid')
    if ((existingReservations ?? []).length) {
      const current = (existingReservations ?? []).find(b => !b.reservation_expires_at || new Date(b.reservation_expires_at).getTime() > Date.now())
      if (current) return NextResponse.json({ booking: current, alreadyReserved: true, error: 'You already have a pending room reservation. Complete it or wait for its hold to expire before reserving another room.' }, { status: 409 })
    }

    let selectedRoomId: string | null = roomId ? String(roomId) : null
    const { data: rooms } = await db.from('rooms').select('id,status,room_type_id,payment_lock_booking_id,payment_lock_expires_at').eq('room_type_id', roomTypeId).order('room_number')
    let selectedRoom = selectedRoomId ? (rooms ?? []).find(r => r.id === selectedRoomId) : null
    if (selectedRoomId && !selectedRoom) return NextResponse.json({ error: 'That room could not be found.' }, { status: 404 })

    if (selectedRoomId) {
      const paidConflict = (paidBookings ?? []).some(b => b.room_id === selectedRoomId && overlaps(checkIn, checkOut, b.check_in, b.check_out))
      if (paidConflict) return NextResponse.json({ code: 'ROOM_SOLD', error: 'This room has just been taken by another guest. Please try this room again in a few seconds or deliberately choose another room.' }, { status: 409 })

      const paymentLockActive = Boolean(selectedRoom?.payment_lock_expires_at && new Date(selectedRoom.payment_lock_expires_at).getTime() > Date.now())
      if (paymentLockActive) return NextResponse.json({ code: 'PAYMENT_IN_PROGRESS', error: 'Another guest is currently paying for this room. Please try again in a few seconds.' }, { status: 409 })
    } else {
      selectedRoom = (rooms ?? []).find(room => room.status === 'available' && !room.payment_lock_expires_at && !(paidBookings ?? []).some(b => b.room_id === room.id && overlaps(checkIn, checkOut, b.check_in, b.check_out))) ?? null
      selectedRoomId = selectedRoom?.id ?? null
    }

    const roomIsCurrentlyAvailable = selectedRoom?.status === 'available' && !selectedRoom?.payment_lock_expires_at
    const reservationExpiresAt = roomIsCurrentlyAvailable ? new Date(Date.now() + HOLD_MINUTES * 60 * 1000).toISOString() : null
    const reference = `BPH-${Math.floor(24900 + Math.random() * 900)}`
    const { data: booking, error: bookingError } = await db.from('bookings').insert({
      id: `b_${Date.now()}`,
      reference,
      customer_id: customerId,
      room_type_id: roomTypeId,
      room_id: selectedRoomId,
      check_in: checkIn,
      check_out: checkOut,
      adults: Number(adults) || 2,
      children: Number(children) || 0,
      amount: Number(amount) || Number(roomType.price) * Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)),
      payment_status: 'pending',
      status: 'pending',
      reservation_expires_at: reservationExpiresAt,
      special_requests: typeof specialRequests === 'string' ? specialRequests || null : null,
      extra_services: Array.isArray(extraServices) ? extraServices : [],
    }).select('id,reference,room_id,reservation_expires_at,status').single()
    if (bookingError) throw bookingError
    return NextResponse.json({ booking, holdMinutes: HOLD_MINUTES, holdStarted: Boolean(reservationExpiresAt) }, { status: 201 })
  } catch (error: any) {
    console.error('[public-reservation]', error)
    if (error?.message === 'REQUEST_BODY_TOO_LARGE') return NextResponse.json({ error: 'Request is too large.' }, { status: 413 })
    return NextResponse.json({ error: 'Unable to reserve this room right now.' }, { status: 500 })
  }
}
