'use client'
import { useState } from 'react'
import { useStore } from '../../../../store/useStore'
import { Shirt, UtensilsCrossed, Sparkles, Wrench, MessageCircle } from 'lucide-react'

const TYPES = [
  { k: 'Extra towels', icon: Shirt },
  { k: 'Room service', icon: UtensilsCrossed },
  { k: 'Housekeeping', icon: Sparkles },
  { k: 'Maintenance', icon: Wrench },
  { k: 'Other request', icon: MessageCircle },
]

export default function SpecialRequestsPage() {
  const { pushToast } = useStore()
  const [selected, setSelected] = useState('Extra towels')
  const [note, setNote] = useState('')
  const [sent, setSent] = useState<{type:string; note:string}[]>([
    { type: 'Room service', note: 'Please send a bottle of water and light snacks to Room 401 around 8pm.' },
  ])

  function submit() {
    setSent([{ type: selected, note }, ...sent])
    setNote('')
    pushToast('Request submitted to front desk', 'success')
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Special Requests</h1>
      <div className="grid lg:grid-cols-[1fr,1.2fr] gap-8">
        <div className="card p-6">
          <label className="field-label mb-2 block">Request type</label>
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            {TYPES.map(t => (
              <button key={t.k} onClick={() => setSelected(t.k)} className={'flex items-center gap-2 px-3.5 py-3 rounded-lg border text-xs font-semibold text-left ' + (selected===t.k ? 'border-navy-950 bg-cream-100' : 'border-black/10')}>
                <t.icon size={15} className="text-gold-500" />{t.k}
              </button>
            ))}
          </div>
          <label className="field-label">Details</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={4} className="field-input !h-auto py-2.5 mb-5" placeholder="Let us know more..." />
          <button onClick={submit} className="btn-primary w-full justify-center">Submit request</button>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Your requests</h4>
          <div className="flex flex-col gap-3">
            {sent.map((s, i) => (
              <div key={i} className="card p-4">
                <span className="pill-blue">{s.type}</span>
                <p className="text-sm text-navy-600 mt-2">{s.note || '—'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
