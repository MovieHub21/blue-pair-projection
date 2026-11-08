import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { settleRoomServicePayment } from '../../../../lib/roomServicePayments'
import { settleBookingPayment, verifyPaystackTransaction } from '../../../../lib/payments/settleBooking'
import { settleAnnexCheckout } from '../../../../lib/payments/settleAnnexCheckout'

export const dynamic = 'force-dynamic'

function validSignature(rawBody: string, signature: string, secret: string) {
  if (!signature) return false
  const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex')
  const a = Buffer.from(signature.trim().toLowerCase())
  const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

/**
 * Paystack webhook. This is the primary way a payment is confirmed: it works even if the guest never returns
 * to the site. Status codes matter because Paystack retries any non-2xx delivery (every few minutes, then hourly):
 *  - 401: bad signature (never retried successfully, by design)
 *  - 5xx: temporary problem (Paystack unreachable, database error, refund not yet possible) -> Paystack retries
 *  - 200: handled, or permanently not ours / not actionable (logged)
 */
export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) return NextResponse.json({ error: 'Paystack is not configured.' }, { status: 503 })

  // The signature is computed over the exact raw bytes, so read the text body before any JSON parsing.
  const rawBody = await request.text()
  const signature = request.headers.get('x-paystack-signature') || request.headers.get('paystack-signature') || ''
  if (!validSignature(rawBody, signature, secret)) return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 })

  let event: any
  try { event = JSON.parse(rawBody) } catch { return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 }) }
  if (event?.event !== 'charge.success') return NextResponse.json({ received: true })

  const reference = String(event?.data?.reference || '').trim()
  if (!reference) return NextResponse.json({ received: true })

  try {
    const admin = createSupabaseAdminClient()
    if (reference.startsWith('ANXPAY-')) {
      const annex = await settleAnnexCheckout(admin, secret, reference)
      if (annex.ok) return NextResponse.json({ received: true, state: annex.state })
      console.error('[paystack-webhook] Annex order not settled', { reference, reason: annex.reason })
      return NextResponse.json({ received: !annex.transient, settled: false, reason: annex.reason }, { status: annex.transient ? 503 : 200 })
    }

    const result = await settleBookingPayment(admin, secret, reference)
    if (result.ok === true) return NextResponse.json({ received: true, state: result.state })

    if (result.reason === 'room_service') {
      const verification = await verifyPaystackTransaction(secret, reference)
      if (verification.kind === 'unavailable') { console.error('[paystack-webhook] room-service verify unavailable', { reference, detail: verification.detail }); return NextResponse.json({ error: 'Verification unavailable.' }, { status: 503 }) }
      if (verification.kind !== 'success') { console.error('[paystack-webhook] room-service charge.success not confirmed by verify', { reference, status: verification.status }); return NextResponse.json({ error: 'Not yet confirmed.' }, { status: 503 }) }
      if (String(verification.transaction.currency || '').toUpperCase() !== 'NGN') { console.error('[paystack-webhook] room-service currency mismatch', { reference }); return NextResponse.json({ received: true, settled: false, reason: 'currency_mismatch' }) }
      const settled = await settleRoomServicePayment(admin, reference, Number(verification.transaction.amount))
      if (settled.ok === true) return NextResponse.json({ received: true, state: settled.alreadyPaid ? 'already_paid' : 'settled' })
      console.error('[paystack-webhook] room-service not settled', { reference, reason: settled.reason })
      return NextResponse.json({ received: true, settled: false, reason: settled.reason }, { status: settled.reason === 'update_failed' ? 500 : 200 })
    }

    console.error('[paystack-webhook] booking payment not settled', { reference, reason: result.reason, status: result.status, detail: result.detail })
    // Retry when it can still succeed: Paystack/database trouble, or Paystack says charge.success but verify has not caught up.
    const retry = result.transient || result.reason === 'not_success'
    return NextResponse.json({ received: !retry, settled: false, reason: result.reason }, { status: retry ? 500 : 200 })
  } catch (error) {
    console.error('[paystack-webhook]', error)
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 })
  }
}
