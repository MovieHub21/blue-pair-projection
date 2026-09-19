'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { mapBillboard } from '../../../lib/mappers'
import { pushToast } from '../../../components/ui/Toast'
import EditablePrice from '../../../components/admin/EditablePrice'
import Modal from '../../../components/ui/Modal'
import DeleteConfirmDialog from '../../../components/ui/DeleteConfirmDialog'
import ImageUploader from '../../../components/admin/ImageUploader'
import { Plus } from 'lucide-react'
import type { BillboardSpace } from '../../../data/mock'

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=900&q=80'

export default function BillboardManagement() {
  const [billboards, setBillboards] = useState<BillboardSpace[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<BillboardSpace | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BillboardSpace | null>(null)
  const [draft, setDraft] = useState({ location: '', dimensions: '', price: '', image: DEFAULT_IMAGE })
  const [editDraft, setEditDraft] = useState({ location: '', dimensions: '', price: '', image: '' })

  const loadBillboards = useCallback(async () => {
    const { data, error } = await supabase.from('billboards').select('*').order('price', { ascending: false })
    if (!error && data) setBillboards(data.map(mapBillboard))
  }, [])

  useEffect(() => {
    loadBillboards()
    const handleDbChange = (e: CustomEvent<{ table?: string }>) => {
      if (!e.detail?.table || e.detail.table === 'billboards') loadBillboards()
    }
    window.addEventListener('bluepair:database-change', handleDbChange as EventListener)
    return () => window.removeEventListener('bluepair:database-change', handleDbChange as EventListener)
  }, [loadBillboards])

  async function submit() {
    if (!draft.location) return
    const b: BillboardSpace = { id: `bb_${Date.now()}`, location: draft.location, dimensions: draft.dimensions, price: Number(draft.price) || 0, image: draft.image || DEFAULT_IMAGE, available: true }
    setBillboards(prev => [b, ...prev])
    setShowAdd(false)
    setDraft({ location: '', dimensions: '', price: '', image: DEFAULT_IMAGE })

    const { error } = await supabase.from('billboards').insert({ id: b.id, location: b.location, dimensions: b.dimensions, price: b.price, image: b.image, available: b.available })
    if (error) {
      pushToast('Failed to add space: ' + error.message, 'error')
      loadBillboards()
    } else {
      pushToast('Billboard space added', 'success')
    }
  }

  function openEdit(b: BillboardSpace) {
    setEditing(b)
    setEditDraft({ location: b.location, dimensions: b.dimensions, price: String(b.price), image: b.image })
  }

  async function saveEdit() {
    if (!editing) return
    const id = editing.id
    const patch = { location: editDraft.location, dimensions: editDraft.dimensions, price: Number(editDraft.price), image: editDraft.image }
    setBillboards(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b))
    setEditing(null)

    const { error } = await supabase.from('billboards').update(patch).eq('id', id)
    if (error) {
      pushToast('Failed to update: ' + error.message, 'error')
      loadBillboards()
    } else {
      pushToast('Billboard updated', 'success')
    }
  }

  async function updateBillboardPrice(id: string, price: number) {
    setBillboards(prev => prev.map(b => b.id === id ? { ...b, price } : b))
    const { error } = await supabase.from('billboards').update({ price }).eq('id', id)
    if (error) {
      pushToast('Failed to update price: ' + error.message, 'error')
      loadBillboards()
    }
  }

  async function toggleBillboardAvailable(id: string) {
    const target = billboards.find(b => b.id === id)
    if (!target) return
    const next = !target.available
    setBillboards(prev => prev.map(b => b.id === id ? { ...b, available: next } : b))
    const { error } = await supabase.from('billboards').update({ available: next }).eq('id', id)
    if (error) {
      pushToast('Failed to update status: ' + error.message, 'error')
      loadBillboards()
    }
  }

  async function deleteBillboard(id: string) {
    setBillboards(prev => prev.filter(b => b.id !== id))
    const { error } = await supabase.from('billboards').delete().eq('id', id)
    if (error) {
      pushToast('Failed to delete: ' + error.message, 'error')
      loadBillboards()
    } else {
      pushToast('Billboard space deleted', 'success')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Billboard Management</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary btn-sm flex items-center gap-1.5"><Plus size={14}/>Add space</button>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        {billboards.map(b => (
          <div key={b.id} className="card overflow-hidden">
            <div className="h-32"><img src={b.image} className="w-full h-full object-cover" alt={b.location} /></div>
            <div className="p-5">
              <b className="block">{b.location}</b>
              <span className="text-xs text-navy-400">{b.dimensions}</span>
              <div className="flex justify-between items-center mt-3">
                <EditablePrice value={b.price} onSave={v => updateBillboardPrice(b.id, v)} />
                <button onClick={() => toggleBillboardAvailable(b.id)} className={b.available ? 'pill-green' : 'pill-red'}>{b.available ? 'Available' : 'Reserved'}</button>
              </div>
              <div className="flex gap-2 mt-3"><button onClick={() => openEdit(b)} className="text-xs font-semibold text-navy-900">Edit</button><button onClick={() => setDeleteTarget(b)} className="text-xs font-semibold text-red-600">Delete</button></div>
            </div>
          </div>
        ))}
        {billboards.length === 0 && <p className="text-sm text-navy-400">No billboard spaces yet.</p>}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add billboard space">
        <div className="grid gap-4">
          <div><label className="field-label">Location</label><input className="field-input" value={draft.location} onChange={e=>setDraft({...draft,location:e.target.value})} placeholder="Main Entrance Gate" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="field-label">Dimensions</label><input className="field-input" value={draft.dimensions} onChange={e=>setDraft({...draft,dimensions:e.target.value})} placeholder="20ft x 10ft" /></div>
            <div><label className="field-label">Price (₦)</label><input type="number" className="field-input" value={draft.price} onChange={e=>setDraft({...draft,price:e.target.value})} /></div>
          </div>
          <div><label className="field-label">Photo</label><div className="flex items-center gap-4"><div className="w-28 h-20 rounded-lg overflow-hidden bg-cream-100"><img src={draft.image} className="w-full h-full object-cover" alt="" /></div><ImageUploader folder="billboards/new" label="Upload from device" onUploaded={urls => setDraft({ ...draft, image: urls[0] })} /></div></div>
        </div>
        <button onClick={submit} className="btn-primary w-full justify-center mt-6">Add space</button>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit billboard space">
        <div className="grid gap-4">
          <div><label className="field-label">Location</label><input className="field-input" value={editDraft.location} onChange={e=>setEditDraft({...editDraft,location:e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4"><div><label className="field-label">Dimensions</label><input className="field-input" value={editDraft.dimensions} onChange={e=>setEditDraft({...editDraft,dimensions:e.target.value})} /></div><div><label className="field-label">Price (₦)</label><input type="number" className="field-input" value={editDraft.price} onChange={e=>setEditDraft({...editDraft,price:e.target.value})} /></div></div>
          <div><label className="field-label">Photo</label><div className="flex items-center gap-4"><div className="w-28 h-20 rounded-lg overflow-hidden bg-cream-100"><img src={editDraft.image} className="w-full h-full object-cover" alt="" /></div><ImageUploader folder={`billboards/${editing?.id}`} label="Upload from device" onUploaded={urls => setEditDraft({ ...editDraft, image: urls[0] })} /></div></div>
        </div>
        <button onClick={saveEdit} className="btn-primary w-full justify-center mt-6">Save changes</button>
      </Modal>
      <DeleteConfirmDialog open={!!deleteTarget} itemName={deleteTarget?.location} description="This billboard space will be permanently removed from management." onCancel={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) deleteBillboard(deleteTarget.id) }} />
    </div>
  )
}
