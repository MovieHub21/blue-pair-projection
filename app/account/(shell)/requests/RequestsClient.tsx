'use client'
import { useEffect, useMemo, useState } from 'react'
import { Shirt, UtensilsCrossed, Sparkles, Wrench, MessageCircle, Loader2, Minus, Plus, CreditCard, RefreshCw } from 'lucide-react'
import { useStore } from '../../../../store/useStore'
import type { GuestRequest } from '../../../../lib/mappers'

const TYPES = [
  { k: 'Extra towels', icon: Shirt }, { k: 'Room service', icon: UtensilsCrossed }, { k: 'Housekeeping', icon: Sparkles }, { k: 'Maintenance', icon: Wrench }, { k: 'Other request', icon: MessageCircle },
]
type OrderItem = { name: string; price: number; kind: string }
type CartItem = OrderItem & { quantity: number }
type RoomOrderItem = { name: string; kind: string; quantity: number; unitPrice: number; lineTotal: number }
type RoomOrder = { id: string; reference: string; room: string; items: RoomOrderItem[]; notes: string; total: number; payment_status: string; status: string; created_at: string }

const statusLabel: Record<string, string> = { pending: 'Paid · waiting for restaurant', being_attended_to: 'Being attended to', attended: 'Attended', delivered: 'Delivered', cancelled: 'Cancelled' }

