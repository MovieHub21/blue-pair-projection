import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../../lib/supabase/server'
import { createSupabaseAdminClient } from '../../../../../lib/supabase/admin'
import { SITE_URL } from '../../../../../lib/siteConfig'

const STAFF_ROLES = new Set(['super_admin', 'manager', 'reception'])
const lagosToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })

export async function POST(request: Request) {
  try {
    const server = createSupabaseServerClient()
    const { data: { user } } = await server.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

    const { data: roles, error: rolesError } = await server.from('user_roles').select('role').eq('user_id', user.id)
    if (rolesError) throw rolesError
    if (!(roles ?? []).some((row: any) => STAFF_ROLES.has(row.role))) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 })

    const body = await request.json().catch(() => null)
    const bookingId = String(body?.bookingId ?? '').trim()
    if (!bookingId) return NextResponse.json({ error: 'Booking ID is required.' }, { status: 400 })

    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) return NextResponse.json({ error: 'Paystack is not configured. Add PAYSTACK_SECRET_KEY to the server environment.' }, { status: 503 })

    const admin = createSupabaseAdminClient()
    const { data: booking, error: bookingError } = await admin.from('bookings')
      .select('id,reference,customer_id,room_id,short_let_id,check_in,check_out,amount,payment_status,status,reservation_expires_at')
      .eq('id', bookingId).maybeSingle()
    if (bookingError) throw bookingError
    if (!booking) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
    if (booking.payment_status === 'paid') return NextResponse.json({ error: 'This booking is already paid.' }, { status: 409 })
    if (booking.status !== 'pending') return NextResponse.json({ error: 'Only pending bookings can be paid with Paystack.' }, { status: 409 })
    if (!booking.room_id && !booking.short_let_id) return NextResponse.json({ error: 'This booking has no room or short-let assigned.' }, { status: 409 })
    const amount = Number(booking.amount)
    if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: 'The booking total is invalid.' }, { status: 409 })
    if (booking.reservation_expires_at && new Date(booking.reservation_expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: 'This reservation has expired. Please create a new booking.' }, { status: 409 })
    }

    const { data: customer, error: customerError } = await admin.from('customers')
      .select('id,user_id,name,email,phone').eq('id', booking.customer_id).maybeSingle()
    if (customerError) throw customerError
    if (!customer?.email) return NextResponse.json({ error: 'A customer email is required for Paystack.' }, { status: 400 })

    let shouldReleaseLock = false
    if (booking.room_id) {
      if (!customer.user_id) return NextResponse.json({ error: 'This booking is not linked to a guest account, so an online room payment cannot be started.' }, { status: 409 })
      const { data: lock, error: lockError } = await admin.rpc('acquire_payment_lock', { p_booking_id: booking.id, p_user_id: customer.user_id })
      if (lockError) throw lockError
      const lockResult: any = Array.isArray(lock) ? lock[0] : lock
      if (!lockResult?.acquired) {
        const message = lockResult?.reason === 'room_already_sold'
          ? 'This room has just been secured by another guest. Please choose another available room.'
          : lockResult?.reason === 'payment_in_progress'
            ? 'This room is currently being secured by another guest. Please try again when their payment window ends.'
            : 'This booking is not currently eligible for payment.'
        return NextResponse.json({ error: message, reason: lockResult?.reason }, { status: 409 })
      }
      // A pre-existing hold belongs to another in-flight payment request; do not release it on this request's failure.
      shouldReleaseLock = lockResult.reason === 'acquired'
    }

    const reference = `BPH-${booking.reference.replace(/^BPH-/, '')}-PS-${Date.now()}-${randomUUID().slice(0, 8)}`
    const paymentId = `pay_${randomUUID()}`
    const { error: paymentInsertError } = await admin.from('payments').insert({
      id: paymentId,
      reference,
      booking_ref: booking.reference,
      customer_id: customer.id,
      customer: customer.name,
      amount,
      method: 'Paystack',
      status: 'pending',
      date: lagosToday(),
    })
    if (paymentInsertError) throw paymentInsertError

    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || SITE_URL}/api/paystack/callback`
    let paystackResponse: Response
    let result: any
    try {
      paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customer.email,
          amount: String(Math.round(amount * 100)),
          currency: 'NGN',
          reference,
          callback_url: callbackUrl,
          metadata: { booking_id: booking.id, booking_reference: booking.reference, customer_id: customer.id, user_id: customer.user_id, source: 'admin_booking' },
        }),
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      })
      result = await paystackResponse.json().catch(() => null)
    } catch (error) {
      // A network timeout is ambiguous: Paystack may have created the transaction. Keep the attempt
      // pending and keep the hold until its normal expiry so a callback/webhook can still settle it.
      throw error
    }

    if (!paystackResponse.ok || !result?.status || !result?.data?.authorization_url) {
      await admin.from('payments').update({ status: 'failed' }).eq('id', paymentId).eq('status', 'pending')
      if (shouldReleaseLock && booking.room_id) {
        await admin.rpc('release_payment_lock', { p_booking_id: booking.id })
        shouldReleaseLock = false
      }
      return NextResponse.json({ error: result?.message || 'Paystack could not initialize the payment.' }, { status: 502 })
    }

    return NextResponse.json({ authorizationUrl: result.data.authorization_url, reference })
  } catch (error: any) {
    console.error('[admin-paystack-initialize]', error)
    return NextResponse.json({ error: error?.message || 'Unable to initialize Paystack payment.' }, { status: 500 })
  }
}
