'use client'
import { useState } from 'react'
import { useStore } from '../../../store/useStore'
import StatusBadge from '../../../components/ui/StatusBadge'
import Modal from '../../../components/ui/Modal'
import { formatDate } from '../../../lib/format'

export default function Tickets() {
  const { maintenanceTickets, resolveMaintenanceTicket, updateMaintenanceTicket } = useStore()
  const [active, setActive] = useState<typeof maintenanceTickets[0] | null>(null)

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Maintenance Tickets</h1>
      <div className="grid gap-3">
        {maintenanceTickets.map(t => (
          <button key={t.id} onClick={() => setActive(t)} className="card p-5 flex items-center gap-4 text-left w-full">
            <div className="w-12 h-12 rounded-lg bg-navy-900 text-white flex items-center justify-center font-display font-semibold shrink-0">{t.room}</div>
            <div className="flex-1">
              <b className="text-sm">{t.issue}</b>
              <div className="text-xs text-navy-400">Room {t.room} · Assigned to {t.assignedTo} · Reported {formatDate(t.dateReported)}</div>
            </div>
            <StatusBadge status={t.priority} />
            <StatusBadge status={t.status} />
          </button>
        ))}
      </div>

      <Modal open={!!active} onClose={() => setActive(null)} title={active?.issue ?? ''} subtitle={active ? `Room ${active.room}` : ''}>
        {active && (
          <div>
            <div className="flex flex-col gap-0.5 mb-5">
              {[['Priority', active.priority],['Assigned staff', active.assignedTo],['Date reported', formatDate(active.dateReported)],['Status', active.status]].map(([l,v]) => (
                <div key={l} className="flex justify-between text-sm py-2.5 border-b border-dashed border-black/10 last:border-none"><span className="text-navy-400">{l}</span><span className="font-medium">{v}</span></div>
              ))}
            </div>
            <label className="field-label">Notes</label>
            <textarea value={active.notes} onChange={e => updateMaintenanceTicket(active.id, { notes: e.target.value })} rows={3} className="field-input !h-auto py-2.5 mb-5" />
            {active.status !== 'resolved' ? (
              <button onClick={() => { resolveMaintenanceTicket(active.id); setActive(null) }} className="btn-gold w-full justify-center text-base py-4">MARK AS RESOLVED</button>
            ) : (
              <div className="text-center text-sm text-emerald-600 font-semibold">✓ This issue has been resolved</div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
