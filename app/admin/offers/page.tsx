'use client'
import { useState } from 'react'
import { useStore } from '../../../store/useStore'
import Modal from '../../../components/ui/Modal'
import { Plus } from 'lucide-react'
import type { Offer } from '../../../data/mock'

const CATEGORIES: Offer['category'][] = ['Room', 'Restaurant', 'Seasonal', 'Package']

export default function OffersManagement() {
  const { offers, toggleOfferActive, addOffer, updateOffer, deleteOffer } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Offer | null>(null)
  const [draft, setDraft] = useState({ title: '', description: '', category: 'Room' as Offer['category'], discount: '' })
  const [editDraft, setEditDraft] = useState({ title: '', description: '', category: 'Room' as Offer['category'], discount: '' })

  function submit() {
    if (!draft.title) return
    const o: Offer = { id: `o_${Date.now()}`, title: draft.title, description: draft.description, category: draft.category, discount: draft.discount || '—', active: true }
    addOffer(o)
    setShowAdd(false)
    setDraft({ title: '', description: '', category: 'Room', discount: '' })
  }

  function openEdit(o: Offer) {
    setEditing(o)
    setEditDraft({ title: o.title, description: o.description, category: o.category, discount: o.discount })
  }

  function saveEdit() {
    if (!editing) return
    updateOffer(editing.id, editDraft)
    setEditing(null)
  }

  function remove(id: string) {
    if (confirm('Delete this offer?')) deleteOffer(id)
  }

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
            <div className="flex justify-between items-center">
              <span className="pill-gold w-fit">{o.discount}</span>
              <div className="flex gap-2"><button onClick={() => openEdit(o)} className="text-xs font-semibold text-navy-900">Edit</button><button onClick={() => remove(o.id)} className="text-xs font-semibold text-red-600">Delete</button></div>
            </div>
          </div>
        ))}
        {offers.length === 0 && <p className="text-sm text-navy-400">No offers yet.</p>}
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create offer">
        <div className="grid gap-4">
          <div><label className="field-label">Offer title</label><input className="field-input" value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} placeholder="Weekend Getaway Special" /></div>
          <div><label className="field-label">Description</label><textarea className="field-input !h-auto py-2.5" rows={3} value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="field-label">Category</label><select className="field-input" value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value as Offer['category']})}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
            <div><label className="field-label">Discount label</label><input className="field-input" value={draft.discount} onChange={e=>setDraft({...draft,discount:e.target.value})} placeholder="20% off" /></div>
          </div>
        </div>
        <button onClick={submit} className="btn-primary w-full justify-center mt-6">Create offer</button>
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit offer">
        <div className="grid gap-4">
          <div><label className="field-label">Offer title</label><input className="field-input" value={editDraft.title} onChange={e=>setEditDraft({...editDraft,title:e.target.value})} /></div>
          <div><label className="field-label">Description</label><textarea className="field-input !h-auto py-2.5" rows={3} value={editDraft.description} onChange={e=>setEditDraft({...editDraft,description:e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="field-label">Category</label><select className="field-input" value={editDraft.category} onChange={e=>setEditDraft({...editDraft,category:e.target.value as Offer['category']})}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
            <div><label className="field-label">Discount label</label><input className="field-input" value={editDraft.discount} onChange={e=>setEditDraft({...editDraft,discount:e.target.value})} /></div>
          </div>
        </div>
        <button onClick={saveEdit} className="btn-primary w-full justify-center mt-6">Save changes</button>
      </Modal>
    </div>
  )
}
