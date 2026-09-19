'use client'

import { useCallback, useEffect, useState } from 'react'
import { naira } from '../../../lib/format'
import EditablePrice from '../../../components/admin/EditablePrice'
import Modal from '../../../components/ui/Modal'
import DeleteConfirmDialog from '../../../components/ui/DeleteConfirmDialog'
import ImageUploader from '../../../components/admin/ImageUploader'
import { Plus } from 'lucide-react'
import { pushToast } from '../../../components/ui/Toast'
import { supabase } from '../../../lib/supabase/client'
import { mapShortLet } from '../../../lib/mappers'
import type { ShortLet } from '../../../data/mock'

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80'

export default function ShortLetManagement() {
  const [shortLets, setShortLets] = useState<ShortLet[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<ShortLet | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ShortLet | null>(null)
  const [draft, setDraft] = useState({ name: '', type: 'Apartment', price: '', bedrooms: '1', amenities: '', image: DEFAULT_IMAGE, description: '' })
  const [editDraft, setEditDraft] = useState({ name: '', type: '', price: '', bedrooms: '', amenities: '', image: '', description: '' })

  const loadShortLets = useCallback(async () => {
    const { data } = await supabase.from('short_lets').select('*').order('price')
    if (data) setShortLets(data.map(mapShortLet))
  }, [])

  useEffect(() => {
    void loadShortLets()

    const refresh = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.table || detail.table === 'short_lets') {
        void loadShortLets()
      }
    }

    window.addEventListener('bluepair:database-change', refresh)
    return () => window.removeEventListener('bluepair:database-change', refresh)
  }, [loadShortLets])

  async function submit() {
    if (!draft.name) return
    const sl: ShortLet = {
      id: `sl_${Date.now()}`,
      name: draft.name,
      type: draft.type,
      price: Number(draft.price) || 0,
      bedrooms: Number(draft.bedrooms),
      amenities: draft.amenities.split(',').map(a => a.trim()).filter(Boolean),
      image: draft.image || DEFAULT_IMAGE,
      available: true,
      description: draft.description,
    }
    const { error } = await supabase.from('short_lets').insert({
      id: sl.id,
      name: sl.name,
      type: sl.type,
      price: sl.price,
      bedrooms: sl.bedrooms,
      amenities: sl.amenities,
      image: sl.image,
      available: sl.available,
      description: sl.description,
    })
    if (error) {
      pushToast('Failed to add short-let: ' + error.message, 'error')
      return
    }
    await loadShortLets()
    setShowAdd(false)
    setDraft({ name: '', type: 'Apartment', price: '', bedrooms: '1', amenities: '', image: DEFAULT_IMAGE, description: '' })
    pushToast('Short-let property added', 'success')
  }

  function openEdit(sl: ShortLet) {
    setEditing(sl)
    setEditDraft({
      name: sl.name,
      type: sl.type,
      price: String(sl.price),
      bedrooms: String(sl.bedrooms),
      amenities: sl.amenities.join(', '),
      image: sl.image,
      description: sl.description,
    })
  }

  async function saveEdit() {
    if (!editing) return
    const patch = {
      name: editDraft.name,
      type: editDraft.type,
      price: Number(editDraft.price),
      bedrooms: Number(editDraft.bedrooms),
      amenities: editDraft.amenities.split(',').map(a => a.trim()).filter(Boolean),
      image: editDraft.image,
      description: editDraft.description,
    }
    const { error } = await supabase.from('short_lets').update(patch).eq('id', editing.id)
    if (error) {
      pushToast('Failed to update short-let: ' + error.message, 'error')
      return
    }
    await loadShortLets()
    setEditing(null)
    pushToast('Short-let property updated', 'success')
  }

  async function toggleAvailable(id: string) {
    const current = shortLets.find(x => x.id === id)
    if (!current) return
    const next = !current.available
    const { error } = await supabase.from('short_lets').update({ available: next }).eq('id', id)
    if (error) {
      pushToast('Failed to update availability', 'error')
      return
    }
    setShortLets(prev => prev.map(x => (x.id === id ? { ...x, available: next } : x)))
    pushToast(`Short-let marked as ${next ? 'available' : 'booked'}`, 'info')
  }

  async function updatePrice(id: string, price: number) {
    const { error } = await supabase.from('short_lets').update({ price }).eq('id', id)
    if (error) {
      pushToast('Failed to update price', 'error')
      return
    }
    setShortLets(prev => prev.map(x => (x.id === id ? { ...x, price } : x)))
    pushToast('Price updated', 'success')
  }

  async function deleteShortLet(id: string) {
    const { error } = await supabase.from('short_lets').delete().eq('id', id)
    if (error) {
      pushToast('Failed to delete property', 'error')
      return
    }
    await loadShortLets()
    setDeleteTarget(null)
    pushToast('Short-let property deleted', 'success')
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Short-let Management</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary btn-sm flex items-center gap-1.5">
          <Plus size={14} />Add property
        </button>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        {shortLets.map(sl => (
          <div key={sl.id} className="card overflow-hidden grid grid-cols-[88px_minmax(0,1fr)] sm:grid-cols-[128px_minmax(0,1fr)]">
            <img src={sl.image} className="w-full h-full min-h-[150px] object-cover" alt={sl.name} />
            <div className="p-3.5 sm:p-5 min-w-0">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                <div className="min-w-0">
                  <b className="block truncate">{sl.name}</b>
                  <span className="text-xs text-navy-400 block truncate">{sl.type} · {sl.bedrooms} bedrooms</span>
                </div>
                <button onClick={() => void toggleAvailable(sl.id)} className={sl.available ? 'pill-green' : 'pill-red'}>
                  {sl.available ? 'Available' : 'Booked'}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {sl.amenities.slice(0, 3).map(a => <span key={a} className="tag">{a}</span>)}
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 mt-3">
                <EditablePrice value={sl.price} onSave={v => void updatePrice(sl.id, v)} />
                <div className="flex gap-2">
                  <button onClick={() => openEdit(sl)} className="text-xs font-semibold text-navy-900">Edit</button>
                  <button onClick={() => setDeleteTarget(sl)} className="text-xs font-semibold text-red-600">Delete</button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {shortLets.length === 0 && <p className="text-sm text-navy-400">No short-let properties yet.</p>}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add short-let property">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="field-label">Name</label>
            <input className="field-input" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="Garden Apartment" />
          </div>
          <div>
            <label className="field-label">Type</label>
            <input className="field-input" value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Bedrooms</label>
            <input type="number" className="field-input" value={draft.bedrooms} onChange={e => setDraft({ ...draft, bedrooms: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="field-label">Price / night (₦)</label>
            <input type="number" className="field-input" value={draft.price} onChange={e => setDraft({ ...draft, price: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="field-label">Amenities (comma separated)</label>
            <input className="field-input" value={draft.amenities} onChange={e => setDraft({ ...draft, amenities: e.target.value })} placeholder="WiFi, Kitchen, Parking" />
          </div>
          <div className="col-span-2">
            <label className="field-label">Description</label>
            <textarea className="field-input !h-auto py-2.5" rows={3} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="field-label">Photo</label>
            <div className="flex items-center gap-4">
              <div className="w-28 h-20 rounded-lg overflow-hidden bg-cream-100">
                <img src={draft.image} className="w-full h-full object-cover" alt="" />
              </div>
              <ImageUploader folder="shortlets/new" label="Upload from device" onUploaded={urls => setDraft({ ...draft, image: urls[0] })} />
            </div>
          </div>
        </div>
        <button onClick={() => void submit()} className="btn-primary w-full justify-center mt-6">Add property</button>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit short-let property">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="field-label">Name</label>
            <input className="field-input" value={editDraft.name} onChange={e => setEditDraft({ ...editDraft, name: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Type</label>
            <input className="field-input" value={editDraft.type} onChange={e => setEditDraft({ ...editDraft, type: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Bedrooms</label>
            <input type="number" className="field-input" value={editDraft.bedrooms} onChange={e => setEditDraft({ ...editDraft, bedrooms: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="field-label">Price / night (₦)</label>
            <input type="number" className="field-input" value={editDraft.price} onChange={e => setEditDraft({ ...editDraft, price: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="field-label">Amenities (comma separated)</label>
            <input className="field-input" value={editDraft.amenities} onChange={e => setEditDraft({ ...editDraft, amenities: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="field-label">Description</label>
            <textarea className="field-input !h-auto py-2.5" rows={3} value={editDraft.description} onChange={e => setEditDraft({ ...editDraft, description: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="field-label">Photo</label>
            <div className="flex items-center gap-4">
              <div className="w-28 h-20 rounded-lg overflow-hidden bg-cream-100">
                <img src={editDraft.image} className="w-full h-full object-cover" alt="" />
              </div>
              <ImageUploader folder={`shortlets/${editing?.id}`} label="Upload from device" onUploaded={urls => setEditDraft({ ...editDraft, image: urls[0] })} />
            </div>
          </div>
        </div>
        <button onClick={() => void saveEdit()} className="btn-primary w-full justify-center mt-6">Save changes</button>
      </Modal>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        itemName={deleteTarget?.name}
        description="This short-let property will be permanently removed from management."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) void deleteShortLet(deleteTarget.id) }}
      />
    </div>
  )
}
