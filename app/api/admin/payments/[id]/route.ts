import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../../lib/supabase/server'
import { createSupabaseAdminClient } from '../../../../../lib/supabase/admin'

const STAFF_ROLES = new Set(['super_admin', 'manager', 'accountant', 'reception'])

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const server = createSupabaseServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  const { data: roles } = await server.from('user_roles').select('role').eq('user_id', user.id)
  if (!(roles ?? []).some((role: any) => STAFF_ROLES.has(role.role))) return NextResponse.json({ error: 'Payment access is not permitted.' }, { status: 403 })

  const db = createSupabaseAdminClient()
  const { data: payment, error } = await db.from('payments').select('*').eq('id', params.id).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!payment) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 })

  const [customerResult, bookingResult, roomServiceResult, barOrderResult] = await Promise.all([
    payment.customer_id ? db.from('customers').select('*').eq('id', payment.customer_id).maybeSingle() : Promise.resolve({ data: null }),
    db.from('bookings').select('*').eq('reference', payment.booking_ref).maybeSingle(),
    db.from('room_service_orders').select('*').eq('payment_reference', payment.reference).maybeSingle(),
    db.from('bar_orders').select('*').eq('payment_reference', payment.reference).maybeSingle(),
  ])

  let booking: any = bookingResult.data
  let roomType: any = null
  let room: any = null
  if (booking) {
    const [typeResult, roomResult] = await Promise.all([
      booking.room_type_id ? db.from('room_types').select('*').eq('id', booking.room_type_id).maybeSingle() : Promise.resolve({ data: null }),
      booking.room_id ? db.from('rooms').select('*').eq('id', booking.room_id).maybeSingle() : Promise.resolve({ data: null }),
    ])
    roomType = typeResult.data
    room = roomResult.data
  }

  let barOrder: any = barOrderResult.data
  if (!barOrder && !roomServiceResult.data) {
    const { data: checkout } = await db.from('bar_order_checkouts').select('id,reference,payment_reference').eq('payment_reference', payment.reference).maybeSingle()
    if (checkout) barOrder = (await db.from('bar_orders').select('*').eq('payment_reference', checkout.payment_reference).maybeSingle()).data
  }
  const barItems = barOrder
    ? (await db.from('bar_order_items').select('*').eq('order_id', barOrder.id)).data ?? []
    : []

  return NextResponse.json({ payment, customer: customerResult.data, booking, roomType, room, roomService: roomServiceResult.data, barOrder, barItems })
}
