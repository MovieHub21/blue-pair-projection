'use client'

import { useCallback, useEffect, useState } from 'react'
import StatCard from '@/components/ui/StatCard'
import StatusBadge from '@/components/ui/StatusBadge'
import { AlertTriangle, Loader, CheckCircle2, Flame } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { mapMaintenanceTicket } from '@/lib/mappers'
import type { MaintenanceTicket } from '@/data/mock'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

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
      <div className="flex items-center justify-between mt-8 mb-4"><h2 className="font-semibold">Rooms needing maintenance</h2><Link href="/maintenance/tickets" className="text-sm font-semibold text-navy-900 flex items-center gap-1">View all <ArrowRight size={13} /></Link></div>
      <div className="grid gap-3">{open.slice(0, 5).map(ticket => <div key={ticket.id} className="card p-4 flex items-center gap-4"><div className="w-11 h-11 rounded-lg bg-navy-900 text-white flex items-center justify-center font-semibold">{ticket.room}</div><div className="flex-1 min-w-0"><b className="text-sm">{ticket.issue}</b><div className="text-xs text-navy-400 mt-1">{ticket.assignedTo && ticket.assignedTo !== 'Unassigned' ? `Assigned to ${ticket.assignedTo}` : 'Waiting for a technician'} · {ticket.priority} priority</div></div><StatusBadge status={ticket.status} /></div>)}{open.length === 0 && <div className="card p-5 text-sm text-navy-400">No rooms currently need maintenance.</div>}</div>
    </div>
  )
}
