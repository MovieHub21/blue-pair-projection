'use client'
import { useState } from 'react'
import { useStore } from '../../../store/useStore'
import { naira, formatDate } from '../../../lib/format'
import Modal from '../../../components/ui/Modal'
import { Plus } from 'lucide-react'
import type { EventItem } from '../../../data/mock'

export default function EventsManagement() {
  const { events, togglePublishEvent, addEvent } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [draft, setDraft] = useState({ title: '', date: '2026-09-01', price: '20000', capacity: '100' })

  function submit() {
    const e: EventItem = { id: `e_${Date.now()}`, title: draft.title || 'New Event', date: draft.date, price: Number(draft.price), capacity: Number(draft.capacity), image: 'https://images.unsplash.com/photo-1519167758481-83f29c8e8de8?auto=format&fit=crop&w=900&q=80', description: 'Event details to be finalised.', published: false }
    addEvent(e); setShowAdd(false)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Events Management</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary btn-sm flex items-center gap-1.5"><Plus size={14}/>Create event</button>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        {events.map(e => (
          <div key={e.id} className="card overflow-hidden">
            <div className="h-36"><img src={e.image} className="w-full h-full object-cover" /></div>
            <div className="p-5">
              <div className="flex justify-between items-start gap-2">
                <b>{e.title}</b>
                <button onClick={() => togglePublishEvent(e.id)} className={e.published ? 'pill-green' : 'pill-amber'}>{e.published ? 'Published' : 'Draft'}</button>
              </div>
              <span className="text-xs text-navy-400 block mt-1.5">{formatDate(e.date)} · {e.capacity} capacity</span>
              <div className="flex justify-between items-center mt-3">
                <b className="font-display">{naira(e.price)}</b>
                <div className="flex gap-2"><button className="text-xs font-semibold text-navy-900">Edit</button><button className="text-xs font-semibold text-red-600">Delete</button></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create event">
        <div className="grid gap-4">
          <div><label className="field-label">Event title</label><input className="field-input" value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="field-label">Date</label><input type="date" className="field-input" value={draft.date} onChange={e=>setDraft({...draft,date:e.target.value})} /></div>
            <div><label className="field-label">Price (₦)</label><input type="number" className="field-input" value={draft.price} onChange={e=>setDraft({...draft,price:e.target.value})} /></div>
            <div><label className="field-label">Capacity</label><input type="number" className="field-input" value={draft.capacity} onChange={e=>setDraft({...draft,capacity:e.target.value})} /></div>
          </div>
        </div>
        <button onClick={submit} className="btn-primary w-full justify-center mt-6">Create as draft</button>
      </Modal>
    </div>
  )
}
