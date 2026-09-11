'use client'
import { useState } from 'react'
import { Shirt, UtensilsCrossed, Sparkles, Wrench, MessageCircle, Loader2 } from 'lucide-react'
import { supabase } from '../../../../lib/supabase/client'
import { useStore } from '../../../../store/useStore'
import type { GuestRequest } from '../../../../lib/mappers'

const TYPES = [
  { k: 'Extra towels', icon: Shirt },
  { k: 'Room service', icon: UtensilsCrossed },
  { k: 'Housekeeping', icon: Sparkles },
  { k: 'Maintenance', icon: Wrench },
  { k: 'Other request', icon: MessageCircle },
]

export default function RequestsClient({ initialRequests, customerId, guestName, activeRoom, bookingRef, orderItems }: {
  initialRequests: GuestRequest[]; customerId: string | null; guestName: string; activeRoom?: string; bookingRef?: string
  orderItems: { name: string; price: number; kind: string }[]
}) {
  const pushToast = useStore(s => s.pushToast)
  const [selected, setSelected] = useState('Extra towels')
  const [note, setNote] = useState('')
  const [order, setOrder] = useState('')
  const [sent, setSent] = useState(initialRequests)
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!customerId) { pushToast('Please sign in to submit a request', 'error'); return }
    setSubmitting(true)
    const id = `gr_${Date.now()}`
    if (selected === 'Room service' && !order) { pushToast('Choose a food or drink to order.', 'error'); return }
    if (selected === 'Room service' && !activeRoom) { pushToast('Room service is available once you are checked in to a room.', 'error'); return }
    const selectedItem = orderItems.find(item => item.name === order)
    const message = selected === 'Room service'
      ? `Room service order: ${selectedItem?.name ?? order}${selectedItem ? ` — ₦${selectedItem.price.toLocaleString('en-NG')}` : ''}${note ? `. Notes: ${note}` : ''}`
      : note
    const { error } = await supabase.from('guest_requests').insert({
      id, customer_id: customerId, booking_ref: bookingRef ?? '', room: activeRoom ?? '', guest_name: guestName, type: selected, message, status: 'open',
    })
    setSubmitting(false)
    if (error) { pushToast('Could not submit request', 'error'); return }
    setSent([{ id, customerId, bookingRef: bookingRef ?? '', room: activeRoom ?? '', guestName, type: selected, message, status: 'open', createdAt: new Date().toISOString().slice(0, 10) }, ...sent])
    setNote('')
    setOrder('')
    pushToast(selected === 'Room service' ? `Order sent to Room ${activeRoom}` : 'Request submitted to front desk', 'success')
  }

  return (
    <div className="grid lg:grid-cols-[1fr,1.2fr] gap-8">
      <div className="card p-6">
        <label className="field-label mb-2 block">Request type</label>
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {TYPES.map(t => (
            <button key={t.k} onClick={() => setSelected(t.k)} className={'flex items-center gap-2 px-3.5 py-3 rounded-lg border text-xs font-semibold text-left ' + (selected === t.k ? 'border-navy-950 bg-cream-100' : 'border-black/10')}>
              <t.icon size={15} className="text-gold-500" />{t.k}
            </button>
          ))}
        </div>
        {selected === 'Room service' && (
          <div className="mb-5 rounded-xl bg-cream-100 p-3.5">
            <label className="field-label">Food or drink</label>
            <select value={order} onChange={e => setOrder(e.target.value)} className="field-input">
              <option value="">Choose from the menu</option>
              {orderItems.map(item => <option key={`${item.kind}-${item.name}`} value={item.name}>{item.kind} · {item.name} — ₦{item.price.toLocaleString('en-NG')}</option>)}
            </select>
            <p className="text-xs text-navy-500 mt-2">{activeRoom ? `Delivery is prefilled for your checked-in room: ${activeRoom}.` : 'Check in to a room to place a room-service order.'}</p>
          </div>
        )}
        <label className="field-label">Details</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={4} className="field-input !h-auto py-2.5 mb-5" placeholder="Let us know more..." />
        <button onClick={submit} disabled={submitting} className="btn-primary w-full justify-center disabled:opacity-60 flex items-center gap-2">{submitting && <Loader2 size={15} className="animate-spin" />}{submitting ? 'Submitting…' : 'Submit request'}</button>
      </div>
      <div>
        <h4 className="font-semibold mb-3 text-sm">Your requests</h4>
        <div className="flex flex-col gap-3">
          {sent.length === 0 && <div className="card p-4 text-sm text-navy-400">No requests yet.</div>}
          {sent.map((s, i) => (
            <div key={s.id ?? i} className="card p-4">
              <span className="pill-blue">{s.type}</span>
              <p className="text-sm text-navy-600 mt-2">{s.message || '—'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
