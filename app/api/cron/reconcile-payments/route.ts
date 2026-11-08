import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { settleBookingPayment, verifyPaystackTransaction } from '../../../../lib/payments/settleBooking'
import { settleAnnexCheckout } from '../../../../lib/payments/settleAnnexCheckout'
import { isRoomServiceReference, settleRoomServicePayment } from '../../../../lib/roomServicePayments'

export const dynamic = 'force-dynamic'

const LOOKBACK_MS = 5 * 60 * 1000
const BATCH_SIZE = 50
const CONCURRENCY = 5

async function forEachLimited<T>(items: T[], limit: number, run: (item: T) => Promise<void>) {
  let next = 0
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++]
      await run(item)
    }
  }))
}

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET
  if (!expected || request.headers.get('authorization') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) return NextResponse.json({ error: 'Paystack is not configured.' }, { status: 503 })

  try {
    const admin = createSupabaseAdminClient()
    const cutoff = new Date(Date.now() - LOOKBACK_MS).toISOString()

    // payments.date is a date-only column. Use the booking and room-service order timestamps
    // to select genuinely stale rows before asking Paystack to verify them.
    const [bookingsResult, roomServiceResult, annexCheckoutsResult] = await Promise.all([
      admin.from('bookings').select('reference').eq('payment_status', 'pending').lt('created_at', cutoff).order('created_at', { ascending: true }).limit(BATCH_SIZE),
      admin.from('room_service_orders').select('payment_reference').eq('payment_status', 'pending').lt('created_at', cutoff).not('payment_reference', 'is', null).order('created_at', { ascending: true }).limit(BATCH_SIZE),
      // Include legacy failed rows too: the old callback could mark a verification timeout failed
      // even though Paystack had accepted the charge.
      admin.from('bar_order_checkouts').select('reference,payment_reference').in('status', ['pending', 'failed']).lt('created_at', cutoff).order('created_at', { ascending: true }).limit(BATCH_SIZE),
    ])
    if (bookingsResult.error) throw bookingsResult.error
    if (roomServiceResult.error) throw roomServiceResult.error
    if (annexCheckoutsResult.error) throw annexCheckoutsResult.error

    const bookingReferences = [...new Set((bookingsResult.data ?? []).map((row: any) => String(row.reference || '')).filter(Boolean))]
    const roomServiceReferences = [...new Set((roomServiceResult.data ?? []).map((row: any) => String(row.payment_reference || '')).filter(Boolean))]
    const annexReferences = [...new Set((annexCheckoutsResult.data ?? []).map((row: any) => String(row.payment_reference || row.reference || '')).filter(Boolean))]
    const [bookingPaymentsResult, roomServicePaymentsResult] = await Promise.all([
      bookingReferences.length
        ? admin.from('payments').select('reference').eq('status', 'pending').in('booking_ref', bookingReferences)
        : Promise.resolve({ data: [], error: null } as any),
      roomServiceReferences.length
        ? admin.from('payments').select('reference').eq('status', 'pending').in('reference', roomServiceReferences)
        : Promise.resolve({ data: [], error: null } as any),
    ])
    if (bookingPaymentsResult.error) throw bookingPaymentsResult.error
    if (roomServicePaymentsResult.error) throw roomServicePaymentsResult.error

    const bookingRefs = [...new Set((bookingPaymentsResult.data ?? []).map((row: any) => String(row.reference || '')).filter(Boolean))]
    const roomServiceRefs = [...new Set((roomServicePaymentsResult.data ?? []).map((row: any) => String(row.reference || '')).filter(Boolean))]

    let settled = 0
    let alreadySettled = 0
    let deferred = 0
    let failed = 0

    await Promise.all([
      forEachLimited(bookingRefs, CONCURRENCY, async reference => {
        const result = await settleBookingPayment(admin, secret, reference)
        if (result.ok) {
          if (result.state === 'settled') settled++
          else alreadySettled++
          return
        }
        if (result.transient || result.reason === 'not_success') deferred++
        else {
          // A verified but invalid/mismatched payment remains pending for staff investigation;
          // reconciliation never converts it to failed.
          console.error('[payment-reconcile] booking payment not settled', { reference, reason: result.reason, detail: result.detail })
          failed++
        }
      }),
      forEachLimited(roomServiceRefs, CONCURRENCY, async reference => {
        if (!isRoomServiceReference(reference)) return
        const verification = await verifyPaystackTransaction(secret, reference)
        if (verification.kind === 'unavailable' || verification.kind === 'not_success') { deferred++; return }
        if (String(verification.transaction.currency || '').toUpperCase() !== 'NGN') {
          console.error('[payment-reconcile] room-service currency mismatch', { reference, currency: verification.transaction.currency })
          failed++
          return
        }
        const result = await settleRoomServicePayment(admin, reference, Number(verification.transaction.amount))
        if (result.ok) {
          if (result.alreadyPaid) alreadySettled++
          else settled++
        } else if (result.reason === 'update_failed') deferred++
        else {
          console.error('[payment-reconcile] room-service payment not settled', { reference, reason: result.reason })
          failed++
        }
      }),
      forEachLimited(annexReferences, CONCURRENCY, async reference => {
        const result = await settleAnnexCheckout(admin, secret, reference)
        if (result.ok) {
          if (result.state === 'settled') settled++
          else alreadySettled++
        } else if (result.transient) deferred++
        else {
          console.error('[payment-reconcile] Annex checkout not settled', { reference, reason: result.reason })
          failed++
        }
      }),
    ])

    return NextResponse.json({
      ok: true,
      cutoff,
      checked: bookingRefs.length + roomServiceRefs.length + annexReferences.length,
      settled,
      alreadySettled,
      deferred,
      needsReview: failed,
    })
  } catch (error: any) {
    console.error('[payment-reconcile] job failed', error)
    return NextResponse.json({ error: 'Payment reconciliation failed.' }, { status: 500 })
  }
}
