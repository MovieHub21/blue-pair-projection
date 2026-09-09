'use client'
import { useState } from 'react'
import { useStore } from '../../../store/useStore'
import { naira } from '../../../lib/format'
import EditablePrice from '../../../components/admin/EditablePrice'
import Modal from '../../../components/ui/Modal'
import { Plus } from 'lucide-react'
import type { MenuItem } from '../../../data/mock'

const OUTLETS = ['Blue Pair Restaurant', 'Outdoor Bar & Eatery'] as const

export default function RestaurantManagement() {
  const { menuItems, updateMenuItemPrice, toggleMenuItemAvailable, addMenuItem } = useStore()
  const [outlet, setOutlet] = useState<typeof OUTLETS[number]>('Blue Pair Restaurant')
  const [showAdd, setShowAdd] = useState(false)
  const [draft, setDraft] = useState({ name: '', category: 'Mains', price: '' })
  const items = menuItems.filter(m => m.outlet === outlet)

  function submit() {
    const item: MenuItem = { id: `m_${Date.now()}`, outlet, category: draft.category, name: draft.name || 'New item', price: Number(draft.price) || 5000, image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=500&q=80', available: true }
    addMenuItem(item); setShowAdd(false); setDraft({ name:'', category:'Mains', price:'' })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Restaurant Management</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary btn-sm flex items-center gap-1.5"><Plus size={14}/>Add item</button>
      </div>
      <div className="flex gap-2.5 mb-6">
        {OUTLETS.map(o => <button key={o} onClick={() => setOutlet(o)} className={'px-4 py-2.5 rounded-full text-sm font-semibold border ' + (outlet===o ? 'bg-navy-950 text-white border-navy-950' : 'border-black/15')}>{o}</button>)}
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead><tr className="text-left text-xs text-navy-400 border-b border-black/5"><th className="p-4">Item</th><th className="p-4">Category</th><th className="p-4">Price</th><th className="p-4">Availability</th><th className="p-4"></th></tr></thead>
          <tbody>
            {items.map(m => (
              <tr key={m.id} className="border-b border-black/5 last:border-none">
                <td className="p-4"><div className="flex items-center gap-3"><img src={m.image} className="w-11 h-11 rounded-lg object-cover" /><b>{m.name}</b></div></td>
                <td className="p-4 text-navy-500">{m.category}</td>
                <td className="p-4"><EditablePrice value={m.price} onSave={v => updateMenuItemPrice(m.id, v)} /></td>
                <td className="p-4"><button onClick={() => toggleMenuItemAvailable(m.id)} className={m.available ? 'pill-green' : 'pill-red'}>{m.available ? 'Available' : 'Sold out'}</button></td>
                <td className="p-4"><button className="text-xs font-semibold text-red-600">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={`Add item — ${outlet}`}>
        <div className="grid gap-4">
          <div><label className="field-label">Item name</label><input className="field-input" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="field-label">Category</label><input className="field-input" value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})} /></div>
            <div><label className="field-label">Price (₦)</label><input type="number" className="field-input" value={draft.price} onChange={e=>setDraft({...draft,price:e.target.value})} /></div>
          </div>
        </div>
        <button onClick={submit} className="btn-primary w-full justify-center mt-6">Add item</button>
      </Modal>
    </div>
  )
}
