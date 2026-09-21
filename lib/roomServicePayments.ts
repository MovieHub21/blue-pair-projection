import type { SupabaseClient } from '@supabase/supabase-js'
import { notifyStaff } from './staffNotifications'

/**
 * Room-service payments are their own kind of payment: they are matched to a room-service order, never
 * to a room booking. Payment references for these orders start with "RS-".
 */
export const isRoomServiceReference = (reference: unknown) => String(reference ?? '').startsWith('RS-')

export type RoomServiceSettlement =
  | { ok: true; alreadyPaid: boolean; order: any }
  | { ok: false; reason: 'payment_not_found' | 'order_not_found' | 'amount_mismatch' | 'update_failed' }

const naira = (value: number) => '₦' + Number(value || 0).toLocaleString('en-NG')

function itemSummary(items: any[]) {
  const list = Array.isArray(items) ? items : []
  const text = list.slice(0, 4).map(item => `${item.quantity}× ${item.name}`).join(', ')
  return list.length > 4 ? `${text} and ${list.length - 4} more` : text
}

/**
 * Marks a room-service order as paid once Paystack has confirmed the money. It is safe to call twice
 * (the callback and the webhook both do): the order is only marked, and staff only told, the first time.
 */
export async function settleRoomServicePayment(admin: SupabaseClient, paymentReference: string, paidAmountKobo: number): Promise<RoomServiceSettlement> {
  const { data: payment } = await admin.from('payments').select('id,booking_ref,amount,status,customer_id').eq('reference', paymentReference).maybeSingle()
  if (!payment || !isRoomServiceReference(payment.booking_ref)) return { ok: false, reason: 'payment_not_found' }

  const { data: order } = await admin.from('room_service_orders').select('*').eq('payment_reference', paymentReference).maybeSingle()
  if (!order) return { ok: false, reason: 'order_not_found' }

  const expected = Math.round(Number(order.total) * 100)
  if (Number(paidAmountKobo) !== expected || Math.round(Number(payment.amount) * 100) !== expected) return { ok: false, reason: 'amount_mismatch' }
  if (order.payment_status === 'paid') return { ok: true, alreadyPaid: true, order }

  const paidOn = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })
  const { error: paymentError } = await admin.from('payments').update({ status: 'success', method: 'Paystack', date: paidOn }).eq('id', payment.id).in('status', ['pending', 'failed'])
  if (paymentError) { console.error('[room-service-payment] payment update failed', paymentError.message); return { ok: false, reason: 'update_failed' } }

  // Only the request that flips the order from unpaid to paid continues, so nothing is sent twice.
  const { data: updated, error: orderError } = await admin.from('room_service_orders').update({ payment_status: 'paid', status: 'pending' }).eq('id', order.id).in('payment_status', ['pending', 'failed']).select('*').maybeSingle()
  if (orderError) { console.error('[room-service-payment] order update failed', orderError.message); return { ok: false, reason: 'update_failed' } }
  if (!updated) return { ok: true, alreadyPaid: true, order }

  const { data: customer } = await admin.from('customers').select('user_id').eq('id', updated.customer_id).maybeSingle()
  if (customer?.user_id) {
    await admin.from('guest_notifications').insert({
      user_id: customer.user_id,
      type: 'payment',
      title: 'Room-service payment received',
      body: `Payment for order ${updated.reference} was verified. The restaurant is now preparing your order.`,
      href: '/account/requests',
      metadata: { payment_reference: paymentReference, room_service_reference: updated.reference },
    }).then(({ error }) => { if (error) console.error('[room-service-payment] guest notification failed', error.message) })
  }

  await notifyStaff(admin, {
    audiences: [
      { department: 'restaurant', href: '/admin/restaurant/orders' },
      { department: 'reception', href: '/admin/reception/room-service' },
    ],
    managementHref: '/admin/restaurant/orders',
    type: 'room_service',
    title: `New room-service order — Room ${updated.room}`,
    body: `${updated.guest_name || 'Guest'} · ${itemSummary(updated.items)} · ${naira(updated.total)} (paid)`,
    metadata: { room_service_reference: updated.reference, room: updated.room },
    dedupeKey: `room_service_paid:${updated.reference}`,
  })

  return { ok: true, alreadyPaid: false, order: updated }
}

/** The guest closed or failed the payment: the order was never paid and will not reach the restaurant. */
export async function failRoomServicePayment(admin: SupabaseClient, paymentReference: string) {
  await admin.from('payments').update({ status: 'failed' }).eq('reference', paymentReference).eq('status', 'pending')
  await admin.from('room_service_orders').update({ payment_status: 'failed', status: 'cancelled' }).eq('payment_reference', paymentReference).eq('payment_status', 'pending')
}
