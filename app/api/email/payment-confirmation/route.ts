import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { sendResendEmail } from '../../../../lib/email/resend'
import { paymentSuccessfulEmail } from '../../../../lib/email/templates'

export async function POST(request: Request) {
  try {
    const server = createSupabaseServerClient()
    const { data: { user } } = await server.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { reference } = await request.json()
    if (!reference) return NextResponse.json({ error: 'Payment reference is required.' }, { status: 400 })

    const admin = createSupabaseAdminClient()
    const { data: payment, error: paymentError } = await admin
      .from('payments')
      .select('id,booking_ref,amount,customer_id,status')
      .eq('reference', String(reference))
      .maybeSingle()
    if (paymentError) throw paymentError
    if (!payment || payment.status !== 'success') return NextResponse.json({ error: 'Payment has not been verified.' }, { status: 409 })

    const { data: customer } = await admin.from('customers').select('id,user_id,name,email').eq('id', payment.customer_id).maybeSingle()
    if (!customer || customer.user_id !== user.id || !customer.email) return NextResponse.json({ error: 'Payment does not belong to this account.' }, { status: 403 })

    const { data: existing } = await admin
      .from('guest_notifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'payment')
      .contains('metadata', { payment_reference: String(reference) })
      .limit(1)
      .maybeSingle()
    if (existing) return NextResponse.json({ ok: true, alreadySent: true })

    const { data: booking } = await admin
      .from('bookings')
      .select('id,reference,room_type_id,check_in,check_out,amount')
      .eq('reference', payment.booking_ref)
      .maybeSingle()
    if (!booking) return NextResponse.json({ error: 'Booking could not be found.' }, { status: 404 })

    const { data: room } = await admin.from('room_types').select('name').eq('id', booking.room_type_id).maybeSingle()
    const email = paymentSuccessfulEmail({
      guestName: customer.name || 'Guest',
      reference: booking.reference,
      roomName: room?.name || 'Room',
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      total: Number(booking.amount),
      paymentReference: String(reference),
    })

    await sendResendEmail({ to: customer.email, subject: email.subject, html: email.html, text: email.text })

    await admin.from('guest_notifications').insert({
      id: `gn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      user_id: user.id,
      type: 'payment',
      title: 'Booking confirmed',
      body: `Payment for ${booking.reference} was verified. Your reservation is now confirmed.`,
      href: '/account/bookings',
      metadata: { booking_id: booking.id, reference: booking.reference, payment_reference: String(reference), status: 'confirmed' },
    })

    return NextResponse.json({ ok: true, alreadySent: false })
  } catch (error: any) {
    console.error('[payment-confirmation-email]', error)
    return NextResponse.json({ error: error?.message || 'Unable to send payment confirmation email.' }, { status: 500 })
  }
}
