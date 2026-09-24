import type { SupabaseClient } from '@supabase/supabase-js'
import { sendResendEmail } from './resend'
import { barOrderStatusEmail, type BarOrderStatus } from './templates'

const STATUS_SET = new Set<BarOrderStatus>(['pending', 'accepted', 'preparing', 'ready', 'delivered', 'cancelled'])

export async function sendBarOrderStatusEmail(admin: SupabaseClient, orderId: string, status: string) {
  if (!STATUS_SET.has(status as BarOrderStatus)) return

  try {
    const { data: order } = await admin
      .from('bar_orders')
      .select('id,reference,customer_id,delivery_label,takeout,contact_email,total')
      .eq('id', orderId)
      .maybeSingle()

    if (!order) return

    const [{ data: customer }, { data: items }] = await Promise.all([
      admin.from('customers').select('name,email').eq('id', order.customer_id).maybeSingle(),
      admin.from('bar_order_items').select('drink_name,quantity,line_total').eq('order_id', orderId).order('id'),
    ])

    const recipient = order.takeout
      ? String(order.contact_email || '').trim().toLowerCase()
      : String(customer?.email || '').trim().toLowerCase()

    if (!recipient) return

    const dedupeKey = `bar_order_status:${order.id}:${status}`
    const { data: existing } = await admin.from('email_logs').select('id').eq('dedupe_key', dedupeKey).maybeSingle()
    if (existing) return

    const email = barOrderStatusEmail({
      guestName: customer?.name || 'Guest',
      reference: order.reference,
      status: status as BarOrderStatus,
      deliveryLabel: order.delivery_label,
      takeout: Boolean(order.takeout),
      total: Number(order.total),
      items: (items ?? []).map((item: any) => ({
        drinkName: String(item.drink_name || 'Drink'),
        quantity: Number(item.quantity || 0),
        lineTotal: Number(item.line_total || 0),
      })),
    })

    const result = await sendResendEmail({
      to: recipient,
      subject: email.subject,
      html: email.html,
      text: email.text,
      includeAccountCta: false,
      idempotencyKey: dedupeKey,
    })

    const { error: logError } = await admin.from('email_logs').insert({
      dedupe_key: dedupeKey,
      event: `bar_order_${status}`,
      booking_id: order.id,
      recipient,
      subject: email.subject,
      resend_id: result.id ?? null,
    })
    if (logError && logError.code !== '23505') {
      console.error('[bar-order-email] log failed', logError.message)
    }
  } catch (error: any) {
    console.error('[bar-order-email] failed', { orderId, status, message: error?.message })
  }
}
