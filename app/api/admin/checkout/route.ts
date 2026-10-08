import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { enqueueBackgroundEmail } from '../../../../lib/backgroundJobs'
import { checkoutThankYouEmail } from '../../../../lib/email/templates'

export const dynamic = 'force-dynamic'

async function requireStaff() {
  const auth = createSupabaseServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return false
  const db = createSupabaseAdminClient()
  const { data } = await db.from('user_roles').select('role').eq('user_id', user.id)
  return (data ?? []).some((row: any) => ['super_admin', 'manager', 'reception', 'housekeeping'].includes(String(row.role)))
}

export async function POST(request: Request) {
  try {
    if (!(await requireStaff())) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 })
    const body = await request.json().catch(() => ({}))
    const bookingId = String(body.bookingId || '')
    if (!bookingId) return NextResponse.json({ error: 'Booking ID is required.' }, { status: 400 })

    const db = createSupabaseAdminClient()
    const { data: booking, error: bookingError } = await db.from('bookings')
      .select('id,reference,room_id,room_type_id,customer_id,status,checked_out_at,check_in,check_out,amount')
      .eq('id', bookingId).maybeSingle()
    if (bookingError) throw bookingError
    if (!booking) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
    const alreadyCheckedOut = booking.status === 'checked_out'
    const checkedOutAt = booking.checked_out_at || new Date().toISOString()
    if (!alreadyCheckedOut) {
      const { error: updateError } = await db.from('bookings')
        .update({ status: 'checked_out', checked_out_at: checkedOutAt }).eq('id', bookingId)
      if (updateError) throw updateError
    }

    const [{ data: room }, { data: roomType }, { data: customer }] = await Promise.all([
      booking.room_id ? db.from('rooms').select('room_number').eq('id', booking.room_id).maybeSingle() : Promise.resolve({ data: null }),
      booking.room_type_id ? db.from('room_types').select('name').eq('id', booking.room_type_id).maybeSingle() : Promise.resolve({ data: null }),
      booking.customer_id ? db.from('customers').select('name,email').eq('id', booking.customer_id).maybeSingle() : Promise.resolve({ data: null }),
    ])

    let guestEmailQueued = false
    let guestEmailQueueError: string | undefined
    const guestEmail = String(customer?.email || '').trim().toLowerCase()
    if (guestEmail) {
      try {
        const roomName = room?.room_number
          ? `Room ${room.room_number}${roomType?.name ? ` · ${roomType.name}` : ''}`
          : (roomType?.name || 'Your reserved room')
        const email = checkoutThankYouEmail({
          guestName: customer?.name || 'Guest',
          reference: booking.reference || booking.id,
          roomName,
          checkIn: booking.check_in || '',
          checkOut: booking.check_out || '',
        })
        await enqueueBackgroundEmail({
          to: guestEmail,
          subject: email.subject,
          html: email.html,
          text: email.text,
          idempotency_key: `booking-checkout-thank-you:${booking.id}`,
          queueKey: `checkout-thank-you:${booking.id}`,
        })
        guestEmailQueued = true
      } catch (error: any) {
        guestEmailQueueError = error?.message || 'Guest email could not be queued.'
        console.error('[admin-checkout][guest-email-queue-error]', { bookingId, message: guestEmailQueueError })
      }
    } else {
      guestEmailQueueError = 'Guest email address is missing.'
      console.warn('[admin-checkout][guest-email-missing]', { bookingId, reference: booking.reference })
    }

    if (alreadyCheckedOut) {
      return NextResponse.json({ ok: true, alreadyCheckedOut: true, guestEmailQueued, guestEmailQueueError })
    }

    if (!booking.room_id) {
      return NextResponse.json({ ok: true, checkedOutAt, guestEmailQueued, guestEmailQueueError })
    }

    const date = checkedOutAt.slice(0, 10)
    const { error: statusError } = await db.from('room_daily_statuses').upsert({
      room_id: booking.room_id,
      status: 'cleaning_required',
      status_date: date,
      notes: 'Guest checked out; cleaning required.',
      updated_at: checkedOutAt,
    }, { onConflict: 'room_id' })
    if (statusError) throw statusError
    const { error: roomUpdateError } = await db.from('rooms').update({ status: 'available' })
      .eq('id', booking.room_id).in('status', ['available', 'occupied'])
    if (roomUpdateError) throw roomUpdateError

    const { data: staff } = await db.from('staff').select('email,department,role').eq('status', 'active')
    const recipients = (staff ?? [])
      .filter((member: any) => `${member.department ?? ''} ${member.role ?? ''}`.toLowerCase().includes('housekeeping'))
      .map((member: any) => String(member.email || '').trim().toLowerCase()).filter(Boolean)
    const staffEmail = {
      subject: `Guest checkout — Room ${room?.room_number || '—'} requires cleaning`,
      html: `<div style="font-family:Arial,sans-serif"><h2>Guest checkout</h2><p>Room <strong>${room?.room_number || '—'}</strong> has checked out and is now marked <strong>Cleaning Required</strong> for ${date}.</p><p>Guest: ${customer?.name || 'Guest'}</p><p>Booking: ${booking.reference}</p></div>`,
      text: `Guest checkout. Room ${room?.room_number || '—'} requires cleaning on ${date}. Guest: ${customer?.name || 'Guest'}. Booking: ${booking.reference}.`,
    }
    const queuedStaffEmails = await Promise.all(recipients.map(async to => {
      try {
        await enqueueBackgroundEmail({ ...staffEmail, to, queueKey: `checkout-housekeeping:${booking.id}:${to}` })
        return true
      } catch (error: any) {
        console.error('[admin-checkout][staff-email-queue-error]', { to, bookingId, message: error?.message })
        return false
      }
    }))

    console.info('[admin-checkout][completed]', {
      bookingId,
      reference: booking.reference,
      roomId: booking.room_id,
      roomNumber: room?.room_number,
      date,
      guestEmailQueued,
      staffEmailsQueued: queuedStaffEmails.filter(Boolean).length,
    })
    return NextResponse.json({
      ok: true,
      checkedOutAt,
      roomStatus: 'cleaning_required',
      date,
      notified: queuedStaffEmails.filter(Boolean).length,
      guestEmailQueued,
      ...(guestEmailQueueError ? { guestEmailQueueError } : {}),
    })
  } catch (error: any) {
    console.error('[admin-checkout][error]', { message: error?.message, code: error?.code, details: error?.details, stack: error?.stack })
    return NextResponse.json({ error: error?.message || 'Could not check out guest.' }, { status: 500 })
  }
}
