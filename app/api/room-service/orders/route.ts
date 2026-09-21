import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'

const STAFF_ROLES = new Set(['super_admin', 'manager', 'reception', 'restaurant'])
const ORDER_STATUSES = new Set(['pending', 'being_attended_to', 'attended', 'delivered', 'cancelled'])

async function getUser() {
  const server = createSupabaseServerClient()
  const { data: { user } } = await server.auth.getUser()
  return { server, user }
}

export async function GET() {
  try {
    const { server, user } = await getUser()
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    const { data: customer } = await server.from('customers').select('id').eq('user_id', user.id).maybeSingle()
    if (!customer) return NextResponse.json({ orders: [] })
    const { data: roles } = await server.from('user_roles').select('role').eq('user_id', user.id)
    const isStaff = (roles ?? []).some((r: any) => STAFF_ROLES.has(r.role))
    const admin = createSupabaseAdminClient()
    const query = admin.from('room_service_orders').select('*').eq('payment_status', 'paid').order('created_at', { ascending: false })
    const { data, error } = isStaff ? await query : await query.eq('customer_id', customer.id)
    if (error) throw error
    return NextResponse.json({ orders: data ?? [] })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unable to load room-service orders.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { server, user } = await getUser()
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    const { data: roles } = await server.from('user_roles').select('role').eq('user_id', user.id)
    const roleList = (roles ?? []).map((r: any) => r.role)
    if (!roleList.some((role: string) => STAFF_ROLES.has(role))) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 })

    const { orderId, status } = await request.json()
    if (!orderId || !ORDER_STATUSES.has(status)) return NextResponse.json({ error: 'Invalid order or status.' }, { status: 400 })
    const admin = createSupabaseAdminClient()
    const patch: any = { status }
    if (status === 'attended') patch.attended_at = new Date().toISOString()
    if (status === 'delivered') patch.delivered_at = new Date().toISOString()
    const { data: order, error } = await admin.from('room_service_orders').update(patch).eq('id', String(orderId)).select('*').single()
    if (error) throw error

    const { data: customer } = await admin.from('customers').select('user_id').eq('id', order.customer_id).maybeSingle()
    if (customer?.user_id) {
      const labels: Record<string, string> = { pending: 'Order received', being_attended_to: 'Restaurant is preparing your order', attended: 'Your order has been prepared', delivered: 'Order delivered', cancelled: 'Order cancelled' }
      await admin.from('guest_notifications').insert({ user_id: customer.user_id, type: 'room_service_status', title: labels[status], body: `Room-service order ${order.reference} is now ${status.replaceAll('_', ' ')}.`, href: '/account/requests', metadata: { room_service_order_id: order.id, reference: order.reference, status } })
    }
    return NextResponse.json({ order })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unable to update room-service order.' }, { status: 500 })
  }
}
