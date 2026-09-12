import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { SITE_URL } from '../../../../lib/siteConfig'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const reference = String(url.searchParams.get('reference') || url.searchParams.get('trxref') || '').trim()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || SITE_URL
  const adminUrl = `${baseUrl}/admin/bookings`
  const guestUrl = `${baseUrl}/booking`
  if (!reference) return NextResponse.redirect(`${guestUrl}?payment=missing`)

  try {
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) return NextResponse.redirect(`${guestUrl}?payment=not-configured`)

    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: 'no-store',
    })
    const result = await response.json()
    const transaction = result?.data
    if (!response.ok || !result?.status || transaction?.status !== 'success') return NextResponse.redirect(`${guestUrl}?payment=failed`)

    const admin = createSupabaseAdminClient()
    const { data: payment } = await admin.from('payments').select('id,booking_ref,amount,customer_id').eq('reference', reference).maybeSingle()
    if (!payment) return NextResponse.redirect(`${adminUrl}?payment=unmatched`)

    const verifiedAmount = Number(transaction.amount)
    if (verifiedAmount !== Math.round(Number(payment.amount) * 100)) return NextResponse.redirect(`${guestUrl}?payment=amount-mismatch`)

    const paidOn = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })
    const { error: paymentError } = await admin.from('payments').update({ status: 'success', method: 'Paystack', date: paidOn }).eq('id', payment.id)
    if (paymentError) throw paymentError

    const { error: bookingError } = await admin.from('bookings').update({ payment_status: 'paid', status: 'confirmed' }).eq('reference', payment.booking_ref)
    if (bookingError) throw bookingError

    const { data: customer } = await admin.from('customers').select('user_id').eq('id', payment.customer_id).maybeSingle()
    const destination = customer?.user_id ? `${guestUrl}?payment=success&reference=${encodeURIComponent(reference)}` : `${adminUrl}?payment=success&reference=${encodeURIComponent(reference)}`
    return NextResponse.redirect(destination)
  } catch (error) {
    console.error('[paystack-callback]', error)
    return NextResponse.redirect(`${guestUrl}?payment=error`)
  }
}
