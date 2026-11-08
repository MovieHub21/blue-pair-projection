import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { SITE_URL } from '../../../../lib/siteConfig'

export async function POST(request: Request) {
  const requestId = `paystack_${Date.now()}_${Math.random().toString(36).slice(2,8)}`
  const log = (message: string, data?: Record<string, unknown>) => console.log(`[guest-paystack-initialize][${requestId}] ${message}`, data || '')
  try {
    log('START')
    const server = createSupabaseServerClient()
    const { data: { user } } = await server.auth.getUser()
    if (!user) { log('AUTH_FAILED'); return NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) }
    log('AUTH_OK', { userId: user.id })

    const { bookingId } = await request.json()
    log('REQUEST_PARSED', { bookingId })
    if (!bookingId) return NextResponse.json({ error: 'Booking ID is required.' }, { status: 400 })
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) { log('PAYSTACK_SECRET_MISSING'); return NextResponse.json({ error: 'Paystack is not configured. Add PAYSTACK_SECRET_KEY to the server environment.' }, { status: 503 }) }

    const admin = createSupabaseAdminClient()
    const { data: booking, error: bookingError } = await admin.from('bookings')
      .select('id,reference,customer_id,room_id,room_type_id,short_let_id,check_in,check_out,amount,payment_status,status,reservation_expires_at')
      .eq('id', String(bookingId)).maybeSingle()
    if (bookingError) { log('BOOKING_QUERY_FAILED', { message: bookingError.message, code: bookingError.code, details: bookingError.details }); throw bookingError }
    if (!booking) { log('BOOKING_NOT_FOUND', { bookingId }); return NextResponse.json({ error: 'Booking could not be found. Please try again.' }, { status: 404 }) }
    log('BOOKING_FOUND', { bookingId: booking.id, roomId: booking.room_id, checkIn: booking.check_in, checkOut: booking.check_out, amount: booking.amount, paymentStatus: booking.payment_status, status: booking.status })
    if (booking.status === 'cancelled') return NextResponse.json({ error: 'A cancelled booking cannot be paid.' }, { status: 400 })
    if (booking.payment_status === 'paid') return NextResponse.json({ error: 'This booking is already paid.' }, { status: 409 })

    const { data: customer, error: customerError } = await admin.from('customers').select('id,user_id,name,email,phone').eq('id', booking.customer_id).maybeSingle()
    if (customerError) { log('CUSTOMER_QUERY_FAILED', { message: customerError.message, code: customerError.code, details: customerError.details }); throw customerError }
    if (!customer || customer.user_id !== user.id) { log('CUSTOMER_AUTH_MISMATCH', { customerId: customer?.id || null }); return NextResponse.json({ error: 'You are not allowed to pay for this booking.' }, { status: 403 }) }
    if (!customer.email) { log('CUSTOMER_EMAIL_MISSING', { customerId: customer.id }); return NextResponse.json({ error: 'A customer email is required for Paystack.' }, { status: 400 }) }
    if (!booking.room_id && !booking.short_let_id) { log('BOOKING_RESOURCE_MISSING', { bookingId: booking.id }); return NextResponse.json({ error: 'This booking has no property assigned.' }, { status: 409 }) }
    if (booking.reservation_expires_at && new Date(booking.reservation_expires_at).getTime() <= Date.now()) return NextResponse.json({ error: 'This reservation has expired. Please start the booking again.' }, { status: 409 })
    const amount = Number(booking.amount)
    if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: 'The booking total is invalid.' }, { status: 409 })
    log('CUSTOMER_OK', { customerId: customer.id, email: customer.email })

    let lockResult: any = null
    if (booking.room_id) {
      log('ACQUIRING_PAYMENT_LOCK', { bookingId: booking.id, roomId: booking.room_id, checkIn: booking.check_in, checkOut: booking.check_out })
      const { data: lock, error: lockError } = await admin.rpc('acquire_payment_lock', { p_booking_id: booking.id, p_user_id: user.id })
      if (lockError) throw lockError
      lockResult = Array.isArray(lock) ? lock[0] : lock
      if (!lockResult?.acquired) {
        if (lockResult?.reason === 'payment_in_progress') return NextResponse.json({ error: 'This room is currently being secured by another guest. Please wait until their payment window ends and try again.', code: 'PAYMENT_IN_PROGRESS', expiresAt: lockResult.expires_at ? new Date(lockResult.expires_at).toISOString() : null }, { status: 409 })
        if (lockResult?.reason === 'room_already_sold') return NextResponse.json({ error: 'This room has just been secured by another guest. Please choose another available room.', code: 'ROOM_SOLD' }, { status: 409 })
        return NextResponse.json({ error: 'This booking is not currently eligible for payment.' }, { status: 409 })
      }
    }

    const reference = `BPH-${booking.reference.replace(/^BPH-/,'')}-PS-${Date.now()}-${randomUUID().slice(0, 8)}`
    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || SITE_URL}/api/paystack/callback`
    const paymentId = `pay_${randomUUID()}`
    const paidOn = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })
    const { error: paymentInsertError } = await admin.from('payments').insert({ id: paymentId, reference, booking_ref: booking.reference, customer_id: customer.id, customer: customer.name, amount, method: 'Paystack', status: 'pending', date: paidOn })
    if (paymentInsertError) throw paymentInsertError
    log('PAYSTACK_INITIALIZE_REQUEST', { bookingId: booking.id, reference, amount: Math.round(Number(booking.amount) * 100), currency: 'NGN' })
    try {
      const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: customer.email, amount: String(Math.round(Number(booking.amount) * 100)), currency: 'NGN', reference, callback_url: callbackUrl, metadata: { booking_id: booking.id, booking_reference: booking.reference, customer_id: customer.id, user_id: user.id, source: 'guest_booking' } }),
        cache: 'no-store',
      })
      const result = await paystackResponse.json()
      log('PAYSTACK_RESPONSE', { httpStatus: paystackResponse.status, ok: paystackResponse.ok, status: result?.status, message: result?.message, hasAuthorizationUrl: Boolean(result?.data?.authorization_url), reference })
      if (!paystackResponse.ok || !result?.status || !result?.data?.authorization_url) {
        await admin.from('payments').update({ status: 'failed' }).eq('id', paymentId).eq('status', 'pending')
        if (booking.room_id && lockResult?.reason === 'acquired') await admin.rpc('release_payment_lock', { p_booking_id: booking.id })
        return NextResponse.json({ error: result?.message || 'Paystack could not initialize the payment.' }, { status: 502 })
      }
      log('SUCCESS_AUTHORIZATION_URL_CREATED', { bookingId: booking.id, reference, lockExpiresAt: lockResult.expires_at })
      return NextResponse.json({ authorizationUrl: result.data.authorization_url, reference, lockExpiresAt: lockResult.expires_at })
    } catch (error: any) {
      log('PAYSTACK_INITIALIZATION_FAILED', { message: error?.message, code: error?.code, stack: error?.stack })
      // On a network/timeout error, Paystack may already have created the transaction.
      // Preserve its pending reference and reservation hold so a later callback/webhook can settle it.
      throw error
    }
  } catch (error: any) {
    console.error(`[guest-paystack-initialize][${requestId}] UNHANDLED_ERROR`, { message: error?.message, code: error?.code, details: error?.details, hint: error?.hint, stack: error?.stack })
    return NextResponse.json({ error: error?.message || 'Unable to initialize Paystack payment.' }, { status: 500 })
  }
}
