'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import StatCard from '../../../../components/ui/StatCard'
import StatusBadge from '../../../../components/ui/StatusBadge'
import { ClipboardList, Loader, CheckCircle2, ArrowRight } from 'lucide-react'
import { supabase } from '../../../../lib/supabase/client'
import { mapHousekeepingTask } from '../../../../lib/mappers'
import type { HousekeepingTask } from '../../../../data/mock'

export default function HousekeepingDashboardPage() {
  const [tasks, setTasks] = useState<HousekeepingTask[]>([])

  const loadTasks = useCallback(async () => {
    const { data } = await supabase
      .from('housekeeping_tasks')
      .select('*')
      .order('room')
    if (data) {
      setTasks(data.map(mapHousekeepingTask))
    }
  }, [])

  useEffect(() => {
    void loadTasks()

    const refresh = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.table || detail.table === 'housekeeping_tasks') {
        void loadTasks()
      }
    }

    window.addEventListener('bluepair:database-change', refresh)
    return () => window.removeEventListener('bluepair:database-change', refresh)
  }, [loadTasks])

  const pending = tasks.filter(t => t.status === 'pending')
  const inProgress = tasks.filter(t => t.status === 'in_progress')
  const completed = tasks.filter(t => t.status === 'completed')

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Housekeeping Dashboard</h1>
      <p className="text-navy-400 text-sm mb-6">Rooms needing attention today.</p>
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Needs cleaning" value={String(pending.length)} icon={<ClipboardList size={17} />} />
        <StatCard label="In progress" value={String(inProgress.length)} icon={<Loader size={17} />} tint="navy" />
        <StatCard label="Completed today" value={String(completed.length)} icon={<CheckCircle2 size={17} />} tint="green" />
      </div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Assigned tasks</h3>
        <Link href="/housekeeping/tasks" className="text-sm font-semibold text-navy-900 flex items-center gap-1">
          View all <ArrowRight size={13} />
        </Link>
      </div>
      <div className="grid gap-3">
        {tasks.slice(0, 4).map(t => (
          <div key={t.id} className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-navy-900 text-white flex items-center justify-center font-display font-semibold shrink-0">
              {t.room}
            </div>
            <div className="flex-1">
              <b className="text-sm">{t.roomType}</b>
              <div className="text-xs text-navy-400">Checkout {t.checkoutTime} · {t.priority} priority</div>
            </div>
            <StatusBadge status={t.status} />
          </div>
        ))}
      </div>
    </div>
  )
}
