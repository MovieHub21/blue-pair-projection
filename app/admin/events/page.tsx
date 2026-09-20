'use client'

import { useCallback, useEffect, useState } from 'react'
import { naira, formatDate } from '../../../lib/format'
import Modal from '../../../components/ui/Modal'
import DeleteConfirmDialog from '../../../components/ui/DeleteConfirmDialog'
import ImageUploader from '../../../components/admin/ImageUploader'
import { Plus } from 'lucide-react'
import { pushToast } from '../../../components/ui/Toast'
import { supabase } from '../../../lib/supabase/client'
import { mapEvent } from '../../../lib/mappers'
import type { EventItem } from '../../../data/mock'
import EventReservations from './EventReservations'

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1519167758481-83f29c8e8de8?auto=format&fit=crop&w=900&q=80'

export default function EventsManagement() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<EventItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EventItem | null>(null)
  const [draft, setDraft] = useState({ title: '', date: '2026-09-01', price: '20000', capacity: '100', image: DEFAULT_IMAGE, description: '' })
  const [editDraft, setEditDraft] = useState({ title: '', date: '', price: '', capacity: '', image: '', description: '' })

  const loadEvents = useCallback(async () => {
    const { data } = await supabase.from('events').select('*').order('date')
    if (data) setEvents(data.map(mapEvent))
  }, [])

  useEffect(() => {
    void loadEvents()

    const refresh = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.table || detail.table === 'events') {
        void loadEvents()
      }
    }

    window.addEventListener('bluepair:database-change', refresh)
    return () => window.removeEventListener('bluepair:database-change', refresh)
  }, [loadEvents])

  async function submit() {
    const eItem: EventItem = {
      id: `e_${Date.now()}`,
      title: draft.title || 'New Event',
      date: draft.date,
      price: Number(draft.price) || 0,
      capacity: Number(draft.capacity) || 0,
      image: draft.image || DEFAULT_IMAGE,
      description: draft.description || 'Event details to be finalised.',
      published: false,
    }
    const { error } = await supabase.from('events').insert({
      id: eItem.id,
      title: eItem.title,
      date: eItem.date,
      price: eItem.price,
      capacity: eItem.capacity,
      image: eItem.image,
      description: eItem.description,
      published: eItem.published,
    })
    if (error) {
      pushToast('Failed to create event: ' + error.message, 'error')
      return
    }
    await loadEvents()
    setShowAdd(false)
    setDraft({ title: '', date: '2026-09-01', price: '20000', capacity: '100', image: DEFAULT_IMAGE, description: '' })
    pushToast('Event draft created', 'success')
  }

  function openEdit(e: EventItem) {
    setEditing(e)
    setEditDraft({
      title: e.title,
      date: e.date,
      price: String(e.price),
      capacity: String(e.capacity),
      image: e.image,
      description: e.description,
    })
  }

  async function saveEdit() {
    if (!editing) return
    const patch = {
      title: editDraft.title,
      date: editDraft.date,
      price: Number(editDraft.price),
      capacity: Number(editDraft.capacity),
      image: editDraft.image,
      description: editDraft.description,
    }
    const { error } = await supabase.from('events').update(patch).eq('id', editing.id)
    if (error) {
      pushToast('Failed to update event: ' + error.message, 'error')
      return
    }
    await loadEvents()
    setEditing(null)
    pushToast('Event updated', 'success')
  }

  async function togglePublishEvent(id: string) {
    const current = events.find(e => e.id === id)
    if (!current) return
    const next = !current.published
    const { error } = await supabase.from('events').update({ published: next }).eq('id', id)
    if (error) {
      pushToast('Failed to update event: ' + error.message, 'error')
      return
    }
    setEvents(prev => prev.map(e => (e.id === id ? { ...e, published: next } : e)))
    pushToast(`Event ${next ? 'published' : 'moved to drafts'}`, 'info')
  }

  async function deleteEvent(id: string) {
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) {
      pushToast('Failed to delete event: ' + error.message, 'error')
      return
    }
    await loadEvents()
    setDeleteTarget(null)
    pushToast('Event deleted', 'success')
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Events Management</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary btn-sm flex items-center gap-1.5">
          <Plus size={14} />Create event
        </button>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        {events.map(e => (
          <div key={e.id} className="card overflow-hidden">
            <div className="h-36"><img loading="lazy" decoding="async" src={e.image} className="w-full h-full object-cover" alt={e.title} /></div>
            <div className="p-5">
              <div className="flex justify-between items-start gap-2">
                <b>{e.title}</b>
                <button onClick={() => void togglePublishEvent(e.id)} className={e.published ? 'pill-green' : 'pill-amber'}>
                  {e.published ? 'Published' : 'Draft'}
                </button>
              </div>
              <span className="text-xs text-navy-400 block mt-1.5">{formatDate(e.date)} · {e.capacity} capacity</span>
              <div className="flex justify-between items-center mt-3">
                <b className="font-display">{naira(e.price)}</b>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(e)} className="text-xs font-semibold text-navy-900">Edit</button>
                  <button onClick={() => setDeleteTarget(e)} className="text-xs font-semibold text-red-600">Delete</button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {events.length === 0 && <p className="text-sm text-navy-400">No events yet.</p>}
      </div>
      <EventReservations />

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create event">
        <div className="grid gap-4">
          <div>
            <label className="field-label">Event title</label>
            <input className="field-input" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="field-label">Date</label>
              <input type="date" className="field-input" value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} />
            </div>
            <div>
              <label className="field-label">Price (₦)</label>
              <input type="number" className="field-input" value={draft.price} onChange={e => setDraft({ ...draft, price: e.target.value })} />
            </div>
            <div>
              <label className="field-label">Capacity</label>
              <input type="number" className="field-input" value={draft.capacity} onChange={e => setDraft({ ...draft, capacity: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="field-label">Description</label>
            <textarea className="field-input !h-auto py-2.5" rows={3} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Photo</label>
            <div className="flex items-center gap-4">
              <div className="w-28 h-20 rounded-lg overflow-hidden bg-cream-100">
                <img loading="lazy" decoding="async" src={draft.image} className="w-full h-full object-cover" alt="" />
              </div>
              <ImageUploader folder="events/new" label="Upload from device" onUploaded={urls => setDraft({ ...draft, image: urls[0] })} />
            </div>
          </div>
        </div>
        <button onClick={() => void submit()} className="btn-primary w-full justify-center mt-6">Create as draft</button>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit event">
        <div className="grid gap-4">
          <div>
            <label className="field-label">Event title</label>
            <input className="field-input" value={editDraft.title} onChange={e => setEditDraft({ ...editDraft, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="field-label">Date</label>
              <input type="date" className="field-input" value={editDraft.date} onChange={e => setEditDraft({ ...editDraft, date: e.target.value })} />
            </div>
            <div>
              <label className="field-label">Price (₦)</label>
              <input type="number" className="field-input" value={editDraft.price} onChange={e => setEditDraft({ ...editDraft, price: e.target.value })} />
            </div>
            <div>
              <label className="field-label">Capacity</label>
              <input type="number" className="field-input" value={editDraft.capacity} onChange={e => setEditDraft({ ...editDraft, capacity: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="field-label">Description</label>
            <textarea className="field-input !h-auto py-2.5" rows={3} value={editDraft.description} onChange={e => setEditDraft({ ...editDraft, description: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Photo</label>
            <div className="flex items-center gap-4">
              <div className="w-28 h-20 rounded-lg overflow-hidden bg-cream-100">
                <img loading="lazy" decoding="async" src={editDraft.image} className="w-full h-full object-cover" alt="" />
              </div>
              <ImageUploader folder={`events/${editing?.id}`} label="Upload from device" onUploaded={urls => setEditDraft({ ...editDraft, image: urls[0] })} />
            </div>
          </div>
        </div>
        <button onClick={() => void saveEdit()} className="btn-primary w-full justify-center mt-6">Save changes</button>
      </Modal>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        itemName={deleteTarget?.title}
        description="This event and its management record will be permanently removed."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) void deleteEvent(deleteTarget.id) }}
      />
    </div>
  )
}
