'use client'

import { useCallback, useEffect, useState } from 'react'
import StatCard from '../../../components/ui/StatCard'
import { AlertTriangle, Loader, CheckCircle2, Flame } from 'lucide-react'
import { supabase } from '../../../lib/supabase/client'
import { mapMaintenanceTicket } from '../../../lib/mappers'
import type { MaintenanceTicket } from '../../../data/mock'

export default function MaintenanceDashboard() {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([])

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

  const open = tickets.filter(t => t.status === 'open')
  const inProgress = tickets.filter(t => t.status === 'in_progress')
  const resolved = tickets.filter(t => t.status === 'resolved')
  const urgent = tickets.filter(t => t.priority === 'High' && t.status !== 'resolved')

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Maintenance Dashboard</h1>
      <p className="text-navy-400 text-sm mb-6">Open facility issues across the property.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Open issues" value={String(open.length)} icon={<AlertTriangle size={17} />} />
        <StatCard label="In progress" value={String(inProgress.length)} icon={<Loader size={17} />} tint="navy" />
        <StatCard label="Resolved" value={String(resolved.length)} icon={<CheckCircle2 size={17} />} tint="green" />
        <StatCard label="Urgent" value={String(urgent.length)} icon={<Flame size={17} />} deltaTone="down" />
      </div>
    </div>
  )
}
