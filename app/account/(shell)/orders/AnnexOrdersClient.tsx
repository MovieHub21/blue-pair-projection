'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock3, Edit3, MapPin, Package, RefreshCw, XCircle } from 'lucide-react'
import { naira } from '../../../../lib/format'
import { pushToast } from '../../../../components/ui/Toast'

type Booking = { id: string; type: 'room' | 'short_let'; label: string; reference: string }
type OrderItem = { id: string; drink_name: string; quantity: number; unit_price: number; line_total: number; item_type: string }
type Order = {
  id: string; reference: string; outlet: string; delivery_location: string; delivery_label: string; takeout: boolean
  contact_email?: string | null; contact_phone?: string | null; delivery_address?: string | null; notes?: string | null
  total: number; status: string; created_at: string; bar_order_items?: OrderItem[]
}

const STATUS: Record<string,string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}
const outletLabel = (value: string) => ({ bar:'Annex Bar', restaurant:'Annex Restaurant', grilling:'Annex Grilling', outdoor_eatery:'Outdoor Eatery' } as Record<string,string>)[value] || 'Annex Order'

export default function AnnexOrdersClient({ activeBookings }: { activeBookings: Booking[] }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Order | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const response = await fetch('/api/bar/orders', { cache: 'no-store' })
    const data = await response.json().catch(() => ({}))
    setLoading(false)
    if (response.ok) setOrders(data.orders ?? [])
  }

  useEffect(() => {
    void load()
    const refresh = (event: Event) => {
      const table = (event as CustomEvent).detail?.table
      if (!table || table === 'bar_orders' || table === 'bar_order_items') void load()
    }
    window.addEventListener('bluepair:database-change', refresh as EventListener)
    return () => window.removeEventListener('bluepair:database-change', refresh as EventListener)
  }, [])

  async function cancel(order: Order) {
    if (!window.confirm(`Cancel order ${order.reference}?`)) return
    setSaving(true)
    const response = await fetch('/api/bar/orders/self', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id, action: 'cancel' }),
    })
    const data = await response.json().catch(() => ({}))
    setSaving(false)
    if (!response.ok) return pushToast(data.error || 'Could not cancel order.', 'error')
    pushToast('Order cancelled.', 'success')
    await load()
  }

  async function save(order: Order, draft: DraftOrder) {
    setSaving(true)
    const response = await fetch('/api/bar/orders/self', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id,
        action: 'update',
        items: draft.items.map(item => ({ id: item.id, name: item.drink_name, quantity: item.quantity })),
        takeout: draft.takeout,
        location: draft.location,
        bookingId: draft.bookingId || null,
        deliveryLabel: draft.deliveryLabel,
        contactEmail: draft.contactEmail,
        contactPhone: draft.contactPhone,
        deliveryAddress: draft.deliveryAddress,
        notes: draft.notes,
      }),
    })
    const data = await response.json().catch(() => ({}))
    setSaving(false)
    if (!response.ok) return pushToast(data.error || 'Could not modify order.', 'error')
    setEditing(null)
    pushToast('Order updated.', 'success')
    await load()
  }

  if (loading && !orders.length) return <div className="card p-10 text-center text-sm text-navy-400"><RefreshCw size={18} className="mx-auto animate-spin" /><p className="mt-3">Loading your orders…</p></div>

  return (
    <div className="space-y-4">
      {orders.length === 0 && <div className="card p-10 text-center"><Package size={28} className="mx-auto text-navy-300" /><h2 className="mt-3 font-semibold text-navy-950">No Annex orders yet</h2><p className="mt-1 text-sm text-navy-400">Your paid food and drink orders will appear here.</p></div>}

      {orders.map(order => {
        const isPending = order.status === 'pending'
        return (
          <article key={order.id} className="card overflow-hidden">
            <div className="flex flex-col gap-4 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-navy-950">{order.reference}</span>
                    <span className="rounded-full bg-cream-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-navy-600">{outletLabel(order.outlet)}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-2 text-xs text-navy-400">{new Date(order.created_at).toLocaleString('en-NG')}</p>
                </div>
                <span className="text-lg font-semibold text-navy-950">{naira(order.total)}</span>
              </div>

              <div className="rounded-2xl border border-black/5 bg-cream-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="rounded-xl bg-white p-2 text-gold-600"><MapPin size={15} /></span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.14em] text-navy-400">{order.takeout ? 'Takeaway / Delivery' : 'Serving location'}</p>
                    <p className="mt-1 text-sm font-semibold text-navy-950">{order.takeout ? order.delivery_address : order.delivery_label}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {(order.bar_order_items ?? []).map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-black/5 px-3.5 py-3 text-sm">
                    <span><b>{item.quantity}×</b> {item.drink_name}</span>
                    <span className="font-semibold">{naira(item.line_total)}</span>
                  </div>
                ))}
              </div>

              {order.notes && <p className="rounded-xl bg-cream-50 p-3 text-xs text-navy-500">Note: {order.notes}</p>}

              {isPending && (
                <div className="flex flex-col gap-2 border-t border-black/5 pt-4 sm:flex-row sm:justify-end">
                  <button type="button" disabled={saving} onClick={() => setEditing(order)} className="btn-outline btn-sm justify-center"><Edit3 size={13} />Modify order</button>
                  <button type="button" disabled={saving} onClick={() => void cancel(order)} className="btn-outline btn-sm justify-center border-red-200 text-red-600 hover:bg-red-50"><XCircle size={13} />Cancel order</button>
                </div>
              )}

              {!isPending && <p className="text-xs text-navy-400">This order can no longer be modified because the team has started processing it.</p>}
            </div>
          </article>
        )
      })}

      {editing && <EditOrderModal order={editing} activeBookings={activeBookings} saving={saving} onClose={() => setEditing(null)} onSave={draft => void save(editing, draft)} />}
    </div>
  )
}

