import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { SITE_URL } from '../../../../lib/siteConfig'

function makeReference() {
  return `RS-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
}

export async function POST(request: Request) {
  try {
    const server = createSupabaseServerClient()
    const { data: { user } } = await server.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 })

    const body = await request.json()
    const requestedItems = Array.isArray(body.items) ? body.items : []
    const notes = String(body.notes || '').trim().slice(0, 1000)
    if (!requestedItems.length) return NextResponse.json({ error: 'Choose at least one food or drink.' }, { status: 400 })

    const admin = createSupabaseAdminClient()
    const { data: customer } = await admin.from('customers').select('id,name,email,phone,user_id').eq('user_id', user.id).maybeSingle()
    if (!customer) return NextResponse.json({ error: 'Guest profile not found.' }, { status: 404 })
    if (!customer.email) return NextResponse.json({ error: 'Your guest account needs an email address before payment.' }, { status: 400 })

    const { data: bookings } = await admin.from('bookings').select('reference,room_id,status').eq('customer_id', customer.id).eq('status', 'checked_in').order('check_in', { ascending: false }).limit(1)
    const booking = bookings?.[0]
    if (!booking?.room_id) return NextResponse.json({ error: 'Room service is available after you are checked in.' }, { status: 400 })

    const { data: room } = await admin.from('rooms').select('room_number').eq('id', booking.room_id).maybeSingle()
    if (!room?.room_number) return NextResponse.json({ error: 'Your checked-in room could not be found.' }, { status: 400 })

    const names = requestedItems.map((item: any) => String(item.name || '').trim()).filter(Boolean)
    if (!names.length) return NextResponse.json({ error: 'Choose valid menu items.' }, { status: 400 })

    const [{ data: foods }, { data: drinks }] = await Promise.all([
      admin.from('menu_items').select('name,price,available,outlet').in('name', names),
      admin.from('drinks').select('name,price,available').in('name', names),
    ])

    const foodMap = new Map((foods ?? []).map((item: any) => [item.name, item]))
    const drinkMap = new Map((drinks ?? []).map((item: any) => [item.name, item]))
    const normalized: any[] = []
    let total = 0

    for (const requested of requestedItems) {
      const name = String(requested.name || '').trim()
      const quantity = Math.max(1, Math.min(50, Math.floor(Number(requested.quantity) || 1)))
      const item = foodMap.get(name) || drinkMap.get(name)
      if (!item || item.available === false) return NextResponse.json({ error: `${name} is no longer available.` }, { status: 400 })
      const unitPrice = Number(item.price)
      if (!Number.isFinite(unitPrice) || unitPrice < 0) return NextResponse.json({ error: `Invalid price for ${name}.` }, { status: 400 })
      const kind = foodMap.has(name) ? 'Food' : 'Drink'
      normalized.push({ name, kind, quantity, unitPrice, lineTotal: unitPrice * quantity })
      total += unitPrice * quantity
    }

    if (total <= 0) return NextResponse.json({ error: 'Your order total must be greater than ₦0.' }, { status: 400 })

    const reference = makeReference()
    const paymentReference = `${reference}-PS`
    const orderId = `rso_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const paidOn = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })

    const { error: orderError } = await admin.from('room_service_orders').insert({
      id: orderId,
      reference,
      customer_id: customer.id,
      booking_ref: booking.reference,
      room: room.room_number,
      guest_name: customer.name || 'Guest',
      items: normalized,
      notes,
      total,
      payment_reference: paymentReference,
      payment_status: 'pending',
      status: 'pending',
    })
    if (orderError) throw orderError

    const { error: paymentError } = await admin.from('payments').insert({
      id: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      reference: paymentReference,
      booking_ref: reference,
      customer_id: customer.id,
      customer: customer.name,
      amount: total,
      method: 'Paystack',
      status: 'pending',
      date: paidOn,
    })
    if (paymentError) throw paymentError

    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) throw new Error('Paystack is not configured.')
    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || SITE_URL}/api/room-service/callback`
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: customer.email,
        amount: String(Math.round(total * 100)),
        currency: 'NGN',
        reference: paymentReference,
        callback_url: callbackUrl,
        metadata: { room_service_order_id: orderId, room_service_reference: reference, booking_reference: booking.reference, customer_id: customer.id },
      }),
      cache: 'no-store',
    })
    const result = await paystackResponse.json()
    if (!paystackResponse.ok || !result?.status || !result?.data?.authorization_url) throw new Error(result?.message || 'Paystack could not initialize the payment.')

    return NextResponse.json({ authorizationUrl: result.data.authorization_url, reference, total, orderId })
  } catch (error: any) {
    console.error('[room-service-initialize]', error)
    return NextResponse.json({ error: error?.message || 'Unable to start room-service payment.' }, { status: 500 })
  }
}
