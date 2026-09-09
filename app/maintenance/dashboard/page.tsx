'use client'
import { useStore } from '../../../store/useStore'
import StatCard from '../../../components/ui/StatCard'
import { AlertTriangle, Loader, CheckCircle2, Flame } from 'lucide-react'

export default function MaintenanceDashboard() {
  const { maintenanceTickets } = useStore()
  const open = maintenanceTickets.filter(t => t.status === 'open')
  const inProgress = maintenanceTickets.filter(t => t.status === 'in_progress')
  const resolved = maintenanceTickets.filter(t => t.status === 'resolved')
  const urgent = maintenanceTickets.filter(t => t.priority === 'High' && t.status !== 'resolved')

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Maintenance Dashboard</h1>
      <p className="text-navy-400 text-sm mb-6">Open facility issues across the property.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Open issues" value={String(open.length)} icon={<AlertTriangle size={17}/>} />
        <StatCard label="In progress" value={String(inProgress.length)} icon={<Loader size={17}/>} tint="navy" />
        <StatCard label="Resolved" value={String(resolved.length)} icon={<CheckCircle2 size={17}/>} tint="green" />
        <StatCard label="Urgent" value={String(urgent.length)} icon={<Flame size={17}/>} deltaTone="down" />
      </div>
    </div>
  )
}
