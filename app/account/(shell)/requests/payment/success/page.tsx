import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { createSupabaseServerClient } from '../../../../../../lib/supabase/server'
import { naira } from '../../../../../../lib/format'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Room-service payment received', robots: { index: false, follow: false } }

// Room-service payments have their own result pages; they never land on the room-booking pages.
export default async function RoomServicePaymentSuccess({ searchParams }: { searchParams: { reference?: string } }) {
  const reference = String(searchParams.reference || '').trim()
  let order: any = null
  if (reference) {
    const db = createSupabaseServerClient()
    const { data } = await db.from('room_service_orders').select('reference,room,items,total,payment_status').eq('reference', reference).maybeSingle()
    order = data
  }
  const items: any[] = Array.isArray(order?.items) ? order.items : []

  return (
    <div className="mx-auto max-w-xl">
      <div className="card p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={28} /></div>
        <p className="eyebrow mt-5">Room service</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-navy-950">Payment received</h1>
        <p className="mt-3 text-sm leading-6 text-navy-500">
          {order ? `Your order has been sent to the restaurant and will be brought to Room ${order.room}.` : 'Your payment was received. Your order has been sent to the restaurant.'}
        </p>

        {order && (
          <div className="mt-6 rounded-xl bg-cream-100 p-4 text-left text-sm">
            <div className="mb-3 flex items-center justify-between text-xs text-navy-500"><span>Order</span><b className="text-navy-900">{order.reference}</b></div>
            <div className="space-y-1.5">
              {items.map((item, index) => <div key={index} className="flex justify-between gap-3"><span>{item.quantity}× {item.name}</span><b>{naira(Number(item.lineTotal))}</b></div>)}
            </div>
            <div className="mt-3 flex justify-between border-t border-black/10 pt-3 font-bold"><span>Total paid</span><span>{naira(Number(order.total))}</span></div>
          </div>
        )}

        <Link href="/account/requests" className="btn-primary mt-7 inline-flex">Track my order</Link>
      </div>
    </div>
  )
}
