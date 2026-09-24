import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { sendBarOrderStatusEmail } from '../../../../lib/email/barOrders'

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

export async function POST() {
  return NextResponse.json(
    { error: 'Bar orders must be paid through Paystack before they can be placed.' },
    { status: 409 },
  )
}

export async function PATCH(request: Request) {
  try {
    const { server, user } = await getAuth()
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

    const { data: roles } = await server.from('user_roles').select('role').eq('user_id', user.id)
    const roleList = (roles ?? []).map((r: any) => String(r.role).toLowerCase())
    if (!roleList.some(role => ['super_admin','manager','bar staff','bar_staff'].includes(role))) {
      return NextResponse.json({ error: 'Not allowed.' }, { status: 403 })
    }

    const body = await request.json()
    const orderId = String(body.orderId || '')
    const status = String(body.status || '')
    if (!orderId || !STATUSES.has(status)) {
      return NextResponse.json({ error: 'Invalid order or status.' }, { status: 400 })
    }

    const admin = createSupabaseAdminClient()
    const { data: current } = await admin.from('bar_orders').select('status').eq('id', orderId).maybeSingle()
    if (!current) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })

    if (current.status === status) {
      const { data: unchanged } = await admin.from('bar_orders').select('*').eq('id', orderId).single()
      return NextResponse.json({ order: unchanged })
    }

    const patch: any = { status }
    if (status === 'accepted') patch.accepted_at = new Date().toISOString()
    if (status === 'delivered') patch.delivered_at = new Date().toISOString()

    const { data: order, error } = await admin.from('bar_orders')
      .update(patch)
      .eq('id', orderId)
      .select('*')
      .single()
    if (error) throw error

    await sendBarOrderStatusEmail(admin, order.id, status)

    const { data: customer } = await admin.from('customers').select('user_id').eq('id', order.customer_id).maybeSingle()
    if (customer?.user_id) {
      const labels: Record<string,string> = {
        pending: 'Order received',
        accepted: 'Order accepted',
        preparing: 'Your drinks are being prepared',
        ready: 'Your order is ready',
        delivered: 'Order delivered',
        cancelled: 'Order cancelled',
      }
      await admin.from('guest_notifications').insert({
        user_id: customer.user_id,
        type: 'bar_order_status',
        title: labels[status],
        body: `Bar order ${order.reference} is now ${status.replaceAll('_', ' ')}.`,
        href: '/account/requests',
        metadata: { bar_order_id: order.id, reference: order.reference, status },
      })
    }

    return NextResponse.json({ order })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unable to update bar order.' }, { status: 500 })
  }
}
