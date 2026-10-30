'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ClipboardList, RefreshCw, Sparkles, Wrench } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import { pushToast } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase/client'

type Department = 'housekeeping' | 'maintenance'
type WorkItem = {
  id: string
  department: Department
  room: string
  title: string
  status: string
  priority: string
  assignedTo: string
  notes: string
}
type StaffOption = { id: string; name: string }
type Filter = 'all' | Department

export default function RoomOperationsPage() {
  const [items, setItems] = useState<WorkItem[]>([])
  const [cleaners, setCleaners] = useState<StaffOption[]>([])
  const [technicians, setTechnicians] = useState<StaffOption[]>([])
  const [canAssign, setCanAssign] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async (manual = false) => {
    manual ? setRefreshing(true) : setLoading(true)
    setError('')
    const [hkResult, mtResult, hkStaffResponse, mtStaffResponse] = await Promise.all([
      supabase.from('housekeeping_tasks').select('*').neq('status', 'completed').order('room'),
      supabase.from('maintenance_tickets').select('*').not('status', 'in', '(resolved,closed,completed)').order('date_reported', { ascending: false }),
      fetch('/api/admin/room-tasks?department=housekeeping', { cache: 'no-store' }),
      fetch('/api/admin/room-tasks?department=maintenance', { cache: 'no-store' }),
    ])
    if (hkResult.error || mtResult.error) setError(hkResult.error?.message || mtResult.error?.message || 'Could not load room tasks.')
    const [hkStaffPayload, mtStaffPayload] = await Promise.all([
      hkStaffResponse.json().catch(() => ({})), mtStaffResponse.json().catch(() => ({})),
    ])
    if (!hkStaffResponse.ok || !mtStaffResponse.ok) setError(hkStaffPayload.error || mtStaffPayload.error || 'Could not load assignment options.')
    setCanAssign(!!hkStaffPayload.canAssign || !!mtStaffPayload.canAssign)
    setCleaners(hkStaffPayload.staff ?? [])
    setTechnicians(mtStaffPayload.staff ?? [])
    const cleaning: WorkItem[] = (hkResult.data ?? []).map((task: any) => ({
      id: String(task.id), department: 'housekeeping', room: String(task.room),
      title: task.room_type || `Room ${task.room}`, status: String(task.status),
      priority: String(task.priority || 'Medium'), assignedTo: String(task.assigned_to || 'Unassigned'), notes: String(task.notes || ''),
    }))
    const maintenance: WorkItem[] = (mtResult.data ?? []).map((ticket: any) => ({
      id: String(ticket.id), department: 'maintenance', room: String(ticket.room),
      title: String(ticket.issue || 'Maintenance task'), status: String(ticket.status),
      priority: String(ticket.priority || 'Medium'), assignedTo: String(ticket.assigned_to || 'Unassigned'), notes: String(ticket.notes || ''),
    }))
    setItems([...cleaning, ...maintenance])
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    void load()
    const refresh = (event: Event) => {
      const table = (event as CustomEvent).detail?.table
      if (!table || ['rooms', 'room_daily_statuses', 'housekeeping_tasks', 'maintenance_tickets'].includes(table)) void load(true)
    }
    window.addEventListener('bluepair:database-change', refresh)
    return () => window.removeEventListener('bluepair:database-change', refresh)
  }, [load])

  async function assign(item: WorkItem, staffId: string) {
    if (!staffId) return
    setBusyId(`${item.department}:${item.id}`)
    try {
      const response = await fetch('/api/admin/room-tasks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department: item.department, action: 'assign', id: item.id, staffId }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Could not assign this task.')
      pushToast(`${item.department === 'housekeeping' ? 'Cleaner' : 'Technician'} assigned to Room ${item.room}.`, 'success')
      await load(true)
    } catch (cause: any) {
      pushToast(cause?.message || 'Could not assign this task.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const visibleItems = useMemo(() => items.filter(item => filter === 'all' || item.department === filter), [items, filter])
  const unassignedCount = items.filter(item => !item.assignedTo || item.assignedTo === 'Unassigned').length

  return <div className="max-w-6xl">
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
      <div><h1 className="text-2xl font-semibold">Room Operations</h1><p className="text-sm text-navy-400 mt-1">Assign cleaners and technicians from one place. Staff can accept and complete work in their task pages.</p></div>
      <button onClick={() => void load(true)} disabled={refreshing} className="btn-outline btn-sm self-start sm:self-auto"><RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />Refresh</button>
    </div>

    <div className="grid sm:grid-cols-3 gap-3 mb-6">
      <div className="card p-4"><div className="text-xs text-navy-400">Active tasks</div><b className="text-2xl">{items.length}</b></div>
      <div className="card p-4"><div className="text-xs text-navy-400">Waiting for assignment</div><b className="text-2xl">{unassignedCount}</b></div>
      <div className="card p-4"><div className="text-xs text-navy-400">In progress</div><b className="text-2xl">{items.filter(item => item.status === 'in_progress').length}</b></div>
    </div>

    <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label="Room task type">
      {([['all', 'All tasks'], ['housekeeping', 'Cleaning'], ['maintenance', 'Maintenance']] as [Filter, string][]).map(([key, label]) => <button key={key} role="tab" aria-selected={filter === key} onClick={() => setFilter(key)} className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === key ? 'bg-navy-950 text-white' : 'bg-white border border-black/10 text-navy-600'}`}>{label}{key === 'all' ? ` (${items.length})` : ` (${items.filter(item => item.department === key).length})`}</button>)}
    </div>

    {error && <div role="alert" className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">{error}</div>}
    {loading ? <div className="card p-10 text-center text-sm text-navy-400">Loading room tasks…</div> : <div className="grid gap-3">
      {visibleItems.map(item => {
        const isHousekeeping = item.department === 'housekeeping'
        const roster = isHousekeeping ? cleaners : technicians
        const key = `${item.department}:${item.id}`
        return <article key={key} className="card p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isHousekeeping ? 'bg-cream-100 text-gold-700' : 'bg-amber-50 text-amber-700'}`}>{isHousekeeping ? <Sparkles size={20} /> : <Wrench size={20} />}</div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2"><b className="text-sm">Room {item.room}</b><span className="text-xs text-navy-400">{isHousekeeping ? 'Cleaning' : 'Maintenance'}</span></div>
            <div className="text-sm text-navy-700 mt-1 truncate">{item.title}</div>
            <div className="text-xs text-navy-400 mt-1">{item.assignedTo === 'Unassigned' ? 'Waiting for assignment' : `Assigned to ${item.assignedTo}`}{item.notes ? ` · ${item.notes}` : ''}</div>
          </div>
          <div className="flex items-center gap-2"><StatusBadge status={item.status} /><StatusBadge status={item.priority} /></div>
          {canAssign && <select aria-label={`Assign ${isHousekeeping ? 'cleaner' : 'technician'} to room ${item.room}`} disabled={busyId === key || roster.length === 0} value="" onChange={event => { if (event.target.value) void assign(item, event.target.value) }} className="field-input !w-full lg:!w-52 !py-2.5 text-sm"><option value="">{item.assignedTo === 'Unassigned' ? `Assign ${isHousekeeping ? 'cleaner' : 'technician'}…` : `Reassign ${isHousekeeping ? 'cleaner' : 'technician'}…`}</option>{roster.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select>}
        </article>
      })}
      {!visibleItems.length && <div className="card p-10 text-center"><ClipboardList size={24} className="mx-auto text-navy-300 mb-3"/><p className="text-sm text-navy-500">No active {filter === 'all' ? 'room tasks' : filter === 'housekeeping' ? 'cleaning tasks' : 'maintenance tasks'}.</p></div>}
    </div>}
  </div>
}
