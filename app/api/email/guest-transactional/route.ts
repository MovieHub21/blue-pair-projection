import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { sendResendEmail } from '../../../../lib/email/resend'
import {
  paymentSuccessfulEmail, paymentFailedEmail, bookingCancelledEmail, bookingModifiedEmail,
  preArrivalEmail, checkInReminderEmail, checkInWelcomeEmail, checkoutReminderEmail,
  checkoutThankYouEmail, reviewRequestEmail, serviceRequestReceivedEmail,
  serviceRequestStatusEmail,
} from '../../../../lib/email/templates'

type EventName =
  | 'payment_successful' | 'payment_failed' | 'booking_cancelled' | 'booking_modified'
  | 'pre_arrival' | 'checkin_reminder' | 'checkin_welcome' | 'checkout_reminder'
  | 'checkout_thank_you' | 'review_request' | 'service_request_received' | 'service_request_status'

const staffRoles = new Set(['admin', 'manager', 'reception', 'front_desk', 'super_admin'])

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const event = String(body.event || '') as EventName
    const bookingId = body.bookingId ? String(body.bookingId) : ''
    const requestId = body.requestId ? String(body.requestId) : ''

    const { data: staff } = await supabase.from('staff').select('role').eq('user_id', user.id).maybeSingle()
    const isStaff = !!staff && staffRoles.has(String(staff.role).toLowerCase().replace(/\s+/g, '_'))

    let booking: any = null
    if (bookingId) {
      const { data } = await supabase.from('bookings').select('*').eq('id', bookingId).maybeSingle()
      booking = data
    }

    let requestRow: any = null
    if (requestId) {
      const { data } = await supabase.from('guest_requests').select('*').eq('id', requestId).maybeSingle()
      requestRow = data
      if (!booking && requestRow?.booking_ref) {
        const { data: b } = await supabase.from('bookings').select('*').eq('reference', requestRow.booking_ref).maybeSingle()
        booking = b
      }
    }

    if (!booking && !requestRow) return NextResponse.json({ error: 'Booking or request not found' }, { status: 404 })

    let customer: any = null
    if (booking?.customer_id) {
      const { data } = await supabase.from('customers').select('id,name,email').eq('id', booking.customer_id).maybeSingle()
      customer = data
    } else if (requestRow?.customer_id) {
      const { data } = await supabase.from('customers').select('id,name,email').eq('id', requestRow.customer_id).maybeSingle()
      customer = data
    }

    const recipient = String(customer?.email || '').trim().toLowerCase()
    if (!recipient) return NextResponse.json({ error: 'Guest email not found' }, { status: 404 })
    if (!isStaff && recipient !== String(user.email || '').trim().toLowerCase()) {
      return NextResponse.json({ error: 'You cannot send an email for this guest' }, { status: 403 })
    }

    const roomType = booking?.room_type_id
      ? (await supabase.from('room_types').select('name').eq('id', booking.room_type_id).maybeSingle()).data
      : null
    const roomName = roomType?.name || 'Your reserved room'
    const guestName = customer?.name || requestRow?.guest_name || 'Guest'
    const reference = booking?.reference || requestRow?.booking_ref || 'BPH'
    const base = {
      guestName, reference, roomName,
      checkIn: booking?.check_in || '', checkOut: booking?.check_out || '',
      total: Number(booking?.amount || 0),
    }

    let email: { subject: string; html: string; text?: string }
    switch (event) {
      case 'payment_successful':
        email = paymentSuccessfulEmail({ ...base, paymentReference: body.paymentReference ? String(body.paymentReference) : undefined }); break
      case 'payment_failed':
        email = paymentFailedEmail({ ...base, reason: body.reason ? String(body.reason) : undefined }); break
      case 'booking_cancelled':
        email = bookingCancelledEmail({ ...base, reason: body.reason ? String(body.reason) : undefined }); break
      case 'booking_modified':
        email = bookingModifiedEmail({ ...base, changes: body.changes ? String(body.changes) : undefined }); break
      case 'pre_arrival':
        email = preArrivalEmail(base); break
      case 'checkin_reminder':
        email = checkInReminderEmail(base); break
      case 'checkin_welcome':
        email = checkInWelcomeEmail(base); break
      case 'checkout_reminder':
        email = checkoutReminderEmail({ guestName, reference, roomName, checkOut: base.checkOut }); break
      case 'checkout_thank_you':
        email = checkoutThankYouEmail(base); break
      case 'review_request':
        email = reviewRequestEmail({ guestName, reference, reviewUrl: body.reviewUrl ? String(body.reviewUrl) : undefined }); break
      case 'service_request_received':
        if (!requestRow) return NextResponse.json({ error: 'Request not found' }, { status: 404 })
        email = serviceRequestReceivedEmail({ guestName, bookingRef: requestRow.booking_ref || reference, type: requestRow.type, message: requestRow.message }); break
      case 'service_request_status':
        if (!requestRow) return NextResponse.json({ error: 'Request not found' }, { status: 404 })
        email = serviceRequestStatusEmail({ guestName, bookingRef: requestRow.booking_ref || reference, type: requestRow.type, message: requestRow.message, status: requestRow.status }); break
      default:
        return NextResponse.json({ error: 'Unsupported email event' }, { status: 400 })
    }

    const result = await sendResendEmail({ to: recipient, subject: email.subject, html: email.html, text: email.text })
    return NextResponse.json({ ok: true, id: result.id ?? null, event, recipient })
  } catch (error) {
    console.error('[guest-transactional-email] failed', error)
    return NextResponse.json({ error: 'Unable to send guest email' }, { status: 500 })
  }
}
