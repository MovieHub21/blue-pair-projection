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

    let selectedRoomId: string | null = roomId || null
    if (selectedRoomId) {
      const { data: room } = await db.from('rooms').select('id,room_type_id,status').eq('id', selectedRoomId).maybeSingle()
      if (!room || room.room_type_id !== roomTypeId) return NextResponse.json({ error: 'That room is no longer available.' }, { status: 409 })
      const conflict = (paidBookings ?? []).some(b => b.room_id === selectedRoomId && overlaps(checkIn, checkOut, b.check_in, b.check_out))
      if (conflict) return NextResponse.json({ error: 'That room has just been secured by another guest. Please choose another room.' }, { status: 409 })
    } else {
      const { data: rooms } = await db.from('rooms').select('id,status').eq('room_type_id', roomTypeId).order('room_number')
      const freeRoom = (rooms ?? []).find(room => room.status === 'available' && !(paidBookings ?? []).some(b => b.room_id === room.id && overlaps(checkIn, checkOut, b.check_in, b.check_out)))
      selectedRoomId = freeRoom?.id ?? null
    }

    const { data: existingCustomer } = await db.from('customers').select('id').eq('user_id', user.id).maybeSingle()
    let customerId = existingCustomer?.id as string | undefined

    if (!customerId) {
      const normalizedEmail = (user.email ?? '').trim().toLowerCase()
      const { data: emailCustomer } = normalizedEmail
        ? await db.from('customers').select('id,user_id').ilike('email', normalizedEmail).maybeSingle()
        : { data: null as any }
      if (emailCustomer && (!emailCustomer.user_id || emailCustomer.user_id === user.id)) {
        customerId = emailCustomer.id
        if (!emailCustomer.user_id) {
          await db.from('customers').update({ user_id: user.id }).eq('id', customerId).is('user_id', null)
        }
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
    }).select('id,reference').single()

    if (bookingError) throw bookingError
    return NextResponse.json({ booking }, { status: 201 })
  } catch (error: any) {
    console.error('[public-reservation]', error)
    return NextResponse.json({ error: error?.message || 'Unable to reserve this room right now.' }, { status: 500 })
  }
}
