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
  const [saving, setSaving] = useState(false)

  const loadTickets = useCallback(async () => {
    const { data } = await supabase
      .from('maintenance_tickets')
      .select('*')
      .order('date_reported', { ascending: false })
    if (data) setTickets(data.map(mapMaintenanceTicket))
  }, [])

  useEffect(() => {
    void loadTickets()

    const refresh = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.table || detail.table === 'maintenance_tickets') {
        void loadTickets()
      }
    }

    window.addEventListener('bluepair:database-change', refresh)
    return () => window.removeEventListener('bluepair:database-change', refresh)
  }, [loadTickets])

  async function resolveTicket(id: string) {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('maintenance_tickets')
        .update({ status: 'resolved' })
        .eq('id', id)
      if (error) throw error

      await loadTickets()
      setActive(null)
      pushToast('Maintenance ticket marked as resolved', 'success')
    } catch (err: any) {
      pushToast(err?.message || 'Failed to resolve ticket', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function updateNotes(id: string, notes: string) {
    try {
      const { error } = await supabase
        .from('maintenance_tickets')
        .update({ notes })
        .eq('id', id)
      if (error) throw error
      setTickets(prev => prev.map(t => (t.id === id ? { ...t, notes } : t)))
      if (active && active.id === id) {
        setActive({ ...active, notes })
      }
    } catch (err: any) {
      console.error('[maintenance-ticket] update notes failed', err)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Maintenance Tickets</h1>
      <div className="grid gap-3">
        {tickets.map(t => (
          <button
            key={t.id}
            onClick={() => setActive(t)}
            className="card p-5 flex items-center gap-4 text-left w-full"
          >
            <div className="w-12 h-12 rounded-lg bg-navy-900 text-white flex items-center justify-center font-display font-semibold shrink-0">
              {t.room}
            </div>
            <div className="flex-1">
              <b className="text-sm">{t.issue}</b>
              <div className="text-xs text-navy-400">
                Room {t.room} · Assigned to {t.assignedTo} · Reported {formatDate(t.dateReported)}
              </div>
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
              {[
                ['Priority', active.priority],
                ['Assigned staff', active.assignedTo],
                ['Date reported', formatDate(active.dateReported)],
                ['Status', active.status],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm py-2.5 border-b border-dashed border-black/10 last:border-none">
                  <span className="text-navy-400">{l}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
            <label className="field-label">Notes</label>
            <textarea
              value={active.notes}
              onChange={e => void updateNotes(active.id, e.target.value)}
              rows={3}
              className="field-input !h-auto py-2.5 mb-5"
            />
            {active.status !== 'resolved' ? (
              <button
                disabled={saving}
                onClick={() => void resolveTicket(active.id)}
                className="btn-gold w-full justify-center text-base py-4 disabled:opacity-50"
              >
                {saving ? 'UPDATING…' : 'MARK AS RESOLVED'}
              </button>
            ) : (
              <div className="text-center text-sm text-emerald-600 font-semibold">
                ✓ This issue has been resolved
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
