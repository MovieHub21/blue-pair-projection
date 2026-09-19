'use client'

import { useCallback, useEffect, useState } from 'react'
import StatCard from '../../../components/ui/StatCard'
import AvailabilityGrid from '../../../components/admin/AvailabilityGrid'
import type { Room } from '../../../data/mock'
import { LogIn, LogOut, BedDouble, ClipboardList } from 'lucide-react'
import { supabase } from '../../../lib/supabase/client'
import { mapRoom } from '../../../lib/mappers'

export default function ReceptionDashboard() {
  const [arrivalsCount, setArrivalsCount] = useState(0)
  const [departuresCount, setDeparturesCount] = useState(0)
  const [availableCount, setAvailableCount] = useState(0)
  const [rooms, setRooms] = useState<Room[]>([])

  const loadCounts = useCallback(async () => {
    const [arrivalsRes, departuresRes, roomsRes] = await Promise.all([
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'confirmed').eq('payment_status', 'paid'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'checked_in'),
      supabase.from('rooms').select('*', { count: 'exact' }).eq('status', 'available'),
    ])
    setArrivalsCount(arrivalsRes.count ?? 0)
    setDeparturesCount(departuresRes.count ?? 0)
    setAvailableCount(roomsRes.count ?? 0)
    if (roomsRes.data) setRooms(roomsRes.data.map(mapRoom))
  }, [])

  useEffect(() => {
    void loadCounts()

    const RELEVANT_TABLES = new Set(['bookings', 'rooms', 'room_daily_statuses'])
    const refresh = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.table || RELEVANT_TABLES.has(detail.table)) {
        void loadCounts()
      }
    }

    window.addEventListener('bluepair:database-change', refresh)
    return () => window.removeEventListener('bluepair:database-change', refresh)
  }, [loadCounts])

  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Reception Dashboard</h1>
      <p className="text-navy-400 text-sm mb-6">{todayFormatted}</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Today's arrivals" value={String(arrivalsCount)} icon={<LogIn size={17} />} tint="green" />
        <StatCard label="Today's departures" value={String(departuresCount)} icon={<LogOut size={17} />} tint="navy" />
        <StatCard label="Available rooms" value={String(availableCount)} icon={<BedDouble size={17} />} tint="green" />
        <StatCard label="Pending check-ins" value={String(arrivalsCount)} icon={<ClipboardList size={17} />} />
      </div>
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Occupancy overview</h3>
        <AvailabilityGrid rooms={rooms} />
      </div>
    </div>
  )
}
