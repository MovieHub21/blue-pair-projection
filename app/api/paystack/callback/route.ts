import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { SITE_URL } from '../../../../lib/siteConfig'
import { settleBookingPayment } from '../../../../lib/payments/settleBooking'

export const dynamic = 'force-dynamic'

// Where the guest lands after Paystack. This page is only a convenience: the webhook confirms payments on its own.
// The redirect never changes a payment to "failed" and never cancels a booking. It asks the shared settlement
// function to verify the transaction with Paystack, then shows the guest what the server found.
export async function GET(request: Request) {
  const url = new URL(request.url)
  const reference = String(url.searchParams.get('reference') || url.searchParams.get('trxref') || '').trim()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || SITE_URL
  const adminUrl = `${baseUrl}/admin/bookings`
  const guestUrl = `${baseUrl}/booking`
  const guestDashboard = `${baseUrl}/account/bookings`
  const pending = () => NextResponse.redirect(`${guestUrl}?payment=pending&reference=${encodeURIComponent(reference)}`)
  if (!reference) return NextResponse.redirect(`${guestUrl}?payment=missing`)

  try {
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) return NextResponse.redirect(`${guestUrl}?payment=not-configured`)

    const result = await settleBookingPayment(createSupabaseAdminClient(), secret, reference)
    if (result.ok === true) return NextResponse.redirect(`${guestDashboard}?payment=success&reference=${encodeURIComponent(reference)}`)

    switch (result.reason) {
      // Room-service payments belong to a room-service order, not to a booking: use the room-service callback.
      case 'room_service': return NextResponse.redirect(`${baseUrl}/api/room-service/callback?reference=${encodeURIComponent(reference)}`)
      case 'payment_not_found': return NextResponse.redirect(`${adminUrl}?payment=unmatched`)
      case 'booking_not_found': return NextResponse.redirect(`${guestUrl}?payment=booking-not-found`)
      case 'amount_mismatch':
      case 'currency_mismatch': return NextResponse.redirect(`${guestUrl}?payment=amount-mismatch`)
      case 'not_success': {
        // Paystack itself says this transaction did not succeed (yet). Nothing is changed in our records.
        const status = String(result.status || '')
        if (['abandoned', 'failed', 'reversed', 'timeout'].includes(status)) return NextResponse.redirect(`${guestUrl}?payment=cancelled`)
        return pending()
      }
      case 'refunded': return NextResponse.redirect(`${guestUrl}?payment=failed&reason=room-no-longer-available`)
      // Paystack unreachable or a temporary database problem: the payment is neither failed nor confirmed yet.
      case 'unavailable':
      case 'refund_failed': return pending()
      default:
        console.error('[paystack-callback] not settled', { reference, reason: result.reason, detail: result.detail })
        return result.transient ? pending() : NextResponse.redirect(`${guestUrl}?payment=error`)
    }
  } catch (error) {
    console.error('[paystack-callback]', error)
    return pending()
  }
}
