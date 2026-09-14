import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'

function validDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function overlaps(start: string, end: string, bookingStart: string, bookingEnd: string) {
  return start < bookingEnd && end > bookingStart
}

export async function POST(request: Request) {
  try {
    const authDb = createSupabaseServerClient()
    const { data: { user } } = await authDb.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Please sign in before reserving a room.' }, { status: 401 })

    const body = await request.json()
    const { roomTypeId, roomId, checkIn, checkOut, adults = 2, children = 0, amount } = body ?? {}
    if (!roomTypeId || !validDate(checkIn) || !validDate(checkOut) || checkIn >= checkOut) {
      return NextResponse.json({ error: 'Valid room and stay dates are required.' }, { status: 400 })
    }

    const db = createSupabaseAdminClient()
    const [{ data: roomType, error: roomTypeError }, { data: paidBookings, error: bookingsError }] = await Promise.all([
      db.from('room_types').select('id,price').eq('id', roomTypeId).maybeSingle(),
      db.from('bookings').select('id,room_id,check_in,check_out,status,payment_status').in('status', ['confirmed', 'checked_in']).eq('payment_status', 'paid'),
    ])
    if (roomTypeError) throw roomTypeError
    if (bookingsError) throw bookingsError
    if (!roomType) return NextResponse.json({ error: 'That room type could not be found.' }, { status: 404 })

    const { data: existingCustomer } = await db.from('customers').select('id').eq('user_id', user.id).maybeSingle()
    let customerId = existingCustomer?.id as string | undefined

    if (!customerId) {
      const normalizedEmail = (user.email ?? '').trim().toLowerCase()
      const { data: emailCustomer } = normalizedEmail
        ? await db.from('customers').select('id,user_id').ilike('email', normalizedEmail).maybeSingle()
        : { data: null as any }
      if (emailCustomer && (!emailCustomer.user_id || emailCustomer.user_id === user.id)) {
        customerId = emailCustomer.id
        if (!emailCustomer.user_id) await db.from('customers').update({ user_id: user.id }).eq('id', customerId).is('user_id', null)
      }
    }

    if (!customerId) {
      customerId = `c_${Date.now()}`
      const { error } = await db.from('customers').insert({
        id: customerId,
        user_id: user.id,
        name: user.user_metadata?.name || user.user_metadata?.full_name || '',
        email: user.email ?? '',
        phone: user.user_metadata?.phone || '',
      })
      if (error) throw error
    }

    const { data: existingReservation } = await db.from('bookings')
      .select('id,reference')
      .eq('customer_id', customerId)
      .eq('room_type_id', roomTypeId)
      .eq('status', 'pending')
      .neq('payment_status', 'paid')
      .gte('check_out', checkIn)
      .lte('check_in', checkOut)
      .limit(1)
      .maybeSingle()
    if (existingReservation) return NextResponse.json({ booking: existingReservation, alreadyReserved: true }, { status: 200 })

    let selectedRoomId: string | null = roomId || null
    const { data: rooms } = await db.from('rooms').select('id,status,room_type_id').eq('room_type_id', roomTypeId).order('room_number')

    if (selectedRoomId) {
      const room = (rooms ?? []).find(r => r.id === selectedRoomId)
      if (!room) return NextResponse.json({ error: 'That room could not be found.' }, { status: 404 })
      const paidConflict = (paidBookings ?? []).some(b => b.room_id === selectedRoomId && overlaps(checkIn, checkOut, b.check_in, b.check_out))
      if (paidConflict) return NextResponse.json({ error: 'That room has just been secured by another guest. Please choose another room.' }, { status: 409 })
    } else {
      const freeRoom = (rooms ?? []).find(room => room.status === 'available' && !(paidBookings ?? []).some(b => b.room_id === room.id && overlaps(checkIn, checkOut, b.check_in, b.check_out)))
      selectedRoomId = freeRoom?.id ?? null
    }

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
    }).select('id,reference,room_id').single()

    if (bookingError) throw bookingError
    return NextResponse.json({ booking }, { status: 201 })
  } catch (error: any) {
    console.error('[public-reservation]', error)
    return NextResponse.json({ error: error?.message || 'Unable to reserve this room right now.' }, { status: 500 })
  }
}
