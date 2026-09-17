import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { readSanitizedJson } from '../../../../lib/security/input'

function validDate(value: unknown): value is string { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) }
function todayLagosISO(): string { return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' }) }
const HOLD_MINUTES = 10

export async function POST(request: Request) {
  try {
    const authDb = createSupabaseServerClient()
    const { data: { user } } = await authDb.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Please sign in before starting payment.' }, { status: 401 })
    const body = await readSanitizedJson<{ roomTypeId?: unknown; roomId?: unknown; checkIn?: unknown; checkOut?: unknown; adults?: unknown; children?: unknown; amount?: unknown; specialRequests?: unknown; extraServices?: unknown }>(request)
    const { roomTypeId, roomId, checkIn, checkOut, adults = 2, children = 0, amount, specialRequests, extraServices } = body ?? {}
    const today = todayLagosISO()
    if (!roomTypeId || !validDate(checkIn) || !validDate(checkOut) || checkIn < today || checkIn >= checkOut || checkOut <= today) return NextResponse.json({ error: 'Please choose valid future check-in and check-out dates.' }, { status: 400 })

    const db = createSupabaseAdminClient()
    const { data: roomType, error: roomTypeError } = await db.from('room_types').select('id,price').eq('id', roomTypeId).maybeSingle()
    if (roomTypeError) throw roomTypeError
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
    const { data: existingReservations } = await db.from('bookings').select('id,reference,room_id,room_type_id,check_in,check_out,amount,reservation_expires_at,payment_status,status').eq('customer_id', customerId).eq('status', 'pending').neq('payment_status', 'paid')
    const current = (existingReservations ?? []).find(b => b.reservation_expires_at && new Date(b.reservation_expires_at).getTime() > Date.now())

    // A previous Pay now attempt may already have created the 10-minute payment hold.
    // Reuse that active hold instead of making the guest start over or creating a second booking.
    if (current && String(current.room_type_id) === String(roomTypeId) && String(current.room_id || '') === String(roomId || '') && current.check_in === checkIn && current.check_out === checkOut) {
      return NextResponse.json({ booking: current, alreadyHeldForPayment: true, holdMinutes: HOLD_MINUTES, holdStarted: true }, { status: 200 })
    }
    if (current) return NextResponse.json({ booking: current, alreadyReserved: true, error: 'You already have an active payment hold for another room. Complete that payment or wait for its hold to expire before starting another payment.' }, { status: 409 })

    const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    const { data: booking, error: claimError } = await db.rpc('claim_room_reservation', {
      p_customer_id: customerId, p_room_type_id: String(roomTypeId), p_room_id: roomId ? String(roomId) : null,
      p_check_in: checkIn, p_check_out: checkOut, p_adults: Number(adults) || 2, p_children: Number(children) || 0,
      p_amount: Number(amount) || Number(roomType.price) * nights,
      p_special_requests: typeof specialRequests === 'string' ? specialRequests.trim() || null : null,
      p_extra_services: Array.isArray(extraServices) ? extraServices : [],
    })
    if (claimError) {
      const message = String(claimError.message || '')
      if (message.includes('PAYMENT_IN_PROGRESS')) return NextResponse.json({ code: 'PAYMENT_IN_PROGRESS', error: 'Another guest is currently paying for this room. Please try again in a few seconds.' }, { status: 409 })
      if (message.includes('ROOM_SOLD') || message.includes('ROOM_NOT_AVAILABLE')) return NextResponse.json({ code: 'ROOM_NOT_AVAILABLE', error: 'This room is no longer available for those dates. Please choose another room or change your dates.' }, { status: 409 })
      if (message.includes('ROOM_NOT_FOUND')) return NextResponse.json({ error: 'That room could not be found.' }, { status: 404 })
      if (message.includes('CHECKOUT_MUST_BE_AFTER_CHECKIN')) return NextResponse.json({ error: 'Check-out must be after check-in.' }, { status: 400 })
      throw claimError
    }
    const created = Array.isArray(booking) ? booking[0] : booking
    if (!created?.id) return NextResponse.json({ error: 'The payment hold could not be created. Please try again.' }, { status: 500 })
    return NextResponse.json({ booking: created, holdMinutes: HOLD_MINUTES, holdStarted: true }, { status: 201 })
  } catch (error: any) {
    console.error('[public-payment-hold]', error)
    if (error?.message === 'REQUEST_BODY_TOO_LARGE') return NextResponse.json({ error: 'Request is too large.' }, { status: 413 })
    return NextResponse.json({ error: 'We could not start payment right now. Please try again.' }, { status: 500 })
  }
}
