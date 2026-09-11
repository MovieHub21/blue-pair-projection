'use client'
import { useState } from 'react'
import { useStore } from '../../../store/useStore'
import EditablePrice from '../../../components/admin/EditablePrice'
import Modal from '../../../components/ui/Modal'
import { Plus, Trash2 } from 'lucide-react'
import type { Drink } from '../../../data/mock'

const BARS = ['Main Bar', 'VIP Bar', 'Outdoor Bar', 'Annex Bar'] as const

export default function BarManagement() {
  const { drinks, updateDrinkPrice, toggleDrinkAvailable, addDrink, deleteDrink } = useStore()
  const [bar, setBar] = useState<typeof BARS[number]>('Main Bar')
  const [showAdd, setShowAdd] = useState(false)
  const [draft, setDraft] = useState({ name: '', category: 'Beer', price: '' })
  const items = drinks.filter(d => d.bar === bar)

  function submit() {
    const d: Drink = { id: `d_${Date.now()}`, bar, category: draft.category, name: draft.name || 'New drink', price: Number(draft.price) || 3000, available: true }
    addDrink(d); setShowAdd(false); setDraft({ name:'', category:'Beer', price:'' })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Bar Management</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary btn-sm flex items-center gap-1.5"><Plus size={14}/>Add drink</button>
      </div>
      <div className="flex gap-2.5 mb-6 flex-wrap">
        {BARS.map(b => <button key={b} onClick={() => setBar(b)} className={'px-4 py-2.5 rounded-full text-sm font-semibold border ' + (bar===b ? 'bg-navy-950 text-white border-navy-950' : 'border-black/15')}>{b}</button>)}
      </div>
      <div className="card divide-y divide-black/5">
        {items.map(d => (
          <div key={d.id} className="flex items-center justify-between px-5 py-3.5">
            <div><b className="text-sm block">{d.name}</b><span className="text-xs text-navy-400">{d.category}</span></div>
            <div className="flex items-center gap-4">
              <button onClick={() => toggleDrinkAvailable(d.id)} className={d.available ? 'pill-green' : 'pill-red'}>{d.available ? 'Available' : 'Sold out'}</button>
              <EditablePrice value={d.price} onSave={v => updateDrinkPrice(d.id, v)} />
              <button onClick={() => { if (confirm('Remove this drink?')) deleteDrink(d.id) }} className="text-red-600"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="p-8 text-center text-sm text-navy-400">No drinks listed for {bar} yet.</div>}
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={`Add drink — ${bar}`}>
        <div className="grid gap-4">
          <div><label className="field-label">Drink name</label><input className="field-input" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="field-label">Category</label><input className="field-input" value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})} /></div>
            <div><label className="field-label">Price (₦)</label><input type="number" className="field-input" value={draft.price} onChange={e=>setDraft({...draft,price:e.target.value})} /></div>
          </div>
        </div>
        <button onClick={submit} className="btn-primary w-full justify-center mt-6">Add drink</button>
      </Modal>
    </div>
  )
}
