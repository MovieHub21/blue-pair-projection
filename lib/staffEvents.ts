import type { SupabaseClient } from '@supabase/supabase-js'
import { notifyStaff } from './staffNotifications'


const naira = (value: unknown) => '₦' + Number(value || 0).toLocaleString('en-NG')

/** A booking was paid and confirmed (called by both the Paystack callback and webhook; sent once). */
export async function notifyBookingPaid(admin: SupabaseClient, booking: any, paymentReference: string) {
  try {
    const [{ data: customer }, { data: room }, { data: shortLet }] = await Promise.all([
      admin.from('customers').select('name').eq('id', booking.customer_id).maybeSingle(),
      booking.room_id ? admin.from('rooms').select('room_number').eq('id', booking.room_id).maybeSingle() : Promise.resolve({ data: null }),
      booking.short_let_id ? admin.from('short_lets').select('name').eq('id', booking.short_let_id).maybeSingle() : Promise.resolve({ data: null }),
    ])
    const place = shortLet?.name ? shortLet.name : room?.room_number ? `Room ${room.room_number}` : 'Room'
    await notifyStaff(admin, {
      audiences: [{ department: 'reception', href: '/admin/bookings' }],
      type: 'booking',
      title: `New paid booking — ${booking.reference}`,
      body: `${customer?.name || 'Guest'} · ${place} · ${booking.check_in} → ${booking.check_out} · ${naira(booking.amount)}`,
      metadata: { booking_reference: booking.reference, payment_reference: paymentReference },
      dedupeKey: `booking_paid:${booking.reference}`,
    })
  } catch (error) { console.error('[staff-events] booking paid', error) }
}

/** An Annex Bar order was paid: the bar team prepares it. */
export async function notifyBarOrderPaid(admin: SupabaseClient, order: { reference: string; label?: string; items: any[]; total: unknown }) {
  try {
    const items = (order.items || []).slice(0, 4).map(item => `${item.quantity}× ${item.drinkName || item.name}`).join(', ')
    await notifyStaff(admin, {
      audiences: [{ department: 'bar', href: '/admin/annex' }],
      type: 'bar_order',
      title: `New Annex Bar order — ${order.label || 'Bar'}`,
      body: `${items} · ${naira(order.total)} (paid)`,
      metadata: { bar_order_reference: order.reference },
      dedupeKey: `bar_order_paid:${order.reference}`,
    })
  } catch (error) { console.error('[staff-events] bar order', error) }
}

/** A guest wrote to the hotel through the contact form or an open conversation: reception answers. */
export async function notifyContactMessage(admin: SupabaseClient, input: { conversationId: string; guestName: string; subject: string; isReply: boolean }) {
  try {
    await notifyStaff(admin, {
      audiences: [{ department: 'reception', href: `/admin/contact-messages?conversation=${input.conversationId}` }],
      type: 'message',
      title: input.isReply ? `New guest reply — ${input.subject}` : `New guest message — ${input.subject}`,
      body: `${input.guestName} wrote to the hotel.`,
      metadata: { conversation_id: input.conversationId },
    })
  } catch (error) { console.error('[staff-events] contact message', error) }
}

/** A guest asked to reserve a place at an event: reception (who also gets the email) follows up. */
export async function notifyEventReservation(admin: SupabaseClient, input: { reservationId: string; guestName: string; eventTitle: string; guestCount: number }) {
  try {
    await notifyStaff(admin, {
      audiences: [{ department: 'reception', href: '/admin/events' }],
      type: 'event_reservation',
      title: `New event reservation — ${input.eventTitle}`,
      body: `${input.guestName} · ${input.guestCount} ${input.guestCount === 1 ? 'guest' : 'guests'}`,
      metadata: { reservation_id: input.reservationId },
      dedupeKey: `event_reservation:${input.reservationId}`,
    })
  } catch (error) { console.error('[staff-events] event reservation', error) }
}

/** A checked-in guest sent a request from their room. Each kind of request goes to the team that handles it. */
export async function notifyGuestRequest(admin: SupabaseClient, input: { requestId: string; type: string; room: string; guestName: string; message: string }) {
  try {
    const type = String(input.type || '').toLowerCase()
    const isHousekeeping = type === 'housekeeping' || type === 'extra towels'
    const department = type === 'maintenance' ? 'maintenance' : isHousekeeping ? 'housekeeping' : 'reception'
    const href = department === 'maintenance' ? '/admin/maintenance/tickets' : department === 'housekeeping' ? '/admin/housekeeping/tasks' : '/admin/reception/requests'
    await notifyStaff(admin, {
      audiences: [{ department, href }],
      type: 'guest_request',
      title: `${input.type || 'Guest request'} — Room ${input.room || '—'}`,
      body: `${input.guestName || 'Guest'}: ${input.message || 'No additional details.'}`.slice(0, 300),
      metadata: { request_id: input.requestId },
      dedupeKey: `guest_request:${input.requestId}`,
    })
  } catch (error) { console.error('[staff-events] guest request', error) }
}
