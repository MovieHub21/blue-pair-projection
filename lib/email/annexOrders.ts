import type { SupabaseClient } from '@supabase/supabase-js'
import { sendResendEmail } from './resend'
import { resolveDepartmentStaff, resolveManagement } from '../staffRecipients'
import { annexOrderStatusEmail, annexOrderStaffEmail, type AnnexOrderStatus } from './templates'

const CUSTOMER_EMAIL_STATUSES = new Set<AnnexOrderStatus>(['pending', 'accepted', 'ready', 'delivered', 'cancelled'])

export type AnnexOrderRecord = {
  id: string
  reference: string
  customer_id: string
  outlet: string
  delivery_label: string
  takeout: boolean
  contact_email?: string | null
  total: number
  status: AnnexOrderStatus
}

export async function sendAnnexOrderStatusEmail(admin: SupabaseClient, orderId: string, status: string) {
  if (!CUSTOMER_EMAIL_STATUSES.has(status as AnnexOrderStatus)) return

  try {
    const { data: order } = await admin.from('bar_orders')
      .select('id,reference,customer_id,outlet,delivery_label,takeout,contact_email,total,status')
      .eq('id', orderId)
      .maybeSingle()
    if (!order) return

    const [{ data: customer }, { data: items }] = await Promise.all([
      admin.from('customers').select('name,email').eq('id', order.customer_id).maybeSingle(),
      admin.from('bar_order_items').select('drink_name,quantity,line_total,item_type').eq('order_id', orderId).order('id'),
    ])

    const recipient = order.takeout
      ? String(order.contact_email || '').trim().toLowerCase()
      : String(customer?.email || '').trim().toLowerCase()
    if (!recipient) return

    const email = annexOrderStatusEmail({
      guestName: customer?.name || 'Guest',
      reference: order.reference,
      status: status as AnnexOrderStatus,
      outlet: order.outlet,
      deliveryLabel: order.delivery_label,
      takeout: Boolean(order.takeout),
      total: Number(order.total),
      items: (items ?? []).map((item: any) => ({
        name: String(item.drink_name || 'Item'),
        kind: String(item.item_type || 'food'),
        quantity: Number(item.quantity || 0),
        lineTotal: Number(item.line_total || 0),
      })),
    })

    await sendResendEmail({
      to: recipient,
      subject: email.subject,
      html: email.html,
      text: email.text,
      includeAccountCta: false,
      idempotencyKey: `annex-order-status/${order.id}/${status}`,
    })
  } catch (error: any) {
    console.error('[annex-order-email] failed', { orderId, status, message: error?.message })
  }
}

export async function sendAnnexOrderStaffEmails(admin: SupabaseClient, orderId: string) {
  try {
    const { data: order } = await admin.from('bar_orders')
      .select('id,reference,customer_id,outlet,delivery_label,takeout,total,status,contact_email,contact_phone,delivery_address,notes')
      .eq('id', orderId)
      .maybeSingle()
    if (!order) return

    const [{ data: customer }, { data: items }] = await Promise.all([
      admin.from('customers').select('name,email').eq('id', order.customer_id).maybeSingle(),
      admin.from('bar_order_items').select('drink_name,quantity,line_total,item_type').eq('order_id', orderId).order('id'),
    ])

    const recipients = new Map<string, string>()
    for (const department of ['annex', 'restaurant', 'bar'] as const) {
      for (const member of await resolveDepartmentStaff(admin, department)) {
        if (member.email) recipients.set(member.email, member.name)
      }
    }
    for (const member of await resolveManagement(admin)) {
      if (member.email) recipients.set(member.email, member.name)
    }
    if (!recipients.size) return

    const email = annexOrderStaffEmail({
      guestName: customer?.name || 'Guest',
      guestEmail: customer?.email || order.contact_email || '',
      reference: order.reference,
      outlet: order.outlet,
      deliveryLabel: order.delivery_label,
      takeout: Boolean(order.takeout),
      total: Number(order.total),
      contactPhone: order.contact_phone || '',
      deliveryAddress: order.delivery_address || '',
      notes: order.notes || '',
      items: (items ?? []).map((item: any) => ({
        name: String(item.drink_name || 'Item'),
        kind: String(item.item_type || 'food'),
        quantity: Number(item.quantity || 0),
        lineTotal: Number(item.line_total || 0),
      })),
    })

    await Promise.all([...recipients.entries()].map(([to]) =>
      sendResendEmail({
        to,
        subject: email.subject,
        html: email.html,
        text: email.text,
        includeAccountCta: false,
        idempotencyKey: `annex-order-staff/${order.id}/${to}`,
      }).catch(error => console.error('[annex-order-staff-email] failed', { to, message: error?.message }))
    ))
  } catch (error) {
    console.error('[annex-order-staff-email] failed', error)
  }
}