export default function RequestsClient({ initialRequests, customerId, guestName, activeRoom, bookingRef, orderItems }: {
  initialRequests: GuestRequest[]; customerId: string | null; guestName: string; activeRoom?: string; bookingRef?: string; orderItems: OrderItem[]
}) {
  const pushToast = useStore(s => s.pushToast)
  const [selected, setSelected] = useState('Extra towels')
  const [note, setNote] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [sent, setSent] = useState(initialRequests)
  const [orders, setOrders] = useState<RoomOrder[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState(false)

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart])
  function addItem(item: OrderItem) { setCart(current => { const found = current.find(i => i.name === item.name && i.kind === item.kind); return found ? current.map(i => i === found ? { ...i, quantity: Math.min(50, i.quantity + 1) } : i) : [...current, { ...item, quantity: 1 }] }) }
  function changeQty(name: string, kind: string, delta: number) { setCart(current => current.map(i => i.name === name && i.kind === kind ? { ...i, quantity: Math.max(0, Math.min(50, i.quantity + delta)) } : i).filter(i => i.quantity > 0)) }

  async function loadOrders() {
    if (!customerId) return
    setLoadingOrders(true)
    const response = await fetch('/api/room-service/orders', { cache: 'no-store' })
    const data = await response.json().catch(() => ({}))
    setLoadingOrders(false)
    if (response.ok) setOrders((data.orders ?? []).map((o: any) => ({ ...o, items: Array.isArray(o.items) ? o.items : [] })))
  }
  useEffect(() => { void loadOrders(); const timer = window.setInterval(() => void loadOrders(), 15000); return () => window.clearInterval(timer) }, [customerId])

  async function submitRequest() {
    if (!customerId) { pushToast('Please sign in to submit a request', 'error'); return }
    setSubmitting(true)
    if (selected === 'Room service') {
      if (!activeRoom) { pushToast('Room service is available once you are checked in to a room.', 'error'); setSubmitting(false); return }
      if (!cart.length) { pushToast('Add at least one food or drink to your order.', 'error'); setSubmitting(false); return }
      try {
        const response = await fetch('/api/room-service/initialize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: cart.map(i => ({ name: i.name, quantity: i.quantity })), notes: note }) })
        const data = await response.json().catch(() => ({}))
        if (!response.ok || !data.authorizationUrl) throw new Error(data.error || 'Unable to start payment.')
        window.location.href = data.authorizationUrl
      } catch (error: any) { setSubmitting(false); pushToast(error.message || 'Unable to start payment.', 'error') }
      return
    }
    const id = `gr_${Date.now()}`
    const { error } = await (await import('../../../../lib/supabase/client')).supabase.from('guest_requests').insert({ id, customer_id: customerId, booking_ref: bookingRef ?? '', room: activeRoom ?? '', guest_name: guestName, type: selected, message: note, status: 'open' })
    if (error) { setSubmitting(false); pushToast('Could not submit request', 'error'); return }
    if (selected === 'Maintenance') {
      await fetch('/api/admin/room-lifecycle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'maintenance_request', requestId: id }) }).catch(() => null)
    }
    setSubmitting(false)
    setSent([{ id, customerId, bookingRef: bookingRef ?? '', room: activeRoom ?? '', guestName, type: selected, message: note, status: 'open', createdAt: new Date().toISOString().slice(0, 10) }, ...sent])
    setNote(''); pushToast(selected === 'Maintenance' ? 'Maintenance request sent to the maintenance team' : 'Request submitted to front desk', 'success')
  }

  return (
    <div className="grid lg:grid-cols-[1fr,1.2fr] gap-8">
      <div className="card p-6">
        <label className="field-label mb-2 block">Request type</label>
        <div className="grid grid-cols-2 gap-2.5 mb-5">{TYPES.map(t => <button key={t.k} onClick={() => setSelected(t.k)} className={'flex items-center gap-2 px-3.5 py-3 rounded-lg border text-xs font-semibold text-left ' + (selected === t.k ? 'border-navy-950 bg-cream-100' : 'border-black/10')}><t.icon size={15} className="text-gold-500" />{t.k}</button>)}</div>
        {selected === 'Room service' && <div className="rounded-xl bg-cream-100 p-3.5 mb-5">
          <div className="flex items-center justify-between mb-3"><div><label className="field-label mb-0">Food & drinks</label><p className="text-xs text-navy-500">Choose multiple items and quantities.</p></div><span className="text-xs font-semibold text-navy-600">Room {activeRoom || '—'}</span></div>
          {!activeRoom && <p className="text-xs text-red-600 bg-red-50 rounded-lg p-3 mb-3">You must be checked in before ordering room service.</p>}
          <div className="grid gap-2 max-h-72 overflow-y-auto pr-1">{orderItems.map(item => { const inCart = cart.find(i => i.name === item.name && i.kind === item.kind); return <div key={`${item.kind}-${item.name}`} className="bg-white rounded-lg border border-black/5 p-3 flex items-center justify-between gap-3"><div className="min-w-0"><div className="text-[10px] uppercase tracking-wide text-gold-600 font-bold">{item.kind}</div><div className="text-sm font-semibold text-navy-900 truncate">{item.name}</div><div className="text-xs text-navy-500">₦{item.price.toLocaleString('en-NG')}</div></div>{inCart ? <div className="flex items-center gap-2"><button onClick={() => changeQty(item.name, item.kind, -1)} className="w-7 h-7 rounded-full border flex items-center justify-center"><Minus size={13}/></button><b className="text-sm w-4 text-center">{inCart.quantity}</b><button onClick={() => changeQty(item.name, item.kind, 1)} className="w-7 h-7 rounded-full bg-navy-950 text-white flex items-center justify-center"><Plus size={13}/></button></div> : <button onClick={() => addItem(item)} disabled={!activeRoom} className="btn-outline btn-sm"><Plus size={13}/>Add</button>}</div>})}</div>
          {cart.length > 0 && <div className="mt-4 pt-4 border-t border-black/10"><div className="space-y-1.5">{cart.map(item => <div key={`${item.kind}-${item.name}`} className="flex justify-between text-xs"><span>{item.quantity}× {item.name}</span><b>₦{(item.price * item.quantity).toLocaleString('en-NG')}</b></div>)}</div><div className="flex justify-between text-base font-bold mt-3"><span>Total</span><span>₦{total.toLocaleString('en-NG')}</span></div></div>}
          <div className="mt-4 flex items-center gap-2 text-[11px] text-navy-500"><CreditCard size={14} className="text-gold-600" />Payment is required through Paystack before the restaurant receives the order.</div>
        </div>}
        <label className="field-label">{selected === 'Room service' ? 'Delivery notes' : 'Details'}</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} className="field-input !h-auto py-2.5 mb-5" placeholder={selected === 'Room service' ? 'Allergies, preferences or delivery instructions...' : 'Let us know more...'} />
        <button onClick={submitRequest} disabled={submitting} className="btn-primary w-full justify-center disabled:opacity-60 flex items-center gap-2">{submitting && <Loader2 size={15} className="animate-spin" />}{selected === 'Room service' ? (submitting ? 'Opening Paystack…' : `Pay ₦${total.toLocaleString('en-NG')} & place order`) : (submitting ? 'Submitting…' : 'Submit request')}</button>
      </div>
      <div className="space-y-6">
        <div><div className="flex items-center justify-between mb-3"><h4 className="font-semibold text-sm">Room-service orders</h4><button onClick={() => void loadOrders()} className="text-xs text-navy-500 flex items-center gap-1"><RefreshCw size={12} className={loadingOrders ? 'animate-spin' : ''}/>Refresh</button></div><div className="flex flex-col gap-3">{orders.length === 0 && <div className="card p-4 text-sm text-navy-400">No paid room-service orders yet.</div>}{orders.map(order => <div key={order.id} className="card p-4"><div className="flex items-start justify-between gap-3"><div><b className="text-sm">{order.reference}</b><p className="text-xs text-navy-400 mt-0.5">Room {order.room}</p></div><span className={order.status === 'delivered' ? 'pill-green' : order.status === 'attended' ? 'pill-blue' : 'pill-amber'}>{statusLabel[order.status] || order.status}</span></div><div className="mt-3 text-xs text-navy-600 space-y-1">{order.items.map((item, i) => <div key={i} className="flex justify-between"><span>{item.quantity}× {item.name}</span><span>₦{item.lineTotal.toLocaleString('en-NG')}</span></div>)}</div><div className="flex justify-between border-t mt-3 pt-3 text-sm font-bold"><span>Total paid</span><span>₦{Number(order.total).toLocaleString('en-NG')}</span></div>{order.notes && <p className="text-xs text-navy-500 mt-2">Note: {order.notes}</p>}</div>)}</div></div>
        <div><h4 className="font-semibold mb-3 text-sm">Your other requests</h4><div className="flex flex-col gap-3">{sent.length === 0 && <div className="card p-4 text-sm text-navy-400">No requests yet.</div>}{sent.map((s, i) => <div key={s.id ?? i} className="card p-4"><span className="pill-blue">{s.type}</span><p className="text-sm text-navy-600 mt-2">{s.message || '—'}</p></div>)}</div></div>
      </div>
    </div>
  )
}
