import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../../lib/supabase/server'
import { createSupabaseAdminClient } from '../../../../../lib/supabase/admin'
import { sendAnnexOrderStatusEmail } from '../../../../../lib/email/annexOrders'

const LOCATIONS = new Set(['room','short_let','bar','outdoor_eatery','vip_lounge'])

async function authCustomer() {
  const server = createSupabaseServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return { server, user: null, admin: null, customer: null }
  const admin = createSupabaseAdminClient()
  const { data: customer } = await admin.from('customers').select('id,name,email,user_id').eq('user_id', user.id).maybeSingle()
  return { server, user, admin, customer }
}

export async function PATCH(request: Request) {
  try {
    const { user, admin, customer } = await authCustomer()
    if (!user || !admin || !customer) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

    const body = await request.json()
    const orderId = String(body.orderId || '')
    const action = String(body.action || 'update')
    const { data: order } = await admin.from('bar_orders')
      .select('id,reference,customer_id,outlet,status,delivery_location,delivery_label,takeout,contact_email,contact_phone,delivery_address,notes,total')
      .eq('id', orderId)
      .eq('customer_id', customer.id)
      .maybeSingle()

    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
    if (order.status !== 'pending') return NextResponse.json({ error: 'This order can no longer be changed.' }, { status: 409 })

    if (action === 'cancel') {
      const { data: cancelled, error } = await admin.from('bar_orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id)
        .eq('customer_id', customer.id)
        .eq('status', 'pending')
        .select('*')
        .single()
      if (error) throw error
      await sendAnnexOrderStatusEmail(admin, order.id, 'cancelled')
      await admin.from('guest_notifications').insert({
        user_id: user.id,
        type: 'annex_order_status',
        title: 'Order cancelled',
        body: `Order ${order.reference} has been cancelled.`,
        href: '/account/orders',
        metadata: { annex_order_id: order.id, reference: order.reference, status: 'cancelled' },
      })
      return NextResponse.json({ order: cancelled })
    }

    const takeout = body.takeout === true
    const location = takeout ? 'takeout' : String(body.location || '')
    if (!takeout && !LOCATIONS.has(location)) return NextResponse.json({ error: 'Choose a valid delivery location.' }, { status: 400 })
    if (takeout && (!String(body.contactEmail || '').trim() || !String(body.contactPhone || '').trim() || !String(body.deliveryAddress || '').trim())) {
      return NextResponse.json({ error: 'Takeaway / delivery requires email, phone number and address.' }, { status: 400 })
    }

    const patch: any = {
      takeout,
      delivery_location: location,
      delivery_label: takeout ? 'Takeaway / Delivery' : String(body.deliveryLabel || order.delivery_label),
      contact_email: takeout ? String(body.contactEmail || '').trim().slice(0,160) : null,
      contact_phone: takeout ? String(body.contactPhone || '').trim().slice(0,40) : null,
      delivery_address: takeout ? String(body.deliveryAddress || '').trim().slice(0,500) : null,
      notes: String(body.notes || '').trim().slice(0,1000),
    }

    if (!takeout && (location === 'room' || location === 'short_let')) {
      const bookingId = body.bookingId ? String(body.bookingId) : ''
      if (!bookingId) return NextResponse.json({ error: 'Select your current booking.' }, { status: 400 })
      const { data: booking } = await admin.from('bookings')
        .select('id,check_in,check_out,status,payment_status,room_id,short_let_id,customer_id')
        .eq('id', bookingId)
        .eq('customer_id', customer.id)
        .maybeSingle()
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })
      if (!booking || !['confirmed','checked_in'].includes(String(booking.status)) || booking.payment_status !== 'paid' || booking.check_in > today || booking.check_out <= today) {
        return NextResponse.json({ error: 'That booking is not currently available for delivery.' }, { status: 409 })
      }
      patch.booking_id = booking.id
      if (location === 'room') {
        const { data: room } = await admin.from('rooms').select('room_number').eq('id', booking.room_id).maybeSingle()
        if (!room?.room_number) return NextResponse.json({ error: 'Your room could not be found.' }, { status: 400 })
        patch.delivery_label = 'Room ' + room.room_number
      } else {
        const { data: property } = await admin.from('short_lets').select('name').eq('id', booking.short_let_id).maybeSingle()
        if (!property?.name) return NextResponse.json({ error: 'Your short-let property could not be found.' }, { status: 400 })
        patch.delivery_label = property.name
      }
    } else if (!takeout) {
      patch.booking_id = null
    }

    if (Array.isArray(body.items)) {
      const requested = body.items
      const ids = requested.map((item:any) => String(item.id || '')).filter(Boolean)
      let catalogue: any[] = []
      if (order.outlet === 'bar') {
        const { data } = await admin.from('drinks').select('id,name,price,available,bar').in('id', ids).eq('bar','Annex Bar')
        catalogue = data ?? []
      } else {
        const outletName = order.outlet === 'restaurant' ? 'Annex Restaurant' : order.outlet === 'grilling' ? 'Annex Grilling' : 'Outdoor Bar & Eatery'
        const { data } = await admin.from('menu_items').select('id,name,price,available,outlet').in('id', ids).eq('outlet', outletName)
        catalogue = data ?? []
      }
      const map = new Map(catalogue.map(item => [item.id, item]))
      const nextItems: any[] = []
      let nextTotal = 0
      for (const requestedItem of requested) {
        const item = map.get(String(requestedItem.id || ''))
        const quantity = Math.max(1, Math.min(50, Math.floor(Number(requestedItem.quantity) || 1)))
        if (!item || item.available === false) return NextResponse.json({ error: `${requestedItem.name || 'An item'} is no longer available.` }, { status: 400 })
        const lineTotal = Number(item.price) * quantity
        nextItems.push({ id: item.id, name: item.name, quantity, unitPrice: Number(item.price), lineTotal, itemType: order.outlet === 'bar' ? 'drink' : 'food' })
        nextTotal += lineTotal
      }
      if (Math.abs(nextTotal - Number(order.total)) > 0.001) {
        return NextResponse.json({ error: 'Item changes must keep the total unchanged. For a different total, cancel this order and place a new one.' }, { status: 409 })
      }
      const { error: itemError } = await admin.rpc('replace_annex_order_items', { p_order_id: order.id, p_items: nextItems })
      if (itemError) throw itemError
    }
    const { data: updated, error } = await admin.from('bar_orders')
      .update(patch)
      .eq('id', order.id)
      .eq('customer_id', customer.id)
      .eq('status', 'pending')
      .select('*')
      .single()
    if (error) throw error

    return NextResponse.json({ order: updated })
  } catch (error: any) {
    console.error('[annex-order-self]', error)
    return NextResponse.json({ error: error?.message || 'Unable to update order.' }, { status: 500 })
  }
}
