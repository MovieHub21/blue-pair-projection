import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../../lib/supabase/admin'
import { SITE_URL } from '../../../../../lib/siteConfig'
import { sendAnnexOrderStatusEmail, sendAnnexOrderStaffEmails } from '../../../../../lib/email/annexOrders'
import { notifyStaff } from '../../../../../lib/staffNotifications'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const reference = String(url.searchParams.get('reference') || url.searchParams.get('trxref') || '').trim()
  const base = process.env.NEXT_PUBLIC_SITE_URL || SITE_URL
  const errorUrl = (reason: string) => NextResponse.redirect(base + '/annex/bar/order/error?reason=' + encodeURIComponent(reason))
  if (!reference) return errorUrl('missing_reference')

  try {
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) return errorUrl('payment_not_configured')

    const admin = createSupabaseAdminClient()
    const { data: checkout, error: checkoutError } = await admin.from('bar_order_checkouts').select('*').eq('reference', reference).maybeSingle()
    if (checkoutError) throw checkoutError
    if (!checkout) return errorUrl('checkout_not_found')
    if (checkout.status === 'paid') return NextResponse.redirect(base + '/annex/bar/order/success?reference=' + encodeURIComponent(reference))

    const response = await fetch('https://api.paystack.co/transaction/verify/' + encodeURIComponent(reference), {
      headers: { Authorization: 'Bearer ' + secret },
      cache: 'no-store',
    })
    const verification = await response.json()
    if (!response.ok || !verification?.status || verification?.data?.status !== 'success') {
      await admin.from('bar_order_checkouts').update({ status: 'failed' }).eq('id', checkout.id)
      return errorUrl('payment_failed')
    }
    if (Number(verification.data.amount) !== Math.round(Number(checkout.total) * 100)) {
      await admin.from('bar_order_checkouts').update({ status: 'failed' }).eq('id', checkout.id)
      return errorUrl('amount_mismatch')
    }

    const payload: any = checkout.payload || {}
    const normalized = Array.isArray(payload.items) ? payload.items : []
    const outlet = String(payload.outlet || 'bar')
    const orderId = 'annex_' + Date.now() + '_' + Math.random().toString(36).slice(2,8)
    const orderReference = 'ANX-' + Date.now() + '-' + Math.random().toString(36).slice(2,7).toUpperCase()

    const { error: orderError } = await admin.from('bar_orders').insert({
      id: orderId,
      reference: orderReference,
      customer_id: checkout.customer_id,
      booking_id: payload.bookingId || null,
      outlet,
      payment_reference: String(verification.data.reference || reference),
      delivery_location: payload.location,
      delivery_label: payload.deliveryLabel,
      takeout: payload.takeout === true,
      contact_email: payload.contactEmail || null,
      contact_phone: payload.contactPhone || null,
      delivery_address: payload.deliveryAddress || null,
      notes: payload.notes || '',
      subtotal: Number(checkout.total),
      total: Number(checkout.total),
      status: 'pending',
    })
    if (orderError) throw orderError

    const { error: itemError } = await admin.from('bar_order_items').insert(normalized.map((item:any,index:number) => ({
      id: 'aoi_' + Date.now() + '_' + index + '_' + Math.random().toString(36).slice(2,6),
      order_id: orderId,
      drink_id: item.itemType === 'drink' ? item.id : null,
      menu_item_id: item.itemType === 'food' ? item.id : null,
      item_type: item.itemType === 'drink' ? 'drink' : 'food',
      drink_name: item.name,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      line_total: item.lineTotal,
    })))
    if (itemError) {
      await admin.from('bar_orders').delete().eq('id', orderId)
      throw itemError
    }

    await admin.from('bar_order_checkouts').update({ status: 'paid' }).eq('id', checkout.id)
    await sendAnnexOrderStatusEmail(admin, orderId, 'pending')
    await sendAnnexOrderStaffEmails(admin, orderId)

    await notifyStaff(admin, {
      audiences: [
        { department: 'annex', href: '/admin/annex' },
        { department: 'restaurant', href: '/admin/annex' },
        { department: 'bar', href: '/admin/annex' },
      ],
      type: 'annex_order',
      title: 'New Annex order — ' + orderReference,
      body: (payload.deliveryLabel || 'Annex') + ' · ₦' + Number(checkout.total).toLocaleString('en-NG') + ' · paid',
      metadata: { annex_order_id: orderId, reference: orderReference, outlet },
      includeManagement: true,
      dedupeKey: 'annex_order_paid:' + orderReference,
    })

    return NextResponse.redirect(base + '/annex/bar/order/success?reference=' + encodeURIComponent(orderReference))
  } catch (error:any) {
    console.error('[annex-order-payment-callback]', error)
    return errorUrl('order_creation_failed')
  }
}
