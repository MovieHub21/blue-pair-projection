import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { SITE_URL } from '../../../../lib/siteConfig'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const reference = String(url.searchParams.get('reference') || url.searchParams.get('trxref') || '').trim()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || SITE_URL
  const adminUrl = `${baseUrl}/admin/bookings`
  const guestUrl = `${baseUrl}/booking`
  const guestDashboard = `${baseUrl}/account/requests`
  if (!reference) return NextResponse.redirect(`${guestUrl}?payment=missing`)

  try {
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) return NextResponse.redirect(`${guestUrl}?payment=not-configured`)

    // The callback only verifies that Paystack reports success and sends the
    // guest back to the site. It must NOT finalize the booking/payment here.
    // The signed Paystack webhook is the authoritative payment confirmation.
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: 'no-store',
    })
    const result = await response.json()
    const transaction = result?.data
    if (!response.ok || !result?.status || transaction?.status !== 'success') {
      return NextResponse.redirect(`${guestUrl}?payment=failed`)
    }

    const admin = createSupabaseAdminClient()
    const { data: payment } = await admin
      .from('payments')
      .select('id,booking_ref,amount,customer_id')
      .eq('reference', reference)
      .maybeSingle()

    if (!payment) return NextResponse.redirect(`${adminUrl}?payment=unmatched`)
    if (Number(transaction.amount) !== Math.round(Number(payment.amount) * 100)) {
      return NextResponse.redirect(`${guestUrl}?payment=amount-mismatch`)
    }

    if (String(payment.booking_ref).startsWith('RS-')) {
      const { data: order, error: orderLookupError } = await admin
        .from('room_service_orders')
        .select('*')
        .eq('reference', payment.booking_ref)
        .maybeSingle()
      if (orderLookupError) throw orderLookupError
      if (!order) return NextResponse.redirect(`${guestDashboard}?payment=order-not-found`)

      return NextResponse.redirect(
        `${guestDashboard}?payment=processing&room_service=${encodeURIComponent(order.reference)}`,
      )
    }

    const { data: customer } = await admin
      .from('customers')
      .select('user_id')
      .eq('id', payment.customer_id)
      .maybeSingle()

    const destination = customer?.user_id
      ? `${guestUrl}?payment=processing&reference=${encodeURIComponent(reference)}`
      : `${adminUrl}?payment=processing&reference=${encodeURIComponent(reference)}`

    return NextResponse.redirect(destination)
  } catch (error) {
    console.error('[paystack-callback]', error)
    return NextResponse.redirect(`${guestUrl}?payment=error`)
  }
}
