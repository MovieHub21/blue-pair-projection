'use client'

import { useCallback, useEffect, useState } from 'react'
import EditablePrice from '../../../components/admin/EditablePrice'
import Modal from '../../../components/ui/Modal'
import DeleteConfirmDialog from '../../../components/ui/DeleteConfirmDialog'
import ImageUploader from '../../../components/admin/ImageUploader'
import { Info, Plus, Trash2 } from 'lucide-react'
import { pushToast } from '../../../components/ui/Toast'
import { supabase } from '../../../lib/supabase/client'
import { mapMenuItem } from '../../../lib/mappers'
import type { MenuItem } from '../../../data/mock'

const OUTLETS: MenuItem['outlet'][] = ['Blue Pair Restaurant', 'Outdoor Bar & Eatery', 'Annex Restaurant', 'Annex Grilling']
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80'

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<MenuItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null)
  const [draft, setDraft] = useState({ outlet: OUTLETS[0], category: '', name: '', price: '', image: DEFAULT_IMAGE })
  const [editDraft, setEditDraft] = useState({ name: '', category: '', price: '', image: '' })

  const loadItems = useCallback(async () => {
    const { data } = await supabase.from('menu_items').select('*').order('name')
    if (data) setMenuItems(data.map(mapMenuItem))
  }, [])

  useEffect(() => {
    void loadItems()

    const refresh = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.table || detail.table === 'menu_items') {
        void loadItems()
      }
    }

    window.addEventListener('bluepair:database-change', refresh)
    return () => window.removeEventListener('bluepair:database-change', refresh)
  }, [loadItems])

  const outlets = Array.from(new Set([...menuItems.map(m => m.outlet), ...OUTLETS]))

  async function submit() {
    if (!draft.name) return
    const item: MenuItem = {
      id: `m_${Date.now()}`,
      outlet: draft.outlet,
      category: draft.category || 'General',
      name: draft.name,
      price: Number(draft.price) || 0,
      image: draft.image || DEFAULT_IMAGE,
      available: true,
    }
    const { error } = await supabase.from('menu_items').insert({
      id: item.id,
      outlet: item.outlet,
      category: item.category,
      name: item.name,
      price: item.price,
      image: item.image,
      available: item.available,
    })
    if (error) {
      pushToast('Failed to add menu item: ' + error.message, 'error')
      return
    }
    await loadItems()
    setShowAdd(false)
    setDraft({ outlet: OUTLETS[0], category: '', name: '', price: '', image: DEFAULT_IMAGE })
    pushToast('Menu item added successfully', 'success')
  }

  function openEdit(m: MenuItem) {
    setEditing(m)
    setEditDraft({ name: m.name, category: m.category, price: String(m.price), image: m.image })
  }

  async function saveEdit() {
    if (!editing) return
    const patch = {
      name: editDraft.name,
      category: editDraft.category,
      price: Number(editDraft.price),
      image: editDraft.image,
    }
    const { error } = await supabase.from('menu_items').update(patch).eq('id', editing.id)
    if (error) {
      pushToast('Failed to update item: ' + error.message, 'error')
      return
    }
    await loadItems()
    setEditing(null)
    pushToast('Menu item updated', 'success')
  }

  async function updatePrice(id: string, price: number) {
    const { error } = await supabase.from('menu_items').update({ price }).eq('id', id)
    if (error) {
      pushToast('Failed to update price', 'error')
      return
    }
    setMenuItems(prev => prev.map(m => (m.id === id ? { ...m, price } : m)))
    pushToast('Price updated', 'success')
  }

  async function toggleAvailable(id: string) {
    const current = menuItems.find(m => m.id === id)
    if (!current) return
    const next = !current.available
    const { error } = await supabase.from('menu_items').update({ available: next }).eq('id', id)
    if (error) {
      pushToast('Failed to update availability', 'error')
      return
    }
    setMenuItems(prev => prev.map(m => (m.id === id ? { ...m, available: next } : m)))
    pushToast(`Item marked as ${next ? 'available' : 'sold out'}`, 'info')
  }

  async function deleteItem(id: string) {
    const { error } = await supabase.from('menu_items').delete().eq('id', id)
    if (error) {
      pushToast('Failed to delete item', 'error')
      return
    }
    await loadItems()
    setDeleteTarget(null)
    pushToast('Item removed', 'success')
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Menu Management</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary btn-sm flex items-center gap-1.5">
          <Plus size={14} />Add item
        </button>
      </div>
      <div className="flex items-center gap-2 text-sm text-navy-500 bg-cream-100 rounded-xl px-4 py-3 mb-6">
        <Info size={15} className="text-gold-600 shrink-0" />
        Price and availability changes here update the public menu instantly across all outlets.
      </div>
      {outlets.filter(o => menuItems.some(m => m.outlet === o)).map(o => (
        <div key={o} className="mb-8">
          <h4 className="font-semibold mb-3">{o}</h4>
          <div className="card divide-y divide-black/5">
            {menuItems.filter(m => m.outlet === o).map(m => (
              <div key={m.id} className="flex items-center justify-between px-5 py-3.5 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={m.image} className="w-10 h-10 rounded-lg object-cover shrink-0" alt={m.name} />
                  <div className="min-w-0">
                    <b className="text-sm block truncate">{m.name}</b>
                    <span className="text-xs text-navy-400">{m.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button onClick={() => void toggleAvailable(m.id)} className={m.available ? 'pill-green' : 'pill-red'}>
                    {m.available ? 'Available' : 'Sold out'}
                  </button>
                  <EditablePrice value={m.price} onSave={v => void updatePrice(m.id, v)} />
                  <button onClick={() => openEdit(m)} className="text-xs font-semibold text-navy-900">Edit</button>
                  <button onClick={() => setDeleteTarget(m)} className="text-red-600" aria-label={`Delete ${m.name}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add menu item">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="field-label">Outlet</label>
            <select className="field-input" value={draft.outlet} onChange={e => setDraft({ ...draft, outlet: e.target.value as MenuItem['outlet'] })}>
              {OUTLETS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Name</label>
            <input className="field-input" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Category</label>
            <input className="field-input" value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })} placeholder="Mains, Drinks, Grills…" />
          </div>
          <div className="col-span-2">
            <label className="field-label">Price (₦)</label>
            <input type="number" className="field-input" value={draft.price} onChange={e => setDraft({ ...draft, price: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="field-label">Photo</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-cream-100">
                <img src={draft.image} className="w-full h-full object-cover" alt="" />
              </div>
              <ImageUploader folder="menu/new" label="Upload from device" onUploaded={urls => setDraft({ ...draft, image: urls[0] })} />
            </div>
          </div>
        </div>
        <button onClick={() => void submit()} className="btn-primary w-full justify-center mt-6">Add item</button>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit menu item">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Name</label>
            <input className="field-input" value={editDraft.name} onChange={e => setEditDraft({ ...editDraft, name: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Category</label>
            <input className="field-input" value={editDraft.category} onChange={e => setEditDraft({ ...editDraft, category: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="field-label">Price (₦)</label>
            <input type="number" className="field-input" value={editDraft.price} onChange={e => setEditDraft({ ...editDraft, price: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="field-label">Photo</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-cream-100">
                <img src={editDraft.image} className="w-full h-full object-cover" alt="" />
              </div>
              <ImageUploader folder={`menu/${editing?.id}`} label="Upload from device" onUploaded={urls => setEditDraft({ ...editDraft, image: urls[0] })} />
            </div>
          </div>
        </div>
        <button onClick={() => void saveEdit()} className="btn-primary w-full justify-center mt-6">Save changes</button>
      </Modal>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        itemName={deleteTarget?.name}
        description="This menu item will be permanently removed from the selected outlet."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) void deleteItem(deleteTarget.id) }}
      />
    </div>
  )
}
