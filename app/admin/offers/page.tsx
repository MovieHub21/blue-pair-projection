'use client'
import { useState } from 'react'
import { useStore } from '../../../store/useStore'
import Modal from '../../../components/ui/Modal'
import { Plus } from 'lucide-react'

export default function OffersManagement() {
  const { offers, toggleOfferActive, pushToast } = useStore()
  const [showAdd, setShowAdd] = useState(false)

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Offers &amp; Promotions</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary btn-sm flex items-center gap-1.5"><Plus size={14}/>Create offer</button>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        {offers.map(o => (
          <div key={o.id} className="card p-6 flex flex-col gap-2.5">
            <div className="flex justify-between items-start">
              <span className="tag">{o.category}</span>
              <button onClick={() => toggleOfferActive(o.id)} className={o.active ? 'pill-green' : 'pill-amber'}>{o.active ? 'Active' : 'Paused'}</button>
            </div>
            <b className="text-lg">{o.title}</b>
            <p className="text-sm text-navy-500">{o.description}</p>
            <span className="pill-gold w-fit">{o.discount}</span>
          </div>
        ))}
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create offer">
        <div className="grid gap-4">
          <div><label className="field-label">Offer title</label><input className="field-input" placeholder="Weekend Getaway Special" /></div>
          <div><label className="field-label">Description</label><textarea className="field-input !h-auto py-2.5" rows={3} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="field-label">Category</label><select className="field-input"><option>Room</option><option>Restaurant</option><option>Package</option><option>Seasonal</option></select></div>
            <div><label className="field-label">Discount label</label><input className="field-input" placeholder="20% off" /></div>
          </div>
        </div>
        <button onClick={() => { pushToast('Offer created', 'success'); setShowAdd(false) }} className="btn-primary w-full justify-center mt-6">Create offer</button>
      </Modal>
    </div>
  )
}
