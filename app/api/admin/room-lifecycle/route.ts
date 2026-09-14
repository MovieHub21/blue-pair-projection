import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { sendResendEmail } from '../../../../lib/email/resend'

export const dynamic = 'force-dynamic'

type Action = 'status' | 'checkout' | 'maintenance_request'

function escapeHtml(value: unknown) {
  return String(value ?? '').replace(/[&<>\"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#039;' })[char] || char)
}

function overlaps(start: string, end: string, bookingStart: string, bookingEnd: string) { return start < bookingEnd && end > bookingStart }

async function requireStaff() {
  const auth = createSupabaseServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return null
  const admin = createSupabaseAdminClient()
  // Blue Pair's authoritative staff access is user_roles, not the legacy staff table.
  const { data: roleRows } = await admin.from('user_roles').select('role').eq('user_id', user.id)
  const roles = (roleRows ?? []).map((r: any) => String(r.role))
  if (!roles.some(role => ['super_admin', 'manager', 'reception', 'housekeeping', 'maintenance'].includes(role))) return null
  return user
}

async function sendToDepartment(department: 'housekeeping' | 'maintenance', subject: string, html: string, text: string) {
  const admin = createSupabaseAdminClient()
  const { data: staff } = await admin.from('staff').select('email,name,department,role').eq('status', 'active')
  const recipients = (staff ?? []).filter(s => `${s.department ?? ''} ${s.role ?? ''}`.toLowerCase().includes(department)).map(s => String(s.email || '').trim().toLowerCase()).filter(Boolean)
  await Promise.all(recipients.map(to => sendResendEmail({ to, subject, html, text }).catch(error => { console.error(`[room-lifecycle] ${department} notification failed`, error); return null })))
  return recipients.length
}

async function notifyReadyReservations(admin: ReturnType<typeof createSupabaseAdminClient>, roomId: string) {
  const { data: pending, error } = await admin.from('bookings').select('id,reference,customer_id,room_id,room_type_id,check_in,check_out,amount,status,payment_status').eq('status', 'pending').eq('payment_status', 'pending').eq('room_id', roomId)
  if (error) throw error
  const room = (await admin.from('rooms').select('room_number,status').eq('id', roomId).maybeSingle()).data
  if (!room || room.status !== 'available') return 0
  let sent = 0
  for (const booking of pending ?? []) {
    const { data: existing } = await admin.from('email_logs').select('id').eq('dedupe_key', `reservation_ready:${booking.id}`).maybeSingle()
    if (existing) continue
    const { data: blocking } = await admin.from('bookings').select('id,check_in,check_out').eq('room_id', roomId).in('status', ['confirmed', 'checked_in']).eq('payment_status', 'paid')
    if ((blocking ?? []).some(b => overlaps(booking.check_in, booking.check_out, b.check_in, b.check_out))) continue
    const customer = (await admin.from('customers').select('name,email,user_id').eq('id', booking.customer_id).maybeSingle()).data
    const recipient = String(customer?.email || '').trim().toLowerCase()
    if (!recipient) continue
    const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bluepairhotel.com'
    const paymentUrl = `${site}/account/bookings`
    const subject = 'Your Blue Pair room is available — payment can now secure it'
    const html = `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#0a1229"><h2>Your room is ready to secure</h2><p>Hello ${escapeHtml(customer?.name || 'Guest')},</p><p>Room ${escapeHtml(room.room_number)} is now available for your stay from <strong>${escapeHtml(booking.check_in)}</strong> to <strong>${escapeHtml(booking.check_out)}</strong>.</p><p>Your reservation is still unpaid. <strong>The first successful payment secures the room.</strong></p><p><a href="${paymentUrl}" style="display:inline-block;background:#c79a3e;color:#0a1229;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">Open my booking &amp; pay</a></p><p style="font-size:13px;color:#667085">Reservation reference: ${escapeHtml(booking.reference)} · Room ${escapeHtml(room.room_number)}</p></div>`
    const text = `Hello ${customer?.name || 'Guest'}, room ${room.room_number} is now available. Your reservation is unpaid and the first successful payment secures it. Open ${paymentUrl} to pay. Reference: ${booking.reference}.`
    const result = await sendResendEmail({ to: recipient, subject, html, text })
    const { error: logError } = await admin.from('email_logs').insert({ dedupe_key: `reservation_ready:${booking.id}`, event: 'reservation_ready', booking_id: booking.id, recipient, subject, resend_id: result.id ?? null })
    if (logError) continue
    sent++
    if (customer?.user_id) await admin.from('guest_notifications').insert({ user_id: customer.user_id, type: 'reservation_ready', title: 'Your reserved room is available', body: `Room ${room.room_number} is now available. Pay to secure your reservation.`, href: '/account/bookings', metadata: { booking_id: booking.id, booking_reference: booking.reference, automation: true } })
  }
  return sent
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as { action?: Action; roomId?: string; status?: string; bookingId?: string; requestId?: string }
    const action = body.action
    if (!action || !['status', 'checkout', 'maintenance_request'].includes(action)) return NextResponse.json({ error: 'Invalid lifecycle action.' }, { status: 400 })
    const admin = createSupabaseAdminClient()
    if (action === 'maintenance_request') {
      if (!body.requestId) return NextResponse.json({ error: 'Request ID is required.' }, { status: 400 })
      const { data: requestRow } = await admin.from('guest_requests').select('id,room,guest_name,type,message,booking_ref').eq('id', body.requestId).maybeSingle()
      if (!requestRow) return NextResponse.json({ error: 'Request not found.' }, { status: 404 })
      if (String(requestRow.type).toLowerCase() !== 'maintenance') return NextResponse.json({ ok: true, notified: 0 })
      const room = escapeHtml(requestRow.room || '—'), guest = escapeHtml(requestRow.guest_name || 'Guest'), message = escapeHtml(requestRow.message || 'No additional details.')
      const count = await sendToDepartment('maintenance', `Maintenance request — Room ${requestRow.room || '—'}`, `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#0a1229"><h2>New maintenance request</h2><p><strong>Room:</strong> ${room}</p><p><strong>Guest:</strong> ${guest}</p><p><strong>Details:</strong><br>${message}</p><p><strong>Booking:</strong> ${escapeHtml(requestRow.booking_ref || '—')}</p></div>`, `New maintenance request. Room: ${requestRow.room || '—'}. Guest: ${requestRow.guest_name || 'Guest'}. Details: ${requestRow.message || 'No additional details.'}. Booking: ${requestRow.booking_ref || '—'}.`)
      return NextResponse.json({ ok: true, notified: count })
    }
    const user = await requireStaff()
    if (!user) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 })
    if (action === 'status') {
      if (!body.roomId || !['available', 'occupied', 'cleaning', 'cleaning_required', 'maintenance'].includes(body.status || '')) return NextResponse.json({ error: 'Invalid room status update.' }, { status: 400 })
      const { data: room, error: roomError } = await admin.from('rooms').select('id,room_number,status,room_type_id').eq('id', body.roomId).maybeSingle()
      if (roomError) throw roomError
      if (!room) return NextResponse.json({ error: 'Room not found.' }, { status: 404 })
      const { error: updateError } = await admin.from('rooms').update({ status: body.status }).eq('id', body.roomId)
      if (updateError) throw updateError
      let notified = 0
      if (body.status === 'cleaning' || body.status === 'cleaning_required') {
        const { data: existing } = await admin.from('housekeeping_tasks').select('id').eq('room_id', room.id).neq('status', 'completed').maybeSingle()
        if (!existing) {
          const roomType = (await admin.from('room_types').select('name').eq('id', room.room_type_id).maybeSingle()).data
          await admin.from('housekeeping_tasks').insert({ id: `hk_${Date.now()}`, room: room.room_number, room_type: roomType?.name || '', checkout_time: new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }), priority: body.status === 'cleaning_required' ? 'High' : 'Normal', assigned_to: 'Unassigned', status: body.status === 'cleaning' ? 'in_progress' : 'pending', notes: body.status === 'cleaning_required' ? 'Room requires cleaning after status change.' : 'Room manually marked for cleaning.', room_id: room.id })
        }
        notified = await sendToDepartment('housekeeping', `Room ${room.room_number} requires housekeeping`, `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#0a1229"><h2>Housekeeping required</h2><p>Room <strong>${escapeHtml(room.room_number)}</strong> has been marked <strong>${escapeHtml(body.status)}</strong>.</p><p>Please attend to the room and mark the housekeeping task complete when ready.</p></div>`, `Room ${room.room_number} has been marked ${body.status}. Please attend to it and mark the housekeeping task complete when ready.`)
      }
      if (body.status === 'maintenance') notified = await sendToDepartment('maintenance', `Maintenance required — Room ${room.room_number}`, `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#0a1229"><h2>Room sent to maintenance</h2><p>Room <strong>${escapeHtml(room.room_number)}</strong> has been marked <strong>maintenance</strong>.</p></div>`, `Room ${room.room_number} has been marked maintenance. Please inspect it.`)
      if (body.status === 'available') return NextResponse.json({ ok: true, status: body.status, notified, reservationsReady: await notifyReadyReservations(admin, room.id) })
      return NextResponse.json({ ok: true, status: body.status, notified })
    }
    if (!body.bookingId) return NextResponse.json({ error: 'Booking ID is required.' }, { status: 400 })
    const { data: booking, error: bookingError } = await admin.from('bookings').select('id,reference,room_id,customer_id,status').eq('id', body.bookingId).maybeSingle()
    if (bookingError) throw bookingError
    if (!booking) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
    const { error: checkoutError } = await admin.from('bookings').update({ status: 'checked_out', checked_out_at: new Date().toISOString() }).eq('id', booking.id)
    if (checkoutError) throw checkoutError
    if (!booking.room_id) return NextResponse.json({ ok: true, notified: 0 })
    await admin.from('rooms').update({ status: 'cleaning_required' }).eq('id', booking.room_id)
    const room = (await admin.from('rooms').select('room_number').eq('id', booking.room_id).maybeSingle()).data
    const customer = (await admin.from('customers').select('name').eq('id', booking.customer_id).maybeSingle()).data
    const notified = await sendToDepartment('housekeeping', `Guest checkout — Room ${room?.room_number || '—'} requires cleaning`, `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#0a1229"><h2>Guest checkout</h2><p>Room <strong>${escapeHtml(room?.room_number || '—')}</strong> has just been checked out.</p><p><strong>Guest:</strong> ${escapeHtml(customer?.name || 'Guest')}</p><p>The room is now marked <strong>Cleaning Required</strong>.</p></div>`, `Guest checkout. Room ${room?.room_number || '—'} requires cleaning. Guest: ${customer?.name || 'Guest'}. Booking: ${booking.reference}.`)
    return NextResponse.json({ ok: true, notified })
  } catch (error: any) {
    console.error('[room-lifecycle]', error)
    return NextResponse.json({ error: error?.message || 'Room lifecycle action failed.' }, { status: 500 })
  }
}
