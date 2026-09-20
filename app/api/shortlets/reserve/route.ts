import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'

function validDate(v: unknown): v is string { return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) }

export async function POST(request: Request) {
  try {
    const server = createSupabaseServerClient()
    const { data: { user } } = await server.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

    const body = await request.json()
    const shortLetId = String(body.shortLetId || '').trim()
    const customerId = String(body.customerId || '').trim()
    const checkIn = String(body.checkIn || '').trim()
    const checkOut = String(body.checkOut || '').trim()
    const adults = Number(body.adults)
    const children = Number(body.children || 0)
    if (!shortLetId || !customerId || !validDate(checkIn) || !validDate(checkOut) || checkIn >= checkOut) return NextResponse.json({ error: 'Valid property and stay dates are required.' }, { status: 400 })
    if (!Number.isInteger(adults) || adults < 1 || !Number.isInteger(children) || children < 0) return NextResponse.json({ error: 'Guest counts are invalid.' }, { status: 400 })

    const admin = createSupabaseAdminClient()
    const { data: customer } = await admin.from('customers').select('id,user_id').eq('id', customerId).maybeSingle()
    if (!customer || customer.user_id !== user.id) return NextResponse.json({ error: 'You are not allowed to create this booking.' }, { status: 403 })

    const { data: property } = await admin.from('short_lets').select('id,price,available').eq('id', shortLetId).maybeSingle()
    if (!property) return NextResponse.json({ error: 'Short-let property not found.' }, { status: 404 })
    if (!property.available) return NextResponse.json({ error: 'This short-let is currently unavailable.', code: 'SHORTLET_NOT_AVAILABLE' }, { status: 409 })

    const nights = Math.max(1, Math.round((new Date(checkOut + 'T00:00:00Z').getTime() - new Date(checkIn + 'T00:00:00Z').getTime()) / 86400000))
    const subtotal = Number(property.price) * nights
    const amount = subtotal + Math.round(subtotal * 0.075)

    const { data, error } = await admin.rpc('claim_short_let_reservation', {
      p_customer_id: customerId,
      p_short_let_id: shortLetId,
      p_check_in: checkIn,
      p_check_out: checkOut,
      p_adults: adults,
      p_children: children,
      p_amount: amount,
      p_special_requests: null,
      p_source: 'online',
      p_created_by: null,
    })
    if (error) {
      const code = error.message.includes('SHORTLET_SOLD') ? 'SHORTLET_SOLD' : error.message.includes('SHORTLET_NOT_AVAILABLE') ? 'SHORTLET_NOT_AVAILABLE' : 'SHORTLET_UNAVAILABLE'
      return NextResponse.json({ error: code === 'SHORTLET_SOLD' ? 'This short-let has already been booked for those dates.' : error.message, code }, { status: 409 })
    }
    const booking = Array.isArray(data) ? data[0] : data
    return NextResponse.json({ bookingId: booking.id, reference: booking.reference, amount, reservationExpiresAt: booking.reservation_expires_at })
  } catch (error:any) {
    console.error('[shortlet-reserve]', error)
    return NextResponse.json({ error: error?.message || 'Unable to reserve this short-let.' }, { status: 500 })
  }
}
