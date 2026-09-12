import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { SITE_URL } from '../../../../lib/siteConfig'

export async function POST(request: Request) {
  try {
    const server = createSupabaseServerClient()
    const { data: { user } } = await server.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

    const { bookingId } = await request.json()
    if (!bookingId) return NextResponse.json({ error: 'Booking ID is required.' }, { status: 400 })

    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) return NextResponse.json({ error: 'Paystack is not configured. Add PAYSTACK_SECRET_KEY to the server environment.' }, { status: 503 })

    const admin = createSupabaseAdminClient()
    let booking: any = null

    // createBooking currently writes to Supabase asynchronously, so allow the insert
    // a short window to become visible before initializing the Paystack transaction.
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const { data } = await admin
        .from('bookings')
        .select('id,reference,customer_id,amount,payment_status,status')
        .eq('id', String(bookingId))
        .maybeSingle()
      booking = data
      if (booking) break
      await new Promise(resolve => setTimeout(resolve, 250))
    }

    if (!booking) return NextResponse.json({ error: 'Booking could not be found. Please try again.' }, { status: 404 })
    if (booking.status === 'cancelled') return NextResponse.json({ error: 'A cancelled booking cannot be paid.' }, { status: 400 })
    if (booking.payment_status === 'paid') return NextResponse.json({ error: 'This booking is already paid.' }, { status: 409 })

    const { data: customer, error: customerError } = await admin
      .from('customers')
      .select('id,user_id,name,email,phone')
      .eq('id', booking.customer_id)
      .maybeSingle()
    if (customerError) throw customerError
    if (!customer || customer.user_id !== user.id) return NextResponse.json({ error: 'You are not allowed to pay for this booking.' }, { status: 403 })
    if (!customer.email) return NextResponse.json({ error: 'A customer email is required for Paystack.' }, { status: 400 })

    const reference = `BPH-${booking.reference.replace(/^BPH-/, '')}-PS-${Date.now()}`
    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || SITE_URL}/api/paystack/callback`

    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: customer.email,
        amount: String(Math.round(Number(booking.amount) * 100)),
        currency: 'NGN',
        reference,
        callback_url: callbackUrl,
        metadata: { booking_id: booking.id, booking_reference: booking.reference, customer_id: customer.id, user_id: user.id, source: 'guest_booking' },
      }),
      cache: 'no-store',
    })
    const result = await paystackResponse.json()
    if (!paystackResponse.ok || !result?.status || !result?.data?.authorization_url) {
      throw new Error(result?.message || 'Paystack could not initialize the payment.')
    }

    const paidOn = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })
    const { data: existingPayment } = await admin.from('payments').select('id').eq('booking_ref', booking.reference).maybeSingle()
    if (existingPayment) {
      const { error } = await admin.from('payments').update({ customer_id: customer.id, amount: booking.amount, reference, method: 'Paystack', status: 'pending', date: paidOn }).eq('id', existingPayment.id)
      if (error) throw error
    } else {
      const { error } = await admin.from('payments').insert({ id: `pay_${Date.now()}`, reference, booking_ref: booking.reference, customer_id: customer.id, customer: customer.name, amount: booking.amount, method: 'Paystack', status: 'pending', date: paidOn })
      if (error) throw error
    }

    return NextResponse.json({ authorizationUrl: result.data.authorization_url, reference })
  } catch (error: any) {
    console.error('[guest-paystack-initialize]', error)
    return NextResponse.json({ error: error?.message || 'Unable to initialize Paystack payment.' }, { status: 500 })
  }
}
