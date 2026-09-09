'use client'
import { useState } from 'react'
import { useStore } from '../../../../store/useStore'
import StatusBadge from '../../../../components/ui/StatusBadge'
import Modal from '../../../../components/ui/Modal'
import { CheckCircle2 } from 'lucide-react'

const CHECKLIST = ['Strip & remake bed', 'Change towels', 'Clean bathroom', 'Vacuum / mop floor', 'Restock amenities', 'Final inspection']

export default function Tasks() {
  const { housekeepingTasks, markCleaningStarted, markCleaned } = useStore()
  const [active, setActive] = useState<typeof housekeepingTasks[0] | null>(null)
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [done, setDone] = useState<{ room: string; cleaner: string } | null>(null)

  function openTask(t: typeof housekeepingTasks[0]) {
    setActive(t); setChecked({}); setDone(null)
    if (t.status === 'pending') markCleaningStarted(t.id)
  }

  function complete() {
    if (!active) return
    markCleaned(active.id, 'Musa Danladi')
    setDone({ room: active.room, cleaner: 'Musa Danladi' })
  }

  const allChecked = CHECKLIST.every(c => checked[c])

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">My Tasks</h1>
      <div className="grid gap-3">
        {housekeepingTasks.map(t => (
          <button key={t.id} onClick={() => openTask(t)} disabled={t.status === 'completed'} className="card p-5 flex items-center gap-4 text-left disabled:opacity-60">
            <div className="w-12 h-12 rounded-lg bg-navy-900 text-white flex items-center justify-center font-display font-semibold shrink-0">{t.room}</div>
            <div className="flex-1">
              <b className="text-sm">{t.roomType}</b>
              <div className="text-xs text-navy-400">Checkout {t.checkoutTime} · {t.priority} priority{t.notes ? ` · ${t.notes}` : ''}</div>
              {t.completedAt && <div className="text-xs text-emerald-600 mt-0.5">Completed {t.completedAt}</div>}
            </div>
            <StatusBadge status={t.status} />
          </button>
        ))}
      </div>

      <Modal open={!!active} onClose={() => setActive(null)} title={done ? `Room ${done.room} cleaned successfully` : `Room ${active?.room} — cleaning checklist`} subtitle={!done ? active?.roomType : undefined}>
        {done ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={30}/></div>
            <p className="text-sm text-navy-500">✓ Room {done.room} cleaned successfully</p>
            <div className="text-xs text-navy-400 mt-2">Cleaner: {done.cleaner} · {new Date().toLocaleDateString('en-NG',{day:'numeric',month:'short'})} · {new Date().toLocaleTimeString('en-NG',{hour:'2-digit',minute:'2-digit'})}</div>
            <p className="text-xs text-navy-400 mt-4">This room now shows as <b>Available</b> in Room Management.</p>
            <button onClick={() => setActive(null)} className="btn-primary mt-6">Done</button>
          </div>
        ) : (
          <div>
            <div className="flex flex-col gap-2 mb-6">
              {CHECKLIST.map(c => (
                <label key={c} className="flex items-center gap-3 text-sm py-2 border-b border-black/5 last:border-none cursor-pointer">
                  <input type="checkbox" checked={!!checked[c]} onChange={e => setChecked({...checked, [c]: e.target.checked})} className="w-4 h-4" />
                  {c}
                </label>
              ))}
            </div>
            <button disabled={!allChecked} onClick={complete} className={'w-full justify-center text-base py-4 ' + (allChecked ? 'btn-gold' : 'btn-outline opacity-50 cursor-not-allowed')}>
              MARK AS CLEANED
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
