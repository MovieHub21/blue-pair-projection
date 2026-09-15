import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { sendResendEmail } from '../../../../lib/email/resend'
import { paymentSuccessfulEmail } from '../../../../lib/email/templates'
import { SITE_URL } from '../../../../lib/siteConfig'

function overlaps(start: string, end: string, bookingStart: string, bookingEnd: string) { return start < bookingEnd && end > bookingStart }

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
    const result = await response.json(); const transaction = result?.data
    if (!response.ok || !result?.status || transaction?.status !== 'success') return NextResponse.redirect(`${guestUrl}?payment=failed`)

    const admin = createSupabaseAdminClient()
    const { data: payment, error: paymentLookupError } = await admin.from('payments').select('id,booking_ref,amount,customer_id,status').eq('reference', reference).maybeSingle()
    if (paymentLookupError) throw paymentLookupError
    if (!payment) return NextResponse.redirect(`${adminUrl}?payment=unmatched`)
    if (Number(transaction.amount) !== Math.round(Number(payment.amount) * 100)) return NextResponse.redirect(`${guestUrl}?payment=amount-mismatch`)

    if (String(payment.booking_ref).startsWith('RS-')) {
      const { data: order, error: orderLookupError } = await admin.from('room_service_orders').select('*').eq('reference', payment.booking_ref).maybeSingle()
      if (orderLookupError) throw orderLookupError
      if (!order) return NextResponse.redirect(`${guestDashboard}?payment=order-not-found`)
      return NextResponse.redirect(`${guestDashboard}?payment=processing&room_service=${encodeURIComponent(order.reference)}`)
    }

    const { data: booking, error: bookingLookupError } = await admin.from('bookings').select('id,reference,customer_id,room_id,room_type_id,check_in,check_out,amount,status,payment_status').eq('reference', payment.booking_ref).maybeSingle()
    if (bookingLookupError) throw bookingLookupError
    if (!booking) return NextResponse.redirect(`${guestUrl}?payment=booking-not-found`)
    if (booking.payment_status === 'paid' && booking.status === 'confirmed') return NextResponse.redirect(`${guestDashboard}?payment=success&reference=${encodeURIComponent(reference)}`)
    if (!booking.room_id) return NextResponse.redirect(`${guestUrl}?payment=room-missing`)

    const { data: room, error: roomError } = await admin.from('rooms').select('id,status,payment_lock_booking_id,payment_lock_expires_at').eq('id', booking.room_id).maybeSingle()
    if (roomError) throw roomError
    const ownsActiveLock = room?.payment_lock_booking_id === booking.id && !!room?.payment_lock_expires_at && new Date(room.payment_lock_expires_at).getTime() > Date.now() && room.status === 'available'
    if (!ownsActiveLock) {
      const { data: refreshedBooking } = await admin.from('bookings').select('status,payment_status').eq('id', booking.id).maybeSingle()
      if (refreshedBooking?.payment_status === 'paid' && refreshedBooking.status === 'confirmed') return NextResponse.redirect(`${guestDashboard}?payment=success&reference=${encodeURIComponent(reference)}`)
      return NextResponse.redirect(`${guestUrl}?payment=failed&reason=payment-window-expired`)
    }

    const paidOn = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })
    if (payment.status !== 'success') {
      const { error } = await admin.from('payments').update({ status: 'success', method: 'Paystack', date: paidOn }).eq('id', payment.id).eq('status', 'pending')
      if (error) throw error
    }
    const { error: bookingUpdateError } = await admin.from('bookings').update({ payment_status: 'paid', status: 'confirmed', reservation_expires_at: null }).eq('id', booking.id).in('status', ['pending', 'confirmed']).neq('payment_status', 'paid')
    if (bookingUpdateError) throw bookingUpdateError
    const { error: lockClearError } = await admin.from('rooms').update({ payment_lock_booking_id: null, payment_lock_expires_at: null }).eq('id', booking.room_id).eq('payment_lock_booking_id', booking.id)
    if (lockClearError) throw lockClearError

    const { data: competitors, error: competitorError } = await admin.from('bookings').select('id,check_in,check_out').eq('room_id', booking.room_id).eq('status', 'pending').neq('payment_status', 'paid')
    if (competitorError) throw competitorError
    const losers = (competitors ?? []).filter(item => overlaps(booking.check_in, booking.check_out, item.check_in, item.check_out)).map(item => item.id)
    if (losers.length) {
      const { error } = await admin.from('bookings').update({ status: 'cancelled', reservation_expires_at: null }).in('id', losers)
      if (error) throw error
    }

    const { data: customer, error: customerError } = await admin.from('customers').select('id,user_id,name,email').eq('id', payment.customer_id).maybeSingle()
    if (customerError) throw customerError
    if (customer?.user_id) {
      const { data: existingNotification } = await admin.from('guest_notifications').select('id').eq('user_id', customer.user_id).eq('type', 'payment').contains('metadata', { payment_reference: reference }).limit(1).maybeSingle()
      if (!existingNotification) {
        const { data: roomType } = await admin.from('room_types').select('name').eq('id', booking.room_type_id).maybeSingle()
        if (customer.email) {
          try {
            const email = paymentSuccessfulEmail({ guestName: customer.name || 'Guest', reference: booking.reference, roomName: roomType?.name || 'Room', checkIn: booking.check_in, checkOut: booking.check_out, total: Number(booking.amount), paymentReference: reference })
            await sendResendEmail({ to: customer.email, subject: email.subject, html: email.html, text: email.text, includeAccountCta: false })
          } catch (emailError) { console.error('[paystack-callback] confirmation email failed', emailError) }
        }
        await admin.from('guest_notifications').insert({ id: `gn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, user_id: customer.user_id, type: 'payment', title: 'Booking confirmed', body: `Payment for ${booking.reference} was verified. Your reservation is now confirmed.`, href: '/account/bookings', metadata: { booking_id: booking.id, reference: booking.reference, payment_reference: reference, status: 'confirmed' } })
      }
    }
    return NextResponse.redirect(`${guestDashboard}?payment=success&reference=${encodeURIComponent(reference)}`)
  } catch (error) { console.error('[paystack-callback]', error); return NextResponse.redirect(`${guestUrl}?payment=error`) }
}
