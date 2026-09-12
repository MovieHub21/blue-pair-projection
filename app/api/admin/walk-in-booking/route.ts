import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'

const STAFF_ROLES = new Set(['super_admin', 'manager', 'reception'])

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function makeReference() {
  return `BPH-${Math.floor(24900 + Math.random() * 900)}`
}

export async function POST(request: Request) {
  try {
    const server = createSupabaseServerClient()
    const { data: { user } } = await server.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

    const { data: roleRows } = await server.from('user_roles').select('role').eq('user_id', user.id)
    if (!(roleRows ?? []).some((row: any) => STAFF_ROLES.has(row.role))) {
      return NextResponse.json({ error: 'Only reception, managers and super admins can create walk-in bookings.' }, { status: 403 })
    }

    const body = await request.json()
    const name = String(body.name ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const phone = String(body.phone ?? '').trim()
    const roomTypeId = String(body.roomTypeId ?? '').trim()
    const checkIn = String(body.checkIn ?? '').trim()
    const checkOut = String(body.checkOut ?? '').trim()
    const adults = Number(body.adults)
    const children = Number(body.children ?? 0)
    const specialRequests = String(body.specialRequests ?? '').trim()

    if (!name || !email || !phone || !roomTypeId || !isValidDate(checkIn) || !isValidDate(checkOut)) {
      return NextResponse.json({ error: 'Name, email, phone, room and valid dates are required.' }, { status: 400 })
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      return NextResponse.json({ error: 'Check-out must be after check-in.' }, { status: 400 })
    }
    if (!Number.isInteger(adults) || adults < 1 || !Number.isInteger(children) || children < 0) {
      return NextResponse.json({ error: 'Guest counts are invalid.' }, { status: 400 })
    }

    const admin = createSupabaseAdminClient()
    const { data: room, error: roomError } = await admin
      .from('room_types')
      .select('id,name,price,guests,active')
      .eq('id', roomTypeId)
      .maybeSingle()

    if (roomError) throw roomError
    if (!room || !room.active) return NextResponse.json({ error: 'That room type is unavailable.' }, { status: 400 })
    if (adults > Number(room.guests)) return NextResponse.json({ error: `This room allows up to ${room.guests} adults.` }, { status: 400 })

    const start = new Date(`${checkIn}T00:00:00Z`)
    const end = new Date(`${checkOut}T00:00:00Z`)
    const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000))
    const subtotal = Number(room.price) * nights
    const tax = Math.round(subtotal * 0.075)
    const amount = subtotal + tax

    let customerId: string
    const { data: existingCustomer, error: customerLookupError } = await admin
      .from('customers')
      .select('id')
      .ilike('email', email)
      .maybeSingle()
    if (customerLookupError) throw customerLookupError

    if (existingCustomer) {
      customerId = existingCustomer.id
      const { error } = await admin.from('customers').update({ name, phone }).eq('id', customerId)
      if (error) throw error
    } else {
      customerId = `c_${Date.now()}`
      const { error } = await admin.from('customers').insert({
        id: customerId,
        user_id: null,
        name,
        email,
        phone,
        status: 'active',
      })
      if (error) throw error
    }

    let reference = makeReference()
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: existing } = await admin.from('bookings').select('id').eq('reference', reference).maybeSingle()
      if (!existing) break
      reference = makeReference()
    }

    const bookingId = `b_${Date.now()}`
    const { data: booking, error: bookingError } = await admin
      .from('bookings')
      .insert({
        id: bookingId,
        reference,
        customer_id: customerId,
        room_type_id: roomTypeId,
        room_id: null,
        check_in: checkIn,
        check_out: checkOut,
        adults,
        children,
        amount,
        payment_status: 'pending',
        status: 'pending',
        special_requests: specialRequests || null,
        source: 'walk_in',
        created_by: user.id,
      })
      .select('*')
      .single()

    if (bookingError) throw bookingError

    return NextResponse.json({
      booking,
      customer: { id: customerId, name, email, phone },
      totals: { nights, subtotal, tax, amount },
    }, { status: 201 })
  } catch (error: any) {
    console.error('[walk-in-booking]', error)
    return NextResponse.json({ error: error?.message || 'Unable to create walk-in booking.' }, { status: 500 })
  }
}
