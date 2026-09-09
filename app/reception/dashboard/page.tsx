'use client'
import { useStore } from '../../../store/useStore'
import StatCard from '../../../components/ui/StatCard'
import AvailabilityGrid from '../../../components/admin/AvailabilityGrid'
import { LogIn, LogOut, BedDouble, ClipboardList } from 'lucide-react'

export default function ReceptionDashboard() {
  const { rooms, bookings } = useStore()
  const arrivals = bookings.filter(b => ['confirmed','pending'].includes(b.status)).length
  const departures = bookings.filter(b => b.status === 'checked_in').length
  const available = rooms.filter(r => r.status === 'available').length

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Reception Dashboard</h1>
      <p className="text-navy-400 text-sm mb-6">Friday, 9 August 2026</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Today's arrivals" value={String(arrivals)} icon={<LogIn size={17}/>} tint="green" />
        <StatCard label="Today's departures" value={String(departures)} icon={<LogOut size={17}/>} tint="navy" />
        <StatCard label="Available rooms" value={String(available)} icon={<BedDouble size={17}/>} tint="green" />
        <StatCard label="Pending check-ins" value={String(arrivals)} icon={<ClipboardList size={17}/>} />
      </div>
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Occupancy overview</h3>
        <AvailabilityGrid />
      </div>
    </div>
  )
}
