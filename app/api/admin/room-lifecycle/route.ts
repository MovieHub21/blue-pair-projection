import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { reservationReadyEmail } from '../../../../lib/email/templates'
import { sendResendEmail } from '../../../../lib/email/resend'
import { notifyGuestRequest } from '../../../../lib/staffEvents'
import { notifyRoomTask } from '../../../../lib/roomTaskNotifications'

export const dynamic = 'force-dynamic'
type Action = 'status' | 'checkout' | 'maintenance_request' | 'guest_request'
function escapeHtml(value: unknown) { return String(value ?? '').replace(/[&<>\"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#039;' })[char] || char) }
function overlaps(start: string, end: string, bookingStart: string, bookingEnd: string) { return start < bookingEnd && end > bookingStart }
const HOLD_MINUTES = 10

async function requireStaff() {
  const auth = createSupabaseServerClient(); const { data: { user } } = await auth.auth.getUser(); if (!user) return null
  const admin = createSupabaseAdminClient(); const { data: roleRows } = await admin.from('user_roles').select('role').eq('user_id', user.id)
  const roles = (roleRows ?? []).map((r: any) => String(r.role)); if (!roles.some(role => ['super_admin', 'manager', 'reception', 'housekeeping', 'maintenance'].includes(role))) return null
  return user
}

// Emails the department AND puts the same message in its staff notifications. Both use the same
// department staff list (lib/staffRecipients.ts), so a message only ever reaches the team it is for.
async function sendToDepartment(department: 'housekeeping' | 'maintenance', subject: string, html: string, text: string, dedupeKey: string) {
  const admin = createSupabaseAdminClient()
  return notifyRoomTask({ admin, department, subject, html, text, dedupeKey })
}

async function ensureMaintenanceRequestTicket(admin: ReturnType<typeof createSupabaseAdminClient>, requestRow: { id: string; room: string | null; guest_name: string | null; message: string | null; booking_ref: string | null }) {
  const requestNote = `Request ID: ${requestRow.id}`
  const { data: existing, error: lookupError } = await admin.from('maintenance_tickets').select('id').ilike('notes', `%${requestNote}%`).maybeSingle()
  if (lookupError) throw lookupError
  if (existing) return existing.id
  const { data: created, error } = await admin.from('maintenance_tickets').insert({
    room: requestRow.room || '—',
    issue: `Guest request: ${String(requestRow.message || 'Maintenance request').slice(0, 160)}`,
    priority: 'Medium', assigned_to: 'Unassigned', date_reported: new Date().toISOString().slice(0, 10), status: 'open',
    notes: `Guest: ${requestRow.guest_name || 'Guest'} · Booking: ${requestRow.booking_ref || '—'} · ${requestNote}`,
  }).select('id').maybeSingle()
  if (error) throw error
  return created?.id
}

async function notifyReadyReservations(admin: ReturnType<typeof createSupabaseAdminClient>, roomId: string) {
  const { data: pending, error } = await admin.from('bookings').select('id,reference,customer_id,room_id,room_type_id,status,payment_status,check_in,check_out').eq('status', 'pending').eq('payment_status', 'pending').eq('room_id', roomId)
  if (error) throw error
  const room = (await admin.from('rooms').select('room_number,status').eq('id', roomId).maybeSingle()).data
  if (!room || room.status !== 'available') return 0
  let sent = 0
  const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000).toISOString()
  for (const booking of pending ?? []) {
    const { data: existing } = await admin.from('email_logs').select('id').eq('dedupe_key', `reservation_ready:${booking.id}`).maybeSingle()
    if (existing) continue
    const { data: blocking } = await admin.from('bookings').select('id,check_in,check_out').eq('room_id', roomId).in('status', ['confirmed', 'checked_in']).eq('payment_status', 'paid')
    if ((blocking ?? []).some(b => overlaps(booking.check_in, booking.check_out, b.check_in, b.check_out))) continue
    await admin.from('bookings').update({ reservation_expires_at: expiresAt }).eq('id', booking.id).eq('status', 'pending').eq('payment_status', 'pending')
    const customer = (await admin.from('customers').select('name,email,user_id').eq('id', booking.customer_id).maybeSingle()).data
    const recipient = String(customer?.email || '').trim().toLowerCase()
    if (!recipient) continue
    const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bluepairhotel.com'
    const paymentUrl = `${site}/account/bookings`
    const baseEmail = reservationReadyEmail({ guestName: customer?.name || 'Guest', reference: booking.reference, roomNumber: room.room_number, paymentUrl })
    const timerText = `You have ${HOLD_MINUTES} minutes from this email to complete payment. If payment is not completed within ${HOLD_MINUTES} minutes, this reservation hold will automatically expire so the room can be offered again.`
    const email = { subject: baseEmail.subject, text: `${baseEmail.text}\n\n${timerText}`, html: baseEmail.html.replace('</div></body></html>', `<p style="margin:20px 0;padding:14px;background:#fff8e8;border:1px solid #ecd9a7;border-radius:8px;color:#6b4f00"><strong>${HOLD_MINUTES}-minute payment hold:</strong> ${timerText}</p></div></body></html>`) }
    const result = await sendResendEmail({ to: recipient, subject: email.subject, html: email.html, text: email.text })
    const { error: logError } = await admin.from('email_logs').insert({ dedupe_key: `reservation_ready:${booking.id}`, event: 'reservation_ready', booking_id: booking.id, recipient, subject: email.subject, resend_id: result.id ?? null })
    if (logError) continue
    sent++
    if (customer?.user_id) await admin.from('guest_notifications').insert({ user_id: customer.user_id, type: 'reservation_ready', title: 'Your reserved room is available', body: `Room ${room.room_number} is now available. You have ${HOLD_MINUTES} minutes to complete payment and secure it.`, href: '/account/bookings', metadata: { booking_id: booking.id, booking_reference: booking.reference, reservation_expires_at: expiresAt, automation: true } })
  }
  return sent
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as { action?: Action; roomId?: string; status?: string; bookingId?: string; requestId?: string }
    const action = body.action
    if (!action || !['status', 'checkout', 'maintenance_request', 'guest_request'].includes(action)) return NextResponse.json({ error: 'Invalid lifecycle action.' }, { status: 400 })
    const admin = createSupabaseAdminClient()
    if (action === 'guest_request') {
      // A signed-in guest reporting their own request. Maintenance also emails the maintenance team, as before.
      if (!body.requestId) return NextResponse.json({ error: 'Request ID is required.' }, { status: 400 })
      const guestAuth = createSupabaseServerClient(); const { data: { user: guestUser } } = await guestAuth.auth.getUser()
      if (!guestUser) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
      const { data: requestRow } = await admin.from('guest_requests').select('id,room,guest_name,type,message,booking_ref,customer_id').eq('id', body.requestId).maybeSingle()
      if (!requestRow) return NextResponse.json({ error: 'Request not found.' }, { status: 404 })
      const { data: owner } = await admin.from('customers').select('id').eq('user_id', guestUser.id).maybeSingle()
      if (!owner || owner.id !== requestRow.customer_id) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 })
      if (String(requestRow.type).toLowerCase() === 'maintenance') {
        const room = escapeHtml(requestRow.room || '—'), guest = escapeHtml(requestRow.guest_name || 'Guest'), message = escapeHtml(requestRow.message || 'No additional details.')
        await ensureMaintenanceRequestTicket(admin, requestRow)
        const count = await sendToDepartment('maintenance', `Maintenance request — Room ${requestRow.room || '—'}`, `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#0a1229"><h2>New maintenance request</h2><p><strong>Room:</strong> ${room}</p><p><strong>Guest:</strong> ${guest}</p><p><strong>Details:</strong><br>${message}</p><p><strong>Booking:</strong> ${escapeHtml(requestRow.booking_ref || '—')}</p></div>`, `New maintenance request. Room: ${requestRow.room || '—'}. Guest: ${requestRow.guest_name || 'Guest'}. Details: ${requestRow.message || 'No additional details.'}`, `maintenance-guest-request:${requestRow.id}`)
        return NextResponse.json({ ok: true, notified: count })
      }
      await notifyGuestRequest(admin, { requestId: requestRow.id, type: requestRow.type, room: requestRow.room, guestName: requestRow.guest_name, message: requestRow.message })
      return NextResponse.json({ ok: true })
    }
    if (action === 'maintenance_request') {
      if (!body.requestId) return NextResponse.json({ error: 'Request ID is required.' }, { status: 400 })
      const { data: requestRow } = await admin.from('guest_requests').select('id,room,guest_name,type,message,booking_ref').eq('id', body.requestId).maybeSingle()
      if (!requestRow) return NextResponse.json({ error: 'Request not found.' }, { status: 404 })
      if (String(requestRow.type).toLowerCase() !== 'maintenance') return NextResponse.json({ ok: true, notified: 0 })
      const room = escapeHtml(requestRow.room || '—'), guest = escapeHtml(requestRow.guest_name || 'Guest'), message = escapeHtml(requestRow.message || 'No additional details.')
      await ensureMaintenanceRequestTicket(admin, requestRow)
      const count = await sendToDepartment('maintenance', `Maintenance request — Room ${requestRow.room || '—'}`, `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#0a1229"><h2>New maintenance request</h2><p><strong>Room:</strong> ${room}</p><p><strong>Guest:</strong> ${guest}</p><p><strong>Details:</strong><br>${message}</p><p><strong>Booking:</strong> ${escapeHtml(requestRow.booking_ref || '—')}</p></div>`, `New maintenance request. Room: ${requestRow.room || '—'}. Guest: ${requestRow.guest_name || 'Guest'}. Details: ${requestRow.message || 'No additional details.'}. Booking: ${requestRow.booking_ref || '—'}.`, `maintenance-guest-request:${requestRow.id}`)
      return NextResponse.json({ ok: true, notified: count })
    }
    const user = await requireStaff(); if (!user) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 })
    if (action === 'status') {
      if (!body.roomId || !['available', 'cleaning', 'maintenance', 'available_soon'].includes(body.status || '')) return NextResponse.json({ error: 'Invalid room status update.' }, { status: 400 })
      const { data: room, error: roomError } = await admin.from('rooms').select('id,room_number,status,room_type_id').eq('id', body.roomId).maybeSingle()
      if (roomError) throw roomError
      if (!room) return NextResponse.json({ error: 'Room not found.' }, { status: 404 })
      const previousStatus = room.status
      const { error: updateError } = await admin.from('rooms').update({ status: body.status }).eq('id', body.roomId); if (updateError) throw updateError
      let notified = 0
      if (body.status === 'cleaning') {
        const { data: existing } = await admin.from('housekeeping_tasks').select('id').eq('room_id', room.id).neq('status', 'completed').maybeSingle()
        if (!existing) {
          const roomType = (await admin.from('room_types').select('name').eq('id', room.room_type_id).maybeSingle()).data
          const { data: task, error: taskError } = await admin.from('housekeeping_tasks').insert({ id: `hk_${crypto.randomUUID()}`, room: room.room_number, room_type: roomType?.name || '', checkout_time: new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }), priority: 'High', assigned_to: 'Unassigned', status: 'pending', notes: 'Room manually marked for cleaning.', room_id: room.id }).select('id').maybeSingle()
          if (taskError) throw taskError
          if (task) notified = await sendToDepartment('housekeeping', `Room ${room.room_number} requires housekeeping`, `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#0a1229"><h2>New housekeeping task</h2><p>Room <strong>${escapeHtml(room.room_number)}</strong> is waiting for a cleaner.</p></div>`, `Room ${room.room_number} is waiting for housekeeping.`, `housekeeping-task:${task.id}`)
        }
      }
      if (body.status === 'maintenance') {
        let { data: ticket, error: ticketError } = await admin.from('maintenance_tickets').select('id').eq('room', room.room_number).not('status', 'in', '(resolved,closed,completed)').order('date_reported', { ascending: false }).limit(1).maybeSingle()
        if (ticketError) throw ticketError
        if (!ticket) {
          const created = await admin.from('maintenance_tickets').insert({ room: room.room_number, issue: 'Room marked for maintenance', priority: 'Medium', assigned_to: 'Unassigned', date_reported: new Date().toISOString().slice(0, 10), status: 'open', notes: 'Created when room status was changed to maintenance.' }).select('id').maybeSingle()
          if (created.error) throw created.error
          ticket = created.data
        }
        if (ticket) notified = await sendToDepartment('maintenance', `Maintenance required — Room ${room.room_number}`, `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#0a1229"><h2>New maintenance task</h2><p>Room <strong>${escapeHtml(room.room_number)}</strong> has been marked for maintenance. A technician can accept it or reception can assign it.</p></div>`, `Room ${room.room_number} has been marked for maintenance. A technician can accept it or reception can assign it.`, `maintenance-task:${ticket.id}`)
      }
      if (body.status === 'available') return NextResponse.json({ ok: true, status: body.status, notified, reservationsReady: previousStatus !== 'available' ? await notifyReadyReservations(admin, room.id) : 0 })
      return NextResponse.json({ ok: true, status: body.status, notified })
    }
    if (!body.bookingId) return NextResponse.json({ error: 'Booking ID is required.' }, { status: 400 })
    const { data: booking, error: bookingError } = await admin.from('bookings').select('id,reference,room_id,customer_id,status').eq('id', body.bookingId).maybeSingle()
    if (bookingError) throw bookingError
    if (!booking) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
    const { error: checkoutError } = await admin.from('bookings').update({ status: 'checked_out', checked_out_at: new Date().toISOString() }).eq('id', booking.id); if (checkoutError) throw checkoutError
    if (!booking.room_id) return NextResponse.json({ ok: true, notified: 0 })
    await admin.from('rooms').update({ status: 'cleaning_required' }).eq('id', booking.room_id)
    const room = (await admin.from('rooms').select('room_number').eq('id', booking.room_id).maybeSingle()).data
    const customer = (await admin.from('customers').select('name').eq('id', booking.customer_id).maybeSingle()).data
    const notified = await sendToDepartment('housekeeping', `Guest checkout — Room ${room?.room_number || '—'} requires cleaning`, `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#0a1229"><h2>Guest checkout</h2><p>Room <strong>${escapeHtml(room?.room_number || '—')}</strong> has just been checked out.</p><p><strong>Guest:</strong> ${escapeHtml(customer?.name || 'Guest')}</p><p>The room is now waiting for a cleaner.</p></div>`, `Guest checkout. Room ${room?.room_number || '—'} requires cleaning. Guest: ${customer?.name || 'Guest'}. Booking: ${booking.reference}.`, `housekeeping-checkout:${booking.id}`)
    return NextResponse.json({ ok: true, notified })
  } catch (error: any) {
    console.error('[room-lifecycle]', error)
    return NextResponse.json({ error: error?.message || 'Room lifecycle action failed.' }, { status: 500 })
  }
}
