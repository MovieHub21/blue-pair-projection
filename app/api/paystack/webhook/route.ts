import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'

function overlaps(start: string, end: string, bookingStart: string, bookingEnd: string) { return start < bookingEnd && end > bookingStart }

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) return NextResponse.json({ error: 'Paystack is not configured.' }, { status: 503 })
  const rawBody = await request.text()
  const signature = request.headers.get('x-paystack-signature') || ''
  const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex')
  if (!signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 })

  try {
    const event = JSON.parse(rawBody)
    if (event?.event !== 'charge.success' || event?.data?.status !== 'success') return NextResponse.json({ received: true })
    const reference = String(event.data.reference || '').trim()
    if (!reference) return NextResponse.json({ received: true })

    const admin = createSupabaseAdminClient()
    const { data: payment } = await admin.from('payments').select('id,booking_ref,amount').eq('reference', reference).maybeSingle()
    if (!payment) return NextResponse.json({ received: true })
    if (Number(event.data.amount) !== Math.round(Number(payment.amount) * 100)) {
      console.error('[paystack-webhook] amount mismatch', reference)
      return NextResponse.json({ received: true })
    }

    const { data: paidBooking } = await admin.from('bookings').select('id,room_id,check_in,check_out').eq('reference', payment.booking_ref).maybeSingle()
    if (!paidBooking) return NextResponse.json({ received: true })

    const paidOn = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })
    const { error: paymentError } = await admin.from('payments').update({ status: 'success', method: 'Paystack', date: paidOn }).eq('id', payment.id)
    if (paymentError) throw paymentError
    const { error: bookingError } = await admin.from('bookings').update({ payment_status: 'paid', status: 'confirmed', reservation_expires_at: null }).eq('reference', payment.booking_ref)
    if (bookingError) throw bookingError

    // The first successful payment wins. Any other active pending holds for the
    // same physical room and overlapping dates are cancelled immediately.
    if (paidBooking.room_id) {
      const { data: competitors } = await admin.from('bookings').select('id,check_in,check_out').eq('room_id', paidBooking.room_id).eq('status', 'pending').neq('payment_status', 'paid')
      const losers = (competitors ?? []).filter(b => overlaps(paidBooking.check_in, paidBooking.check_out, b.check_in, b.check_out)).map(b => b.id)
      if (losers.length) await admin.from('bookings').update({ status: 'cancelled' }).in('id', losers)
    }
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[paystack-webhook]', error)
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 })
  }
}
