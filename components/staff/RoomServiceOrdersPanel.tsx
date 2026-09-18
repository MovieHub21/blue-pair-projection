'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Clock3, CheckCircle2, Truck } from 'lucide-react'

const STATUS_OPTIONS = [
  ['pending', 'New / Paid'],
  ['being_attended_to', 'Being attended to'],
  ['attended', 'Attended'],
  ['delivered', 'Delivered'],
] as const

type Order = { id: string; reference: string; room: string; guest_name: string; items: any[]; notes: string; total: number; payment_status: string; status: string; created_at: string }

export default function RoomServiceOrdersPanel({ mode = 'restaurant' }: { mode?: 'restaurant' | 'reception' }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  async function load() {
    const response = await fetch('/api/room-service/orders', { cache: 'no-store' })
    const data = await response.json().catch(() => ({}))
    if (response.ok) setOrders(data.orders ?? [])
    setLoading(false)
  }
  useEffect(() => { void load(); const refresh=()=>void load(); window.addEventListener('bluepair:database-change',refresh); return () => window.removeEventListener('bluepair:database-change',refresh) }, [])

  async function updateStatus(orderId: string, status: string) {
    setUpdating(orderId)
    const response = await fetch('/api/room-service/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, status }) })
    const data = await response.json().catch(() => ({}))
    setUpdating(null)
    if (response.ok && data.order) setOrders(current => current.map(order => order.id === orderId ? data.order : order))
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div><h2 className="text-lg font-semibold">{mode === 'restaurant' ? 'Room-service orders' : 'Room-service tracking'}</h2><p className="text-xs text-navy-400">{mode === 'restaurant' ? 'Paid orders appear here automatically for preparation and delivery.' : 'Track every paid room-service order while the restaurant handles fulfilment.'}</p></div>
        <button onClick={() => { setLoading(true); void load() }} className="btn-outline btn-sm"><RefreshCw size={13} className={loading ? 'animate-spin' : ''}/>Refresh</button>
      </div>
      <div className="grid gap-3">
        {orders.length === 0 && <div className="card p-6 text-sm text-navy-400">No room-service orders yet.</div>}
        {orders.map(order => <div key={order.id} className="card p-4 md:p-5">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
            <div><div className="flex items-center gap-2"><span className="font-semibold text-sm">{order.reference}</span><span className="pill-green">Paid</span></div><p className="text-xs text-navy-500 mt-1">{order.guest_name} · Room {order.room}</p><p className="text-[11px] text-navy-400 mt-0.5">{new Date(order.created_at).toLocaleString('en-NG')}</p></div>
            <div className="flex items-center gap-2 text-xs font-semibold"><Clock3 size={14} className="text-gold-600" />{order.status === 'pending' ? 'New order' : order.status === 'being_attended_to' ? 'Being attended to' : order.status === 'attended' ? 'Attended' : order.status === 'delivered' ? 'Delivered' : order.status}</div>
          </div>
          <div className="mt-4 rounded-lg bg-cream-100 p-3 space-y-1.5 text-xs">{(order.items ?? []).map((item, i) => <div key={i} className="flex justify-between gap-3"><span>{item.quantity}× {item.name} <span className="text-navy-400">({item.kind})</span></span><b>₦{Number(item.lineTotal).toLocaleString('en-NG')}</b></div>)}<div className="border-t border-black/10 pt-2 mt-2 flex justify-between font-bold"><span>Total paid</span><span>₦{Number(order.total).toLocaleString('en-NG')}</span></div></div>
          {order.notes && <p className="text-xs text-navy-500 mt-3"><b>Guest note:</b> {order.notes}</p>}
          {mode === 'restaurant' && <div className="flex flex-wrap gap-2 mt-4">{STATUS_OPTIONS.map(([value, label]) => <button key={value} disabled={updating === order.id || order.status === 'delivered'} onClick={() => void updateStatus(order.id, value)} className={'btn-sm rounded-full border px-3 py-2 text-xs font-semibold ' + (order.status === value ? 'bg-navy-950 text-white border-navy-950' : 'border-black/10 text-navy-700 hover:border-gold-500')}>{value === 'being_attended_to' ? <span className="inline-flex items-center gap-1"><Clock3 size={12}/> {label}</span> : value === 'attended' ? <span className="inline-flex items-center gap-1"><CheckCircle2 size={12}/> {label}</span> : value === 'delivered' ? <span className="inline-flex items-center gap-1"><Truck size={12}/> {label}</span> : label}</button>)}</div>}
        </div>)}
      </div>
    </section>
  )
}
