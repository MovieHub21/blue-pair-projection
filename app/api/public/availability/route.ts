import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'

function validDate(value: string | null) { return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) }
function overlaps(start: string, end: string, bookingStart: string, bookingEnd: string) { return start < bookingEnd && end > bookingStart }

function guestStatus(room: any, bookings: any[], checkIn: string, checkOut: string) {
  const paid = bookings.filter(b => ['confirmed', 'checked_in'].includes(b.status) && b.payment_status === 'paid')
  const overlapping = paid.filter(b => overlaps(checkIn, checkOut, b.check_in, b.check_out))
  if (overlapping.length) {
    const latest = overlapping.reduce((a, b) => a.check_out > b.check_out ? a : b)
    return { status: 'taken', availableFrom: latest.check_out }
  }

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })
  const current = paid.filter(b => b.check_in <= today && b.check_out > today).sort((a, b) => b.check_out.localeCompare(a.check_out))[0]
  if (current) {
    if (current.check_out < checkIn) return { status: 'available', availableFrom: current.check_out }
    return { status: 'availableSoon', availableFrom: current.check_out }
  }

  if (room.status === 'available') return { status: 'available', availableFrom: checkIn }
  return { status: 'availableSoon', availableFrom: null }
}

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams
    const checkIn = params.get('checkin'); const checkOut = params.get('checkout'); const roomTypeId = params.get('roomTypeId')
    if (!validDate(checkIn) || !validDate(checkOut) || !checkIn || !checkOut || checkIn >= checkOut) return NextResponse.json({ error: 'Valid check-in and check-out dates are required.' }, { status: 400 })

    const db = createSupabaseAdminClient()
    let roomsQuery = db.from('rooms').select('id,room_number,room_type_id,name,slug,status,image_url,floor').order('room_number')
    if (roomTypeId) roomsQuery = roomsQuery.eq('room_type_id', roomTypeId)
    const [{ data: rooms, error: roomsError }, { data: bookings, error: bookingsError }] = await Promise.all([
      roomsQuery,
      db.from('bookings').select('id,customer_id,room_id,room_type_id,check_in,check_out,status,payment_status').in('status', ['pending', 'confirmed', 'checked_in']),
    ])
    if (roomsError) throw roomsError
    if (bookingsError) throw bookingsError

    let currentCustomerId: string | null = null
    try {
      const authDb = createSupabaseServerClient()
      const { data: { user } } = await authDb.auth.getUser()
      if (user) {
        const { data: customer } = await db.from('customers').select('id').eq('user_id', user.id).maybeSingle()
        currentCustomerId = customer?.id ?? null
      }
    } catch { /* Availability remains public when the visitor is signed out. */ }

    const ownReservations = currentCustomerId
      ? (bookings ?? []).filter(b => b.customer_id === currentCustomerId && b.status === 'pending' && b.payment_status !== 'paid' && overlaps(checkIn, checkOut, b.check_in, b.check_out) && b.room_id)
      : []
    const readyIds = new Set<string>()
    if (ownReservations.length) {
      const { data: readyLogs } = await db.from('email_logs').select('booking_id').eq('event', 'reservation_ready').in('booking_id', ownReservations.map(b => b.id))
      for (const log of readyLogs ?? []) if (log.booking_id) readyIds.add(log.booking_id)
    }

    const result = (rooms ?? []).map(room => {
      const roomBookings = (bookings ?? []).filter(b => b.room_id === room.id)
      const state = guestStatus(room, roomBookings, checkIn, checkOut)
      const ownReservation = ownReservations.find(b => b.room_id === room.id)
      if (ownReservation) return {
        ...room,
        guest_status: 'reserved',
        available_from: state.availableFrom,
        reservation_id: ownReservation.id,
        payment_ready: readyIds.has(ownReservation.id),
      }
      return { ...room, guest_status: state.status, available_from: state.availableFrom, payment_ready: false }
    })

    const byType: Record<string, { available: number; availableSoon: number; taken: number; reserved: number; earliestAvailable: string | null }> = {}
    for (const room of result) {
      const row = byType[room.room_type_id] ?? { available: 0, availableSoon: 0, taken: 0, reserved: 0, earliestAvailable: null }
      if (room.guest_status === 'available') row.available++
      else if (room.guest_status === 'availableSoon') row.availableSoon++
      else if (room.guest_status === 'reserved') row.reserved++
      else row.taken++
      if (room.available_from && (!row.earliestAvailable || room.available_from < row.earliestAvailable)) row.earliestAvailable = room.available_from
      byType[room.room_type_id] = row
    }
    return NextResponse.json({ checkIn, checkOut, rooms: result, byType })
  } catch (error: any) {
    console.error('[public-availability]', error)
    return NextResponse.json({ error: error?.message || 'Unable to check availability.' }, { status: 500 })
  }
}