type DraftOrder = {
  items: OrderItem[]
  takeout: boolean
  location: string
  bookingId: string
  deliveryLabel: string
  contactEmail: string
  contactPhone: string
  deliveryAddress: string
  notes: string
}

function EditOrderModal({ order, activeBookings, saving, onClose, onSave }: { order: Order; activeBookings: Booking[]; saving: boolean; onClose: () => void; onSave: (draft: DraftOrder) => void }) {
  const [draft, setDraft] = useState<DraftOrder>(() => ({
    items: (order.bar_order_items ?? []).map(item => ({ ...item })),
    takeout: Boolean(order.takeout),
    location: order.takeout ? '' : order.delivery_location,
    bookingId: '',
    deliveryLabel: order.delivery_label,
    contactEmail: order.contact_email || '',
    contactPhone: order.contact_phone || '',
    deliveryAddress: order.delivery_address || '',
    notes: order.notes || '',
  }))
  const total = useMemo(() => draft.items.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0), [draft.items])
  const unchangedTotal = Math.abs(total - Number(order.total)) < 0.001

  function setQty(id: string, delta: number) {
    setDraft(current => ({ ...current, items: current.items.map(item => item.id === id ? { ...item, quantity: Math.max(0, Math.min(50, item.quantity + delta)) } : item).filter(item => item.quantity > 0) }))
  }

  function chooseLocation(location: string) {
    const booking = activeBookings.find(item => item.type === location)
    setDraft(current => ({ ...current, location, bookingId: booking?.id || '', deliveryLabel: booking?.label || location.replaceAll('_', ' ') }))
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm md:items-center md:p-6">
      <div className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl md:rounded-2xl md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-gold-600">Pending order</p><h2 className="mt-1 text-2xl font-semibold text-navy-950">Modify {order.reference}</h2><p className="mt-1 text-sm text-navy-400">Changes are allowed only while the order is pending.</p></div>
          <button type="button" onClick={onClose} className="text-sm text-navy-400">Close</button>
        </div>

        <div className="mt-6 space-y-2">
          {draft.items.map(item => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-black/5 p-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.drink_name}</p><p className="text-xs text-navy-400">{naira(item.unit_price)} each</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => setQty(item.id,-1)} className="h-8 w-8 rounded-full border">−</button><span className="w-5 text-center text-sm">{item.quantity}</span><button type="button" onClick={() => setQty(item.id,1)} className="h-8 w-8 rounded-full bg-navy-950 text-white">+</button></div></div>)}
        </div>

        <div className="mt-6">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold-600">Serving location</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {[
              ['room','Room'],['short_let','Short-let'],['bar','Annex Bar'],['outdoor_eatery','Outdoor Eatery'],['vip_lounge','VIP Lounge'],
            ].map(([value,label]) => <button key={value} type="button" onClick={() => chooseLocation(value)} disabled={draft.takeout} className={'rounded-xl border p-3 text-left text-sm ' + (draft.location === value ? 'border-gold-500 bg-gold-500/10' : 'border-black/10')}>{label}</button>)}
          </div>
          <label className="mt-3 flex items-center gap-3 rounded-xl border border-black/10 p-3"><input type="checkbox" checked={draft.takeout} onChange={e => setDraft(current => ({ ...current, takeout:e.target.checked, location:'', bookingId:'' }))} className="h-4 w-4 accent-gold-500" /><span className="text-sm font-semibold">Takeaway / delivery</span></label>
          {(draft.location === 'room' || draft.location === 'short_let') && <div className="mt-2 space-y-2">{activeBookings.filter(b => b.type === draft.location).map(b => <button type="button" key={b.id} onClick={() => setDraft(current => ({ ...current, bookingId:b.id, deliveryLabel:b.label }))} className={'w-full rounded-xl border p-3 text-left text-sm ' + (draft.bookingId === b.id ? 'border-gold-500 bg-gold-500/10' : 'border-black/10')}>{b.label} · {b.reference}</button>)}</div>}
        </div>

        {draft.takeout && <div className="mt-4 grid gap-3 sm:grid-cols-2"><input className="field-input" value={draft.contactEmail} onChange={e => setDraft(current => ({...current,contactEmail:e.target.value}))} placeholder="Email address *" /><input className="field-input" value={draft.contactPhone} onChange={e => setDraft(current => ({...current,contactPhone:e.target.value}))} placeholder="Phone number *" /><textarea className="field-input !h-auto py-3 sm:col-span-2" rows={3} value={draft.deliveryAddress} onChange={e => setDraft(current => ({...current,deliveryAddress:e.target.value}))} placeholder="Delivery address *" /></div>}
        <textarea className="field-input !h-auto py-3 mt-3" rows={3} value={draft.notes} onChange={e => setDraft(current => ({...current,notes:e.target.value}))} placeholder="Special instructions" />

        {!unchangedTotal && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">The paid total is {naira(order.total)}. Item quantity changes must keep that total unchanged. For a different total, cancel this order and place a new one.</p>}
        <div className="mt-6 flex items-center justify-between gap-4 border-t border-black/5 pt-5"><div><p className="text-xs text-navy-400">Total paid</p><p className="text-xl font-semibold">{naira(total)}</p></div><button type="button" disabled={saving || !unchangedTotal || (!draft.takeout && !draft.location) || ((draft.location === 'room' || draft.location === 'short_let') && !draft.bookingId) || (draft.takeout && (!draft.contactEmail.trim() || !draft.contactPhone.trim() || !draft.deliveryAddress.trim()))} onClick={() => onSave(draft)} className="btn-primary btn-sm">{saving ? 'Saving…' : 'Save changes'}</button></div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const Icon = status === 'delivered' ? CheckCircle2 : status === 'cancelled' ? XCircle : status === 'pending' ? Clock3 : Package
  const className = status === 'delivered' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : status === 'cancelled' ? 'border-red-200 bg-red-50 text-red-700' : status === 'pending' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-blue-200 bg-blue-50 text-blue-700'
  return <span className={'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ' + className}><Icon size={12} />{STATUS[status] || status}</span>
}
