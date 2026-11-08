import { NextResponse } from 'next/server'
import { SITE_URL } from '../../../../../lib/siteConfig'
import { createSupabaseAdminClient } from '../../../../../lib/supabase/admin'
import { settleAnnexCheckout } from '../../../../../lib/payments/settleAnnexCheckout'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const reference = String(url.searchParams.get('reference') || url.searchParams.get('trxref') || '').trim()
  const base = process.env.NEXT_PUBLIC_SITE_URL || SITE_URL
  const errorUrl = (reason: string) => NextResponse.redirect(`${base}/annex/order/error?reason=${encodeURIComponent(reason)}`)
  if (!reference) return errorUrl('missing_reference')

  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) return errorUrl('payment_not_configured')

  try {
    const result = await settleAnnexCheckout(createSupabaseAdminClient(), secret, reference)
    if (result.ok) {
      return NextResponse.redirect(`${base}/annex/order/success?reference=${encodeURIComponent(result.orderReference)}`)
    }

    if (result.ok === false) {
      if (result.transient) return errorUrl('payment_pending')
      return errorUrl(result.reason)
    }

    return errorUrl('payment_pending')
  } catch (error) {
    console.error('[annex-order-payment-callback]', error)
    return errorUrl('order_creation_failed')
  }
}
