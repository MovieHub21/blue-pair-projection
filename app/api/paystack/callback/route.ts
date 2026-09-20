import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { sendResendEmail } from '../../../../lib/email/resend'
import { paymentSuccessfulEmail } from '../../../../lib/email/templates'
import { SITE_URL } from '../../../../lib/siteConfig'

function overlaps(start: string, end: string, bookingStart: string, bookingEnd: string) { return start < bookingEnd && end > bookingStart }

async function releaseAbandonedPayment(admin: ReturnType<typeof createSupabaseAdminClient>, bookingId: string, paymentId: string) {
  await admin.from('payments').update({ status: 'failed' }).eq('id', paymentId).neq('status', 'success')
  await admin.from('payment_holds').delete().eq('booking_id', bookingId)
  await admin.from('bookings').update({ status: 'cancelled', reservation_expires_at: null }).eq('id', bookingId).eq('status', 'pending').neq('payment_status', 'paid')
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const reference = String(url.searchParams.get('reference') || url.searchParams.get('trxref') || '').trim()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || SITE_URL
  const adminUrl = `${baseUrl}/admin/bookings`
  const guestUrl = `${baseUrl}/booking`
  const guestDashboard = `${baseUrl}/account/bookings`
  if (!reference) return NextResponse.redirect(`${guestUrl}?payment=missing`)

  try {
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) return NextResponse.redirect(`${guestUrl}?payment=not-configured`)
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${secret}` }, cache: 'no-store' })
    const result = await response.json()
    const transaction = result?.data

    const admin = createSupabaseAdminClient()
    const { data: payment, error: paymentLookupError } = await admin.from('payments').select('id,booking_ref,amount,customer_id,status').eq('reference', reference).maybeSingle()
    if (paymentLookupError) throw paymentLookupError
    if (!payment) return NextResponse.redirect(`${adminUrl}?payment=unmatched`)

    const { data: booking, error: bookingLookupError } = await admin.from('bookings').select('id,reference,customer_id,room_id,room_type_id,short_let_id,check_in,check_out,amount,status,payment_status,reservation_expires_at').eq('reference', payment.booking_ref).maybeSingle()
    if (bookingLookupError) throw bookingLookupError
    if (!booking) return NextResponse.redirect(`${guestUrl}?payment=booking-not-found`)

    if (!response.ok || !result?.status) {
      await releaseAbandonedPayment(admin, booking.id, payment.id)
      return NextResponse.redirect(`${guestUrl}?payment=failed`)
    }

    if (transaction?.status !== 'success') {
      const status = String(transaction?.status || 'failed')
      console.log('[paystack-callback] non-success transaction', { reference, bookingId: booking.id, status })
      if (['abandoned', 'failed', 'reversed', 'timeout'].includes(status)) {
        await releaseAbandonedPayment(admin, booking.id, payment.id)
        return NextResponse.redirect(`${guestUrl}?payment=cancelled`)
      }
      return NextResponse.redirect(`${guestUrl}?payment=pending&reference=${encodeURIComponent(reference)}`)
    }

    if (Number(transaction.amount) !== Math.round(Number(payment.amount) * 100)) return NextResponse.redirect(`${guestUrl}?payment=amount-mismatch`)

    if (String(payment.booking_ref).startsWith('RS-')) {
      const { data: order, error: orderLookupError } = await admin.from('room_service_orders').select('*').eq('reference', payment.booking_ref).maybeSingle()
      if (orderLookupError) throw orderLookupError
      if (!order) return NextResponse.redirect(`${guestDashboard}?payment=order-not-found`)
      return NextResponse.redirect(`${guestDashboard}?payment=processing&room_service=${encodeURIComponent(order.reference)}`)
    }

    if (booking.payment_status === 'paid' && booking.status === 'confirmed') return NextResponse.redirect(`${guestDashboard}?payment=success&reference=${encodeURIComponent(reference)}`)
    if (!booking.room_id && !booking.short_let_id) return NextResponse.redirect(`${guestUrl}?payment=property-missing`)
    if (booking.short_let_id) {
      if (!booking.reservation_expires_at || new Date(booking.reservation_expires_at).getTime() <= Date.now()) {
        await releaseAbandonedPayment(admin, booking.id, payment.id)
        return NextResponse.redirect(`${guestUrl}?payment=failed&reason=payment-window-expired`)
      }
    } else {
      const { data: paymentHold, error: holdError } = await admin.from('payment_holds').select('id,room_id,check_in,check_out,expires_at').eq('booking_id', booking.id).maybeSingle()
      if (holdError) throw holdError
      const ownsActiveHold = paymentHold?.room_id === booking.room_id && !!paymentHold?.expires_at && new Date(paymentHold.expires_at).getTime() > Date.now()
      if (!ownsActiveHold) {
        const { data: refreshedBooking } = await admin.from('bookings').select('status,payment_status').eq('id', booking.id).maybeSingle()
        if (refreshedBooking?.payment_status === 'paid' && refreshedBooking.status === 'confirmed') return NextResponse.redirect(`${guestDashboard}?payment=success&reference=${encodeURIComponent(reference)}`)
        await releaseAbandonedPayment(admin, booking.id, payment.id)
        return NextResponse.redirect(`${guestUrl}?payment=failed&reason=payment-window-expired`)
      }
    }

    const paidOn = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })
    if (payment.status !== 'success') {
      const { error } = await admin.from('payments').update({ status: 'success', method: 'Paystack', date: paidOn }).eq('id', payment.id).eq('status', 'pending')
      if (error) throw error
    }
    const { error: bookingUpdateError } = await admin.from('bookings').update({ payment_status: 'paid', status: 'confirmed', reservation_expires_at: null }).eq('id', booking.id).in('status', ['pending', 'confirmed']).neq('payment_status', 'paid')
    if (bookingUpdateError) throw bookingUpdateError
    if (booking.room_id) {
      const { error: holdClearError } = await admin.from('payment_holds').delete().eq('booking_id', booking.id)
      if (holdClearError) throw holdClearError
      const { data: competitors, error: competitorError } = await admin.from('bookings').select('id,check_in,check_out').eq('room_id', booking.room_id).eq('status', 'pending').neq('payment_status', 'paid')
      if (competitorError) throw competitorError
      const losers = (competitors ?? []).filter(item => overlaps(booking.check_in, booking.check_out, item.check_in, item.check_out)).map(item => item.id)
      if (losers.length) await admin.from('bookings').update({ status: 'cancelled', reservation_expires_at: null }).in('id', losers)
    }

    const { data: customer, error: customerError } = await admin.from('customers').select('id,user_id,name,email').eq('id', payment.customer_id).maybeSingle()
    if (customerError) throw customerError
    if (customer?.user_id) {
      const { data: existingNotification } = await admin.from('guest_notifications').select('id').eq('user_id', customer.user_id).eq('type', 'payment').contains('metadata', { payment_reference: reference }).limit(1).maybeSingle()
      if (!existingNotification) {
        const { data: roomType } = booking.room_type_id ? await admin.from('room_types').select('name').eq('id', booking.room_type_id).maybeSingle() : { data: null }\n        const { data: shortLet } = booking.short_let_id ? await admin.from('short_lets').select('name').eq('id', booking.short_let_id).maybeSingle() : { data: null }
        if (customer.email) {
          try {
            const email = paymentSuccessfulEmail({ guestName: customer.name || 'Guest', reference: booking.reference, roomName: shortLet?.name || roomType?.name || 'Short-let', checkIn: booking.check_in, checkOut: booking.check_out, total: Number(booking.amount), paymentReference: reference })
            await sendResendEmail({ to: customer.email, subject: email.subject, html: email.html, text: email.text, includeAccountCta: false })
          } catch (emailError) { console.error('[paystack-callback] confirmation email failed', emailError) }
        }
        await admin.from('guest_notifications').insert({ user_id: customer.user_id, type: 'payment', title: 'Booking confirmed', body: `Payment for ${booking.reference} was verified. Your reservation is now confirmed.`, href: '/account/bookings', metadata: { booking_id: booking.id, reference: booking.reference, payment_reference: reference, status: 'confirmed' } })
      }
    }
    return NextResponse.redirect(`${guestDashboard}?payment=success&reference=${encodeURIComponent(reference)}`)
  } catch (error) {
    console.error('[paystack-callback]', error)
    return NextResponse.redirect(`${guestUrl}?payment=error`)
  }
}
