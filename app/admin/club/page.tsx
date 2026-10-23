'use client'

import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../../../lib/supabase/client'
import { formatDate, naira } from '../../../lib/format'
import { pushToast } from '../../../components/ui/Toast'
import Modal from '../../../components/ui/Modal'
import DeleteConfirmDialog from '../../../components/ui/DeleteConfirmDialog'

type ClubEvent = { id: string; title: string; date: string; price: number; description: string; published: boolean }
type ClubEventDraft = { title: string; date: string; price: string; description: string }
const emptyDraft = (): ClubEventDraft => ({ title: '', date: new Date().toISOString().slice(0, 10), price: '0', description: '' })

export default function ClubManagementPage() {
  const [items, setItems] = useState<ClubEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [editing, setEditing] = useState<ClubEvent | null>(null)
  const [deleting, setDeleting] = useState<ClubEvent | null>(null)
  const [draft, setDraft] = useState<ClubEventDraft>(emptyDraft)

  const loadItems = useCallback(async () => {
    const { data, error } = await supabase.from('club_events').select('*').order('date')
    if (error) pushToast(`Unable to load club schedule: ${error.message}`, 'error')
    else setItems((data ?? []) as ClubEvent[])
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadItems()
    const refresh = (event: Event) => {
      const detail = (event as CustomEvent).detail
      if (!detail?.table || detail.table === 'club_events') void loadItems()
    }
    window.addEventListener('bluepair:database-change', refresh)
    return () => window.removeEventListener('bluepair:database-change', refresh)
  }, [loadItems])

  function openCreate() {
    setEditing(null)
    setDraft(emptyDraft())
    setShowEditor(true)
  }

  function openEdit(item: ClubEvent) {
    setEditing(item)
    setDraft({ title: item.title, date: item.date, price: String(item.price), description: item.description || '' })
    setShowEditor(true)
  }

  async function save() {
    if (!draft.title.trim() || !draft.date) {
      pushToast('Add a title and date for this club event.', 'error')
      return
    }
    setSaving(true)
    const values = { title: draft.title.trim(), date: draft.date, price: Math.max(0, Number(draft.price) || 0), description: draft.description.trim() }
    const result = editing
      ? await supabase.from('club_events').update(values).eq('id', editing.id)
      : await supabase.from('club_events').insert(values)
    setSaving(false)
    if (result.error) {
      pushToast(`Unable to save club event: ${result.error.message}`, 'error')
      return
    }
    await loadItems()
    setShowEditor(false)
    pushToast(editing ? 'Club event updated.' : 'Club event added as a draft.', 'success')
  }

  async function togglePublished(item: ClubEvent) {
    const { error } = await supabase.from('club_events').update({ published: !item.published }).eq('id', item.id)
    if (error) pushToast(`Unable to update status: ${error.message}`, 'error')
    else await loadItems()
  }

  async function deleteItem() {
    if (!deleting) return
    const { error } = await supabase.from('club_events').delete().eq('id', deleting.id)
    if (error) {
      pushToast(`Unable to delete club event: ${error.message}`, 'error')
      throw error
    }
    setItems(current => current.filter(item => item.id !== deleting.id))
    pushToast('Club event deleted.', 'success')
  }

  return <div>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div><span className="eyebrow">Outlet content</span><h1 className="mt-1 text-2xl font-semibold">Club schedule</h1><p className="mt-1 text-sm text-navy-400">Manage the “Upcoming at the Club” list separately from hotel events.</p></div>
      <button onClick={openCreate} className="btn-primary btn-sm"><Plus size={15} />Add club item</button>
    </div>

    {loading ? <div className="card p-6 text-sm text-navy-400">Loading club schedule…</div> : items.length === 0 ? <div className="card p-8 text-center text-sm text-navy-400">No club items yet. Add one to show it on the public Club page.</div> : <div className="grid gap-3">{items.map(item => <article key={item.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{item.title}</h2><button onClick={() => void togglePublished(item)} className={item.published ? 'pill-green' : 'pill-amber'}>{item.published ? 'Published' : 'Draft'}</button></div><p className="mt-1 text-xs text-navy-400">{formatDate(item.date)} · {naira(item.price)}</p>{item.description && <p className="mt-2 line-clamp-2 text-sm text-navy-600">{item.description}</p>}</div>
      <div className="flex shrink-0 gap-2"><button onClick={() => openEdit(item)} className="btn-outline btn-sm"><Pencil size={13} />Edit</button><button onClick={() => setDeleting(item)} className="btn-outline btn-sm text-red-600"><Trash2 size={13} />Delete</button></div>
    </article>)}</div>}

    <Modal open={showEditor} onClose={() => setShowEditor(false)} title={editing ? 'Edit club item' : 'Add club item'}>
      <div className="grid gap-4">
        <div><label className="field-label">Title</label><input className="field-input" value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder="e.g. Saturday Night Live" /></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label className="field-label">Date</label><input type="date" className="field-input" value={draft.date} onChange={event => setDraft({ ...draft, date: event.target.value })} /></div><div><label className="field-label">Price (₦)</label><input type="number" min="0" className="field-input" value={draft.price} onChange={event => setDraft({ ...draft, price: event.target.value })} /></div></div>
        <div><label className="field-label">Description (optional)</label><textarea rows={3} className="field-input !h-auto py-2.5" value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} /></div>
      </div>
      <div className="mt-6 flex justify-end gap-2"><button onClick={() => setShowEditor(false)} className="btn-outline">Cancel</button><button disabled={saving} onClick={() => void save()} className="btn-primary min-w-28 justify-center">{saving ? 'Saving…' : editing ? 'Save changes' : 'Create draft'}</button></div>
    </Modal>
    <DeleteConfirmDialog open={!!deleting} title="Delete club item?" itemName={deleting?.title} onCancel={() => setDeleting(null)} onConfirm={deleteItem} />
  </div>
}
