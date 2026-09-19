'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { mapParkingZone } from '../../../lib/mappers'
import type { ParkingZone } from '../../../data/mock'
import { Car } from 'lucide-react'

export default function ParkingManagement() {
  const [parkingZones, setParkingZones] = useState<ParkingZone[]>([])

  const loadZones = useCallback(async () => {
    const { data, error } = await supabase.from('parking_zones').select('*').order('name')
    if (!error && data) setParkingZones(data.map(mapParkingZone))
  }, [])

  useEffect(() => {
    loadZones()
    const handleDbChange = (e: CustomEvent<{ table?: string }>) => {
      if (!e.detail?.table || e.detail.table === 'parking_zones') loadZones()
    }
    window.addEventListener('bluepair:database-change', handleDbChange as EventListener)
    return () => window.removeEventListener('bluepair:database-change', handleDbChange as EventListener)
  }, [loadZones])


  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Parking Management</h1>
      <div className="grid md:grid-cols-3 gap-5">
        {parkingZones.map(z => {
          const pct = Math.round((z.occupied / z.capacity) * 100)
          return (
            <div key={z.id} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold flex items-center gap-2"><Car size={16} className="text-gold-500" />{z.name}</h4>
                <span className={z.type === 'VIP' ? 'pill-gold' : 'pill-blue'}>{z.type}</span>
              </div>
              <div className="h-2 rounded-full bg-cream-100 overflow-hidden mb-2"><div className="h-full bg-navy-900 rounded-full" style={{ width: pct + '%' }} /></div>
              <div className="flex justify-between text-xs text-navy-500"><span>{z.occupied} occupied</span><span>{z.capacity - z.occupied} free</span></div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
