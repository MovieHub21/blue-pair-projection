import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'

function overlaps(start: string, end: string, bookingStart: string, bookingEnd: string) { return start < bookingEnd && end > bookingStart }

async function refundPaystackTransaction(secret: string, transactionId: unknown) {
  if (!transactionId) return false
  try {
    const response = await fetch('https://api.paystack.co/refund', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction: transactionId }),
      cache: 'no-store',
    })
    const result = await response.json().catch(() => null)
    if (!response.ok || !result?.status) {
      console.error('[paystack-webhook] refund failed', result?.message || response.status)
      return false
    }
    return true
  } catch (error) {
    console.error('[paystack-webhook] refund request failed', error)
    return false
  }
}

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
    const { data: payment } = await admin.from('payments').select('id,booking_ref,amount,status').eq('reference', reference).maybeSingle()
    if (!payment) return NextResponse.json({ received: true })
    if (payment.status === 'success') return NextResponse.json({ received: true })
    if (Number(event.data.amount) !== Math.round(Number(payment.amount) * 100)) {
      console.error('[paystack-webhook] amount mismatch', reference)
      return NextResponse.json({ received: true })
    }

    const { data: paidBooking } = await admin.from('bookings')
      .select('id,room_id,check_in,check_out,status,payment_status,reservation_expires_at')
      .eq('reference', payment.booking_ref).maybeSingle()
    if (!paidBooking) return NextResponse.json({ received: true })

    // The payment lock is the final authority. A Paystack window that has
    // expired or lost ownership must never be allowed to take the room.
    if (!paidBooking.room_id) {
      await refundPaystackTransaction(secret, event.data.id)
      await admin.from('payments').update({ status: 'failed' }).eq('id', payment.id)
      return NextResponse.json({ received: true })
    }

    const { data: room } = await admin.from('rooms')
      .select('id,status,payment_lock_booking_id,payment_lock_expires_at')
      .eq('id', paidBooking.room_id).maybeSingle()

    const ownsActiveLock = room?.payment_lock_booking_id === paidBooking.id
      && room?.payment_lock_expires_at
      && new Date(room.payment_lock_expires_at).getTime() > Date.now()
      && room.status === 'available'

    if (!ownsActiveLock) {
      console.warn('[paystack-webhook] payment arrived without active room lock; refunding', { reference, bookingId: paidBooking.id, roomId: paidBooking.room_id })
      const refunded = await refundPaystackTransaction(secret, event.data.id)
      await admin.from('payments').update({ status: refunded ? 'failed' : 'pending' }).eq('id', payment.id)
      return NextResponse.json({ received: true })
    }

    const paidOn = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })
    const { error: paymentError } = await admin.from('payments').update({ status: 'success', method: 'Paystack', date: paidOn }).eq('id', payment.id).eq('status', 'pending')
    if (paymentError) throw paymentError

    const { error: bookingError } = await admin.from('bookings').update({ payment_status: 'paid', status: 'confirmed', reservation_expires_at: null }).eq('reference', payment.booking_ref).eq('payment_status', 'pending')
    if (bookingError) throw bookingError

    await admin.from('rooms').update({ payment_lock_booking_id: null, payment_lock_expires_at: null }).eq('id', paidBooking.room_id).eq('payment_lock_booking_id', paidBooking.id)

    // The first successful payment wins. Any other pending holds for the same
    // physical room and overlapping dates are cancelled immediately.
    const { data: competitors } = await admin.from('bookings').select('id,check_in,check_out').eq('room_id', paidBooking.room_id).eq('status', 'pending').neq('payment_status', 'paid')
    const losers = (competitors ?? []).filter(b => overlaps(paidBooking.check_in, paidBooking.check_out, b.check_in, b.check_out)).map(b => b.id)
    if (losers.length) await admin.from('bookings').update({ status: 'cancelled', reservation_expires_at: null }).in('id', losers)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[paystack-webhook]', error)
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 })
  }
}
