import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { failRoomServicePayment, settleRoomServicePayment } from '../../../../lib/roomServicePayments'
import { SITE_URL } from '../../../../lib/siteConfig'

export const dynamic = 'force-dynamic'

// Where Paystack sends the guest back to after paying for room service. Room service has its own
// result pages; it never uses the room-booking pages.
export async function GET(request: Request) {
  const url = new URL(request.url)
  const reference = String(url.searchParams.get('reference') || url.searchParams.get('trxref') || '').trim()
  const base = process.env.NEXT_PUBLIC_SITE_URL || SITE_URL
  const problem = (reason: string) => NextResponse.redirect(`${base}/account/requests/payment/error?reason=${encodeURIComponent(reason)}${reference ? `&reference=${encodeURIComponent(reference)}` : ''}`)
  if (!reference) return problem('missing_reference')

  try {
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) return problem('payment_not_configured')

    const admin = createSupabaseAdminClient()
    const { data: order } = await admin.from('room_service_orders').select('id,reference,payment_status').eq('payment_reference', reference).maybeSingle()
    if (!order) return problem('order_not_found')

    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${secret}` }, cache: 'no-store' })
    const result = await response.json().catch(() => null)
    const transaction = result?.data
    if (!response.ok || !result?.status) return problem('verification_failed')

    const status = String(transaction?.status || 'pending')
    if (status !== 'success') {
      if (['abandoned', 'failed', 'reversed', 'timeout'].includes(status)) {
        await failRoomServicePayment(admin, reference)
        return problem(status === 'abandoned' ? 'payment_cancelled' : 'payment_failed')
      }
      return problem('payment_pending')
    }

    const settled = await settleRoomServicePayment(admin, reference, Number(transaction.amount))
    if (settled.ok === false) return problem(settled.reason)
    return NextResponse.redirect(`${base}/account/requests/payment/success?reference=${encodeURIComponent(settled.order.reference)}`)
  } catch (error) {
    console.error('[room-service-callback]', error)
    return problem('unexpected_error')
  }
}
