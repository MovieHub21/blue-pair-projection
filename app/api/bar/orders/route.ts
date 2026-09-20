import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'

const LOCATIONS = new Set(['room','short_let','bar','outdoor_eatery','vip_lounge'])
const STATUSES = new Set(['pending','accepted','preparing','ready','delivered','cancelled'])

async function getAuth() {
  const server = createSupabaseServerClient()
  const { data: { user } } = await server.auth.getUser()
  return { server, user }
}

async function getCustomer(userId: string) {
  const admin = createSupabaseAdminClient()
  const { data } = await admin.from('customers').select('id,name,user_id').eq('user_id', userId).maybeSingle()
  return { admin, customer: data }
}

function isActiveBooking(booking: any, today: string) {
  return ['confirmed','checked_in'].includes(String(booking.status)) &&
    booking.payment_status === 'paid' &&
    booking.check_in <= today &&
    booking.check_out > today
}

export async function GET() {
  try {
    const { user } = await getAuth()
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    const { admin, customer } = await getCustomer(user.id)
    if (!customer) return NextResponse.json({ orders: [] })
    const { data: orders, error } = await admin.from('bar_orders')
      .select('*,bar_order_items(*)')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ orders: orders ?? [] })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unable to load bar orders.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await getAuth()
    if (!user) return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 })

    const body = await request.json()
    const requestedItems = Array.isArray(body.items) ? body.items : []
    const location = String(body.location || '')
    const bookingId = body.bookingId ? String(body.bookingId) : null
    const notes = String(body.notes || '').trim().slice(0, 1000)
    const contactEmail = String(body.contactEmail || '').trim().slice(0, 160)
    const contactPhone = String(body.contactPhone || '').trim().slice(0, 40)
    const deliveryAddress = String(body.deliveryAddress || '').trim().slice(0, 500)

    if (!requestedItems.length) return NextResponse.json({ error: 'Choose at least one drink.' }, { status: 400 })
    if (!LOCATIONS.has(location)) return NextResponse.json({ error: 'Choose where the order should be served.' }, { status: 400 })

    const { admin, customer } = await getCustomer(user.id)
    if (!customer) return NextResponse.json({ error: 'Guest profile not found.' }, { status: 404 })

    const ids = requestedItems.map((item: any) => String(item.id || '')).filter(Boolean)
    if (!ids.length) return NextResponse.json({ error: 'Choose valid drinks.' }, { status: 400 })

    const { data: drinks, error: drinksError } = await admin.from('drinks')
      .select('id,name,price,available,bar')
      .in('id', ids)
      .eq('bar', 'Annex Bar')
    if (drinksError) throw drinksError

    const drinkMap = new Map((drinks ?? []).map((drink: any) => [drink.id, drink]))
    const normalized: any[] = []
    let subtotal = 0

    for (const requested of requestedItems) {
      const drink = drinkMap.get(String(requested.id || ''))
      if (!drink || drink.available === false) return NextResponse.json({ error: `${String(requested.name || 'This drink')} is no longer available.` }, { status: 400 })
      const quantity = Math.max(1, Math.min(50, Math.floor(Number(requested.quantity) || 1)))
      const unitPrice = Number(drink.price)
      const lineTotal = unitPrice * quantity
      normalized.push({ drinkId: drink.id, drinkName: drink.name, unitPrice, quantity, lineTotal })
      subtotal += lineTotal
    }

    let resolvedBookingId: string | null = null
    let deliveryLabel = location === 'bar' ? 'Annex Bar' : location === 'outdoor_eatery' ? 'Outdoor Eatery' : location === 'vip_lounge' ? 'VIP Lounge' : ''
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })

    if (location === 'room' || location === 'short_let') {
      if (!bookingId) return NextResponse.json({ error: 'Select your current booking for this delivery location.' }, { status: 400 })
      const { data: booking, error: bookingError } = await admin.from('bookings')
        .select('id,reference,check_in,check_out,status,payment_status,room_id,short_let_id,customer_id')
        .eq('id', bookingId)
        .eq('customer_id', customer.id)
        .maybeSingle()
      if (bookingError) throw bookingError
      if (!booking || !isActiveBooking(booking, today)) return NextResponse.json({ error: 'That booking is not currently available for delivery.' }, { status: 409 })
      resolvedBookingId = booking.id

      if (location === 'room') {
        if (!booking.room_id) return NextResponse.json({ error: 'That booking has no room assigned.' }, { status: 400 })
        const { data: room } = await admin.from('rooms').select('room_number').eq('id', booking.room_id).maybeSingle()
        if (!room?.room_number) return NextResponse.json({ error: 'Your room could not be found.' }, { status: 400 })
        deliveryLabel = `Room ${room.room_number}`
      } else {
        if (!booking.short_let_id) return NextResponse.json({ error: 'Select your active short-let booking.' }, { status: 400 })
        const { data: property } = await admin.from('short_lets').select('name').eq('id', booking.short_let_id).maybeSingle()
        if (!property?.name) return NextResponse.json({ error: 'Your short-let property could not be found.' }, { status: 400 })
        deliveryLabel = property.name
      }
    }

    const reference = `BAR-${Date.now()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`
    const orderId = `bar_${Date.now()}_${Math.random().toString(36).slice(2,7)}`
    const { error: orderError } = await admin.from('bar_orders').insert({
      id: orderId, reference, customer_id: customer.id, booking_id: resolvedBookingId,
      delivery_location: location, delivery_label: deliveryLabel, notes: [notes, contactEmail ? `Email: ${contactEmail}` : '', contactPhone ? `Phone: ${contactPhone}` : '', deliveryAddress ? `Address: ${deliveryAddress}` : ''].filter(Boolean).join(' · '),
      subtotal, total: subtotal, status: 'pending',
    })
    if (orderError) throw orderError

    const { error: itemError } = await admin.from('bar_order_items').insert(normalized.map(item => ({
      id: `boi_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
      order_id: orderId, drink_id: item.drinkId, drink_name: item.drinkName,
      unit_price: item.unitPrice, quantity: item.quantity, line_total: item.lineTotal,
    })))
    if (itemError) {
      await admin.from('bar_orders').delete().eq('id', orderId)
      throw itemError
    }

    return NextResponse.json({ reference, orderId, deliveryLabel, total: subtotal })
  } catch (error: any) {
    console.error('[bar-order]', error)
    return NextResponse.json({ error: error?.message || 'Unable to place your bar order.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { server, user } = await getAuth()
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    const { data: roles } = await server.from('user_roles').select('role').eq('user_id', user.id)
    const roleList = (roles ?? []).map((r: any) => String(r.role).toLowerCase())
    if (!roleList.some(role => ['super_admin','manager','bar staff','bar_staff'].includes(role))) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 })

    const body = await request.json()
    const orderId = String(body.orderId || '')
    const status = String(body.status || '')
    if (!orderId || !STATUSES.has(status)) return NextResponse.json({ error: 'Invalid order or status.' }, { status: 400 })

    const admin = createSupabaseAdminClient()
    const patch: any = { status }
    if (status === 'accepted') patch.accepted_at = new Date().toISOString()
    if (status === 'delivered') patch.delivered_at = new Date().toISOString()
    const { data: order, error } = await admin.from('bar_orders').update(patch).eq('id', orderId).select('*').single()
    if (error) throw error

    const { data: customer } = await admin.from('customers').select('user_id').eq('id', order.customer_id).maybeSingle()
    if (customer?.user_id) {
      const labels: Record<string,string> = { pending:'Order received', accepted:'Order accepted', preparing:'Your drinks are being prepared', ready:'Your order is ready', delivered:'Order delivered', cancelled:'Order cancelled' }
      await admin.from('guest_notifications').insert({
        user_id: customer.user_id, type: 'bar_order_status', title: labels[status],
        body: `Bar order ${order.reference} is now ${status.replaceAll('_',' ')}.`,
        href: '/account/requests', metadata: { bar_order_id: order.id, reference: order.reference, status },
      })
    }
    return NextResponse.json({ order })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unable to update bar order.' }, { status: 500 })
  }
}
