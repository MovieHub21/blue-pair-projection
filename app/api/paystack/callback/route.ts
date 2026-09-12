import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { SITE_URL } from '../../../../lib/siteConfig'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const reference = String(url.searchParams.get('reference') || url.searchParams.get('trxref') || '').trim()
  const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL || SITE_URL}/admin/bookings`
  if (!reference) return NextResponse.redirect(`${adminUrl}?payment=missing`)

  try {
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) return NextResponse.redirect(`${adminUrl}?payment=not-configured`)

    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: 'no-store',
    })
    const result = await response.json()
    const transaction = result?.data
    if (!response.ok || !result?.status || transaction?.status !== 'success') return NextResponse.redirect(`${adminUrl}?payment=failed`)

    const admin = createSupabaseAdminClient()
    const { data: payment } = await admin.from('payments').select('id,booking_ref,amount').eq('reference', reference).maybeSingle()
    if (!payment) return NextResponse.redirect(`${adminUrl}?payment=unmatched`)

    const verifiedAmount = Number(transaction.amount)
    if (verifiedAmount !== Math.round(Number(payment.amount) * 100)) return NextResponse.redirect(`${adminUrl}?payment=amount-mismatch`)

    const paidOn = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })
    const { error: paymentError } = await admin.from('payments').update({ status: 'success', method: 'Paystack', date: paidOn }).eq('id', payment.id)
    if (paymentError) throw paymentError

    const { error: bookingError } = await admin.from('bookings').update({ payment_status: 'paid', status: 'confirmed' }).eq('reference', payment.booking_ref)
    if (bookingError) throw bookingError

    return NextResponse.redirect(`${adminUrl}?payment=success&reference=${encodeURIComponent(reference)}`)
  } catch (error) {
    console.error('[paystack-callback]', error)
    return NextResponse.redirect(`${adminUrl}?payment=error`)
  }
}
