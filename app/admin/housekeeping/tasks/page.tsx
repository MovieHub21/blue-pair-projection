'use client'

import { useCallback, useEffect, useState } from 'react'
import StatusBadge from '@/components/ui/StatusBadge'
import Modal from '@/components/ui/Modal'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { pushToast } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase/client'
import { mapHousekeepingTask } from '@/lib/mappers'
import type { HousekeepingTask } from '@/data/mock'

const CHECKLIST = ['Strip & remake bed', 'Change towels', 'Clean bathroom', 'Vacuum / mop floor', 'Restock amenities', 'Final inspection']

export default function Tasks() {
  const [tasks, setTasks] = useState<HousekeepingTask[]>([])
  const [active, setActive] = useState<HousekeepingTask | null>(null)
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [doneRoom, setDoneRoom] = useState<string | null>(null)

  const loadTasks = useCallback(async () => {
    const { data, error } = await supabase.from('housekeeping_tasks').select('*').order('room')
    if (error) { pushToast('Could not load housekeeping tasks.', 'error'); return }
    setTasks((data ?? []).map(mapHousekeepingTask))
  }, [])

  useEffect(() => {
    void loadTasks()
    const refresh = (e: Event) => {
      const table = (e as CustomEvent).detail?.table
      if (!table || table === 'housekeeping_tasks' || table === 'rooms' || table === 'room_daily_statuses') void loadTasks()
    }
    window.addEventListener('bluepair:database-change', refresh)
    return () => window.removeEventListener('bluepair:database-change', refresh)
  }, [loadTasks])

  async function updateTask(task: HousekeepingTask, action: 'claim' | 'complete') {
    setSavingId(task.id)
    try {
      const response = await fetch('/api/admin/room-tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ department: 'housekeeping', action, id: task.id }) })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Could not update housekeeping task.')
      await loadTasks()
      if (action === 'complete') { setDoneRoom(task.room); setActive(task); setChecked({}); pushToast(`Room ${task.room} marked available.`, 'success') }
      else pushToast(`You accepted room ${task.room}.`, 'success')
    } catch (error: any) { pushToast(error?.message || 'Could not update housekeeping task.', 'error') }
    finally { setSavingId(null) }
  }

  const allChecked = CHECKLIST.every(item => checked[item])
  return <div>
    <h1 className="text-2xl font-semibold mb-1">Housekeeping Tasks</h1>
    <p className="text-navy-400 text-sm mb-6">Accept an available cleaning task. Room assignments are managed from Room Management.</p>
    <div className="grid gap-3">
      {tasks.map(task => <div key={task.id} className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="w-12 h-12 rounded-lg bg-navy-900 text-white flex items-center justify-center font-display font-semibold shrink-0">{task.room}</div>
        <div className="flex-1 min-w-0"><b className="text-sm">{task.roomType || `Room ${task.room}`}</b><div className="text-xs text-navy-400">{task.checkoutTime ? `Checkout ${task.checkoutTime} · ` : ''}{task.priority} priority{task.notes ? ` · ${task.notes}` : ''}</div><div className="text-xs text-navy-500 mt-1">{task.status === 'pending' ? 'Unassigned' : `Cleaner: ${task.assignedTo || 'Unassigned'}`}</div></div>
        <StatusBadge status={task.status} />
        {task.status === 'pending' && <button disabled={savingId === task.id} onClick={() => void updateTask(task, 'claim')} className="btn-primary btn-sm justify-center disabled:opacity-50">{savingId === task.id ? 'Accepting…' : 'Accept task'}</button>}
        {task.status === 'in_progress' && <button disabled={savingId === task.id} onClick={() => { setActive(task); setDoneRoom(null); setChecked({}) }} className="btn-gold btn-sm justify-center disabled:opacity-50">Mark done</button>}
      </div>)}
      {tasks.length === 0 && <div className="card p-6 text-sm text-navy-400">No rooms are waiting for housekeeping.</div>}
    </div>
    <Modal open={!!active} onClose={() => !saving && (setActive(null), setDoneRoom(null))} title={doneRoom ? `Room ${doneRoom} is available` : `Room ${active?.room} — cleaning checklist`} subtitle={!doneRoom ? active?.roomType : undefined}>
      {doneRoom ? <div className="text-center py-4"><div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={30} /></div><p className="text-sm text-navy-500">Room {doneRoom} has been marked clean and available.</p><button onClick={() => { setActive(null); setDoneRoom(null) }} className="btn-primary mt-6">Done</button></div> : active && <div><div className="flex flex-col gap-2 mb-6">{CHECKLIST.map(item => <label key={item} className="flex items-center gap-3 text-sm py-2 border-b border-black/5 last:border-none cursor-pointer"><input type="checkbox" checked={!!checked[item]} onChange={event => setChecked({ ...checked, [item]: event.target.checked })} className="w-4 h-4" />{item}</label>)}</div><button disabled={!allChecked || saving} onClick={async () => { setSaving(true); await updateTask(active, 'complete'); setSaving(false) }} className={'w-full justify-center text-base py-4 ' + (allChecked && !saving ? 'btn-gold' : 'btn-outline opacity-50 cursor-not-allowed')}>{saving ? <><Loader2 size={15} className="animate-spin" /> Updating…</> : 'Mark room available'}</button></div>}
    </Modal>
  </div>
}
