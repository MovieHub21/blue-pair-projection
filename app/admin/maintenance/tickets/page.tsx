'use client'

import { useCallback, useEffect, useState } from 'react'
import StatusBadge from '@/components/ui/StatusBadge'
import Modal from '@/components/ui/Modal'
import { formatDate } from '@/lib/format'
import { pushToast } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase/client'
import { mapMaintenanceTicket } from '@/lib/mappers'
import type { MaintenanceTicket } from '@/data/mock'

export default function Tickets() {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([])
  const [active, setActive] = useState<MaintenanceTicket | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const loadTickets = useCallback(async () => {
    const { data, error } = await supabase.from('maintenance_tickets').select('*').order('date_reported', { ascending: false })
    if (error) { pushToast('Could not load maintenance tasks.', 'error'); return }
    setTickets((data ?? []).map(mapMaintenanceTicket))
  }, [])

  useEffect(() => {
    void loadTickets()
    const refresh = (e: Event) => {
      const table = (e as CustomEvent).detail?.table
      if (!table || table === 'maintenance_tickets' || table === 'rooms') void loadTickets()
    }
    window.addEventListener('bluepair:database-change', refresh)
    return () => window.removeEventListener('bluepair:database-change', refresh)
  }, [loadTickets])

  async function updateTicket(ticket: MaintenanceTicket, action: 'claim' | 'resolve') {
    setSavingId(ticket.id)
    try {
      const response = await fetch('/api/admin/room-tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ department: 'maintenance', action, id: ticket.id }) })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Could not update maintenance task.')
      await loadTickets(); setActive(null)
      pushToast(action === 'claim' ? `You accepted room ${ticket.room}.` : `Room ${ticket.room} maintenance completed.`, 'success')
    } catch (error: any) { pushToast(error?.message || 'Could not update maintenance task.', 'error') }
    finally { setSavingId(null) }
  }

  async function updateNotes(id: string, notes: string) {
    const { error } = await supabase.from('maintenance_tickets').update({ notes }).eq('id', id)
    if (error) { pushToast('Could not save maintenance notes.', 'error'); return }
    setTickets(current => current.map(ticket => ticket.id === id ? { ...ticket, notes } : ticket))
    if (active?.id === id) setActive({ ...active, notes })
  }

  const activeTickets = tickets.filter(ticket => ticket.status !== 'resolved')
  const resolvedTickets = tickets.filter(ticket => ticket.status === 'resolved')
  function renderTicket(ticket: MaintenanceTicket) {
    const busy = savingId === ticket.id
    return <div key={ticket.id} className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
      <div className="w-12 h-12 rounded-lg bg-navy-900 text-white flex items-center justify-center font-display font-semibold shrink-0">{ticket.room}</div>
      <button onClick={() => setActive(ticket)} className="flex-1 min-w-0 text-left"><b className="text-sm">{ticket.issue}</b><div className="text-xs text-navy-400 mt-1">Reported {formatDate(ticket.dateReported)} · {ticket.assignedTo && ticket.assignedTo !== 'Unassigned' ? `Assigned to ${ticket.assignedTo}` : 'Unassigned'}</div></button>
      <StatusBadge status={ticket.priority} /><StatusBadge status={ticket.status} />
      {ticket.status === 'open' && <button disabled={busy} onClick={() => void updateTicket(ticket, 'claim')} className="btn-primary btn-sm justify-center disabled:opacity-50">{busy ? 'Accepting…' : 'Accept task'}</button>}
      {ticket.status === 'in_progress' && <button disabled={busy} onClick={() => void updateTicket(ticket, 'resolve')} className="btn-gold btn-sm justify-center disabled:opacity-50">{busy ? 'Updating…' : 'Mark done'}</button>}
    </div>
  }

  return <div>
    <h1 className="text-2xl font-semibold mb-1">Maintenance Tasks</h1>
    <p className="text-navy-400 text-sm mb-6">Accept an open maintenance task. Assignments are managed from Room Management.</p>
    <h2 className="font-semibold mb-3">Open tasks ({activeTickets.length})</h2>
    <div className="grid gap-3 mb-8">{activeTickets.map(renderTicket)}{activeTickets.length === 0 && <div className="card p-5 text-sm text-navy-400">No rooms currently need maintenance.</div>}</div>
    {resolvedTickets.length > 0 && <><h2 className="font-semibold mb-3">Completed ({resolvedTickets.length})</h2><div className="grid gap-3">{resolvedTickets.slice(0, 20).map(renderTicket)}</div></>}
    <Modal open={!!active} onClose={() => !saving && setActive(null)} title={active?.issue ?? ''} subtitle={active ? `Room ${active.room}` : ''}>
      {active && <div><div className="flex flex-col gap-0.5 mb-5">{[['Priority', active.priority], ['Assigned staff', active.assignedTo], ['Date reported', formatDate(active.dateReported)], ['Status', active.status]].map(([label, value]) => <div key={label} className="flex justify-between text-sm py-2.5 border-b border-dashed border-black/10 last:border-none"><span className="text-navy-400">{label}</span><span className="font-medium">{value}</span></div>)}</div><label className="field-label">Notes</label><textarea value={active.notes} onChange={event => setActive({ ...active, notes: event.target.value })} rows={3} className="field-input !h-auto py-2.5 mb-5" /><button onClick={() => void updateNotes(active.id, active.notes)} className="btn-outline w-full justify-center mb-3">Save notes</button>{active.status === 'in_progress' && <button disabled={saving} onClick={() => { setSaving(true); void updateTicket(active, 'resolve').finally(() => setSaving(false)) }} className="btn-gold w-full justify-center disabled:opacity-50">Mark maintenance complete</button>}</div>}
    </Modal>
  </div>
}
