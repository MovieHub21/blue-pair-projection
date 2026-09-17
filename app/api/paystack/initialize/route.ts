import { NextResponse } from 'next/server'
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
      .select('id,reference,customer_id,room_id,room_type_id,check_in,check_out,amount,payment_status,status')
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
    if (!booking.room_id) { log('ROOM_ID_MISSING', { bookingId: booking.id }); return NextResponse.json({ error: 'This booking does not have a physical room assigned yet.' }, { status: 409 }) }
    log('CUSTOMER_OK', { customerId: customer.id, email: customer.email })

    log('ACQUIRING_PAYMENT_LOCK', { bookingId: booking.id, roomId: booking.room_id, checkIn: booking.check_in, checkOut: booking.check_out })
    const { data: lock, error: lockError } = await admin.rpc('acquire_payment_lock', { p_booking_id: booking.id, p_user_id: user.id })
    if (lockError) { log('PAYMENT_LOCK_RPC_FAILED', { message: lockError.message, code: lockError.code, details: lockError.details, hint: lockError.hint }); throw lockError }
    const lockResult = Array.isArray(lock) ? lock[0] : lock
    log('PAYMENT_LOCK_RESULT', { acquired: lockResult?.acquired, reason: lockResult?.reason, expiresAt: lockResult?.expires_at })
    if (!lockResult?.acquired) {
      if (lockResult?.reason === 'payment_in_progress') return NextResponse.json({ error: 'This room is currently being secured by another guest. Please wait until their payment window ends and try again.', code: 'PAYMENT_IN_PROGRESS', expiresAt: lockResult.expires_at ? new Date(lockResult.expires_at).toISOString() : null }, { status: 409 })
      if (lockResult?.reason === 'room_already_sold') return NextResponse.json({ error: 'This room has just been secured by another guest. Please choose another available room.', code: 'ROOM_SOLD' }, { status: 409 })
      if (lockResult?.reason === 'room_not_available') return NextResponse.json({ error: 'This room is no longer available for payment. Please refresh and choose another room.', code: 'ROOM_NOT_AVAILABLE' }, { status: 409 })
      return NextResponse.json({ error: 'This booking is not currently eligible for payment.' }, { status: 409 })
    }

    const reference = `BPH-${booking.reference.replace(/^BPH-/,'')}-PS-${Date.now()}`
    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || SITE_URL}/api/paystack/callback`
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
      if (!paystackResponse.ok || !result?.status || !result?.data?.authorization_url) throw new Error(result?.message || 'Paystack could not initialize the payment.')

      const paidOn = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })
      const { data: existingPayment, error: existingPaymentError } = await admin.from('payments').select('id').eq('booking_ref', booking.reference).maybeSingle()
      if (existingPaymentError) { log('PAYMENT_RECORD_LOOKUP_FAILED', { message: existingPaymentError.message, code: existingPaymentError.code }); throw existingPaymentError }
      if (existingPayment) {
        log('UPDATING_PAYMENT_RECORD', { paymentId: existingPayment.id, bookingReference: booking.reference })
        const { error } = await admin.from('payments').update({ customer_id: customer.id, amount: booking.amount, reference, method: 'Paystack', status: 'pending', date: paidOn }).eq('id', existingPayment.id)
        if (error) { log('PAYMENT_RECORD_UPDATE_FAILED', { message: error.message, code: error.code, details: error.details }); throw error }
      } else {
        log('CREATING_PAYMENT_RECORD', { bookingReference: booking.reference })
        const { error } = await admin.from('payments').insert({ id: `pay_${Date.now()}`, reference, booking_ref: booking.reference, customer_id: customer.id, customer: customer.name, amount: booking.amount, method: 'Paystack', status: 'pending', date: paidOn })
        if (error) { log('PAYMENT_RECORD_INSERT_FAILED', { message: error.message, code: error.code, details: error.details }); throw error }
      }
      log('SUCCESS_AUTHORIZATION_URL_CREATED', { bookingId: booking.id, reference, lockExpiresAt: lockResult.expires_at })
      return NextResponse.json({ authorizationUrl: result.data.authorization_url, reference, lockExpiresAt: lockResult.expires_at })
    } catch (error: any) {
      log('PAYSTACK_INITIALIZATION_FAILED', { message: error?.message, code: error?.code, stack: error?.stack })
      const { error: releaseError } = await admin.rpc('release_payment_lock', { p_booking_id: booking.id })
      if (releaseError) log('PAYMENT_LOCK_RELEASE_FAILED', { message: releaseError.message, code: releaseError.code })
      else log('PAYMENT_LOCK_RELEASED_AFTER_FAILURE', { bookingId: booking.id })
      throw error
    }
  } catch (error: any) {
    console.error(`[guest-paystack-initialize][${requestId}] UNHANDLED_ERROR`, { message: error?.message, code: error?.code, details: error?.details, hint: error?.hint, stack: error?.stack })
    return NextResponse.json({ error: error?.message || 'Unable to initialize Paystack payment.' }, { status: 500 })
  }
}