'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { mapOffer } from '../../../lib/mappers'
import { pushToast } from '../../../components/ui/Toast'
import Modal from '../../../components/ui/Modal'
import DeleteConfirmDialog from '../../../components/ui/DeleteConfirmDialog'
import { Plus } from 'lucide-react'
import type { Offer } from '../../../data/mock'

const CATEGORIES: Offer['category'][] = ['Room', 'Restaurant', 'Seasonal', 'Package']

export default function OffersManagement() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Offer | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Offer | null>(null)
  const [draft, setDraft] = useState({ title: '', description: '', category: 'Room' as Offer['category'], discount: '' })
  const [editDraft, setEditDraft] = useState({ title: '', description: '', category: 'Room' as Offer['category'], discount: '' })

  const loadOffers = useCallback(async () => {
    const { data, error } = await supabase.from('offers').select('*').order('title')
    if (error) {
      console.error('[offers] fetch error:', error.message)
    } else if (data) {
      setOffers(data.map(mapOffer))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadOffers()
    const handleDbChange = (e: CustomEvent<{ table?: string }>) => {
      if (!e.detail?.table || e.detail.table === 'offers') {
        loadOffers()
      }
    }
    window.addEventListener('bluepair:database-change', handleDbChange as EventListener)
    return () => {
      window.removeEventListener('bluepair:database-change', handleDbChange as EventListener)
    }
  }, [loadOffers])

  async function submit() {
    if (!draft.title) return
    const o: Offer = { id: `o_${Date.now()}`, title: draft.title, description: draft.description, category: draft.category, discount: draft.discount || '—', active: true }
    setOffers(prev => [o, ...prev])
    setShowAdd(false)
    setDraft({ title: '', description: '', category: 'Room', discount: '' })

    const { error } = await supabase.from('offers').insert({
      id: o.id,
      title: o.title,
      description: o.description,
      discount: o.discount,
      category: o.category,
      active: o.active,
    })
    if (error) {
      pushToast('Failed to create offer: ' + error.message, 'error')
      loadOffers()
    } else {
      pushToast('Offer created', 'success')
    }
  }

  function openEdit(o: Offer) {
    setEditing(o)
    setEditDraft({ title: o.title, description: o.description, category: o.category, discount: o.discount })
  }

  async function saveEdit() {
    if (!editing) return
    const id = editing.id
    const patch = { ...editDraft }
    setOffers(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o))
    setEditing(null)

    const { error } = await supabase.from('offers').update(patch).eq('id', id)
    if (error) {
      pushToast('Failed to update offer: ' + error.message, 'error')
      loadOffers()
    } else {
      pushToast('Offer updated', 'success')
    }
  }

  async function toggleOfferActive(id: string) {
    const target = offers.find(o => o.id === id)
    if (!target) return
    const next = !target.active
    setOffers(prev => prev.map(o => o.id === id ? { ...o, active: next } : o))

    const { error } = await supabase.from('offers').update({ active: next }).eq('id', id)
    if (error) {
      pushToast('Failed to toggle offer: ' + error.message, 'error')
      loadOffers()
    } else {
      pushToast('Offer status updated', 'info')
    }
  }

  async function deleteOffer(id: string) {
    setOffers(prev => prev.filter(o => o.id !== id))
    const { error } = await supabase.from('offers').delete().eq('id', id)
    if (error) {
      pushToast('Failed to delete offer: ' + error.message, 'error')
      loadOffers()
    } else {
      pushToast('Offer deleted', 'success')
    }
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
              <div className="flex gap-2"><button onClick={() => openEdit(o)} className="text-xs font-semibold text-navy-900">Edit</button><button onClick={() => setDeleteTarget(o)} className="text-xs font-semibold text-red-600">Delete</button></div>
            </div>
          </div>
        ))}
        {!loading && offers.length === 0 && <p className="text-sm text-navy-400">No offers yet.</p>}
        {loading && <p className="text-sm text-navy-400">Loading offers...</p>}
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
      <DeleteConfirmDialog open={!!deleteTarget} itemName={deleteTarget?.title} description="This offer will be permanently removed from the offers list." onCancel={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) deleteOffer(deleteTarget.id) }} />
    </div>
  )
}
