import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../../../lib/supabase/server'
import { createSupabaseAdminClient } from '../../../../../../lib/supabase/admin'
import { enqueueBackgroundEmail } from '../../../../../../lib/backgroundJobs'
import { bookingCancelledEmail, bookingCancellationReceptionEmail } from '../../../../../../lib/email/templates'
import { resolveDepartmentStaff } from '../../../../../../lib/staffRecipients'
import { notifyStaff } from '../../../../../../lib/staffNotifications'

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const server = createSupabaseServerClient()
    const { data: { user } } = await server.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Sign in to cancel this booking.' }, { status: 401 })

    const admin = createSupabaseAdminClient()
    const { data: booking, error: bookingError } = await admin
      .from('bookings')
      .select('id,reference,customer_id,room_type_id,room_id,check_in,check_out,amount,payment_status,status')
      .eq('id', params.id)
      .maybeSingle()
    if (bookingError) throw bookingError
    if (!booking) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })

    const { data: customer, error: customerError } = await admin
      .from('customers')
      .select('user_id,name,email')
      .eq('id', booking.customer_id)
      .maybeSingle()
    if (customerError) throw customerError
    if (customer?.user_id !== user.id) return NextResponse.json({ error: 'You cannot cancel this booking.' }, { status: 403 })
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return NextResponse.json({ error: 'This booking can no longer be cancelled.' }, { status: 409 })
    }

    const { data: cancelled, error: cancelError } = await admin
      .from('bookings')
      .update({ status: 'cancelled', reservation_expires_at: null })
      .eq('id', booking.id)
      .in('status', ['pending', 'confirmed'])
      .select('id')
      .maybeSingle()
    if (cancelError) throw cancelError
    if (!cancelled) return NextResponse.json({ error: 'This booking has already changed and could not be cancelled.' }, { status: 409 })

    const [{ data: room }, { data: roomType }] = await Promise.all([
      booking.room_id
        ? admin.from('rooms').select('room_number').eq('id', booking.room_id).maybeSingle()
        : Promise.resolve({ data: null }),
      booking.room_type_id
        ? admin.from('room_types').select('name').eq('id', booking.room_type_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ])
    const guestName = String(customer?.name || 'Guest')
    const guestEmail = String(customer?.email || user.email || '').trim().toLowerCase()
    const roomName = room?.room_number
      ? `Room ${room.room_number} · ${roomType?.name || 'Blue Pair room'}`
      : roomType?.name || 'Your reserved room'
    const details = {
      guestName,
      guestEmail,
      reference: booking.reference,
      roomName,
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      total: Number(booking.amount || 0),
    }

    if (guestEmail) {
      const guestEmailContent = bookingCancelledEmail(details)
      await enqueueBackgroundEmail({
        to: guestEmail,
        subject: guestEmailContent.subject,
        html: guestEmailContent.html,
        text: guestEmailContent.text,
        queueKey: `booking-cancelled:${booking.id}`,
      }).catch(error => console.error('[booking-cancellation] guest email queue failed', error))
    }

    await notifyStaff(admin, {
      audiences: [{ department: 'reception', href: '/admin/bookings' }],
      type: 'booking',
      title: `Guest cancelled booking — ${booking.reference}`,
      body: `${guestName} · ${roomName} · ${booking.check_in} → ${booking.check_out}`,
      metadata: { booking_id: booking.id, booking_reference: booking.reference, payment_status: booking.payment_status },
      dedupeKey: `booking_cancelled_by_guest:${booking.id}`,
    })

    try {
      const reception = await resolveDepartmentStaff(admin, 'reception')
      const staffEmail = bookingCancellationReceptionEmail({
        ...details,
        paymentStatus: booking.payment_status === 'paid' ? 'Paid' : 'Payment pending',
      })
      await Promise.all(reception.filter(member => member.email).map(member =>
        enqueueBackgroundEmail({
          to: member.email,
          subject: staffEmail.subject,
          html: staffEmail.html,
          text: staffEmail.text,
          include_account_cta: false,
          queueKey: `booking-cancelled-reception:${booking.id}:${member.userId || member.email}`,
        }).catch(error => console.error('[booking-cancellation] reception email failed', { bookingId: booking.id, message: error?.message }))
      ))
    } catch (error: any) {
      console.error('[booking-cancellation] reception notification failed', { bookingId: booking.id, message: error?.message })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[booking-cancellation] failed', error)
    return NextResponse.json({ error: 'Unable to cancel booking.' }, { status: 500 })
  }
}
