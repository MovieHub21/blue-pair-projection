import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { readSanitizedJson } from '../../../../lib/security/input'

function validDate(value: unknown): value is string { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) }
function todayLagosISO(): string { return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' }) }
const HOLD_MINUTES = 10

export async function POST(request: Request) {
  const requestId = `payment_${Date.now()}_${Math.random().toString(36).slice(2,8)}`
  const log = (message: string, data?: Record<string, unknown>) => console.log(`[public-payment-hold][${requestId}] ${message}`, data || '')
  try {
    log('START')
    const authDb = createSupabaseServerClient()
    const { data: { user } } = await authDb.auth.getUser()
    if (!user) {
      log('AUTH_FAILED')
      return NextResponse.json({ error: 'Please sign in before starting payment.' }, { status: 401 })
    }
    log('AUTH_OK', { userId: user.id })

    const body = await readSanitizedJson<{ roomTypeId?: unknown; roomId?: unknown; checkIn?: unknown; checkOut?: unknown; adults?: unknown; children?: unknown; amount?: unknown; specialRequests?: unknown; extraServices?: unknown }>(request)
    const { roomTypeId, roomId, checkIn, checkOut, adults = 2, children = 0, amount, specialRequests, extraServices } = body ?? {}
    log('REQUEST_PARSED', { roomTypeId, roomId, checkIn, checkOut, adults, children, hasAmount: amount != null, extraServiceCount: Array.isArray(extraServices) ? extraServices.length : 0 })

    const today = todayLagosISO()
    if (!roomTypeId || !validDate(checkIn) || !validDate(checkOut) || checkIn < today || checkIn >= checkOut || checkOut <= today) {
      log('INVALID_DATES_OR_ROOM_TYPE', { today, roomTypeId, checkIn, checkOut })
      return NextResponse.json({ error: 'Please choose valid future check-in and check-out dates.' }, { status: 400 })
    }

    const db = createSupabaseAdminClient()
    const { data: roomType, error: roomTypeError } = await db.from('room_types').select('id,price').eq('id', roomTypeId).maybeSingle()
    if (roomTypeError) { log('ROOM_TYPE_QUERY_FAILED', { message: roomTypeError.message, code: roomTypeError.code }); throw roomTypeError }
    if (!roomType) {
      log('ROOM_TYPE_NOT_FOUND', { roomTypeId })
      return NextResponse.json({ error: 'That room type could not be found.' }, { status: 404 })
    }
    log('ROOM_TYPE_OK', { roomTypeId, price: roomType.price })

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
      if (error) { log('CUSTOMER_CREATE_FAILED', { message: error.message, code: error.code }); throw error }
      log('CUSTOMER_CREATED', { customerId })
    } else log('CUSTOMER_OK', { customerId })

    const { error: expiredError } = await db.from('bookings').update({ status: 'cancelled', reservation_expires_at: null }).eq('customer_id', customerId).eq('status', 'pending').neq('payment_status', 'paid').not('reservation_expires_at', 'is', null).lte('reservation_expires_at', new Date().toISOString())
    if (expiredError) log('EXPIRED_BOOKING_CLEANUP_FAILED', { message: expiredError.message, code: expiredError.code })

    const { data: existingReservations, error: existingError } = await db.from('bookings').select('id,reference,room_id,room_type_id,check_in,check_out,amount,reservation_expires_at,payment_status,status').eq('customer_id', customerId).eq('status', 'pending').neq('payment_status', 'paid')
    if (existingError) { log('EXISTING_RESERVATIONS_QUERY_FAILED', { message: existingError.message, code: existingError.code }); throw existingError }
    const current = (existingReservations ?? []).find(b => b.reservation_expires_at && new Date(b.reservation_expires_at).getTime() > Date.now())
    log('EXISTING_HOLD_CHECK', { count: existingReservations?.length || 0, activeBookingId: current?.id || null, activeRoomId: current?.room_id || null, activeExpiresAt: current?.reservation_expires_at || null })

    if (current) {
      log('ACTIVE_HOLD_EXISTS', { bookingId: current.id, roomId: current.room_id, checkIn: current.check_in, checkOut: current.check_out, expiresAt: current.reservation_expires_at })
      return NextResponse.json({
        code: 'EXISTING_PAYMENT_HOLD',
        booking: current,
        expiresAt: current.reservation_expires_at,
        error: 'You already have a payment window for a reservation. Please go to your dashboard to complete that payment before starting another booking.'
      }, { status: 409 })
    }

    const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    log('CLAIMING_ROOM_RESERVATION', { roomId, roomTypeId, checkIn, checkOut, nights })
    const { data: booking, error: claimError } = await db.rpc('claim_room_reservation', {
      p_customer_id: customerId, p_room_type_id: String(roomTypeId), p_room_id: roomId ? String(roomId) : null,
      p_check_in: checkIn, p_check_out: checkOut, p_adults: Number(adults) || 2, p_children: Number(children) || 0,
      p_amount: Number(amount) || Number(roomType.price) * nights,
      p_special_requests: typeof specialRequests === 'string' ? specialRequests.trim() || null : null,
      p_extra_services: Array.isArray(extraServices) ? extraServices : [],
    })
    if (claimError) {
      log('CLAIM_ROOM_RESERVATION_FAILED', { message: claimError.message, code: claimError.code, details: claimError.details, hint: claimError.hint })
      const message = String(claimError.message || '')
      if (message.includes('PAYMENT_IN_PROGRESS')) return NextResponse.json({ code: 'PAYMENT_IN_PROGRESS', error: 'Another guest is currently paying for this room. Please try again in a few minutes.' }, { status: 409 })
      // "Paid by someone else" is only said when that is true. Cleaning never blocks a booking.
      if (message.includes('ROOM_SOLD')) return NextResponse.json({ code: 'ROOM_SOLD', error: 'This room has just been taken by another guest who successfully paid. Please choose another room or another date.' }, { status: 409 })
      if (message.includes('ROOM_NOT_AVAILABLE')) return NextResponse.json({ code: 'ROOM_NOT_AVAILABLE', error: 'This room is not available for booking right now. Please choose another room or different dates.' }, { status: 409 })
      if (message.includes('ROOM_NOT_FOUND')) return NextResponse.json({ error: 'That room could not be found.' }, { status: 404 })
      if (message.includes('CHECKOUT_MUST_BE_AFTER_CHECKIN')) return NextResponse.json({ error: 'Check-out must be after check-in.' }, { status: 400 })
      throw claimError
    }
    const created = Array.isArray(booking) ? booking[0] : booking
    if (!created?.id) {
      log('BOOKING_CREATED_WITHOUT_ID', { booking })
      return NextResponse.json({ error: 'The payment hold could not be created. Please try again.' }, { status: 500 })
    }
    log('SUCCESS_HOLD_CREATED', { bookingId: created.id, roomId: created.room_id, expiresAt: created.reservation_expires_at })
    return NextResponse.json({ booking: created, holdMinutes: HOLD_MINUTES, holdStarted: true }, { status: 201 })
  } catch (error: any) {
    console.error(`[public-payment-hold][${requestId}] UNHANDLED_ERROR`, { message: error?.message, code: error?.code, details: error?.details, hint: error?.hint, stack: error?.stack })
    if (error?.message === 'REQUEST_BODY_TOO_LARGE') return NextResponse.json({ error: 'Request is too large.' }, { status: 413 })
    return NextResponse.json({ error: 'We could not start payment right now. Please try again.' }, { status: 500 })
  }
}