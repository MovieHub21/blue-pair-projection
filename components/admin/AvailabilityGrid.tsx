'use client'
import { useStore } from '../../store/useStore'
import type { RoomStatus } from '../../data/mock'

const COLORS: Record<RoomStatus, string> = {
  available: 'bg-emerald-500',
  occupied: 'bg-blue-600',
  cleaning: 'bg-amber-400 text-navy-950',
  cleaning_required: 'bg-orange-500',
  maintenance: 'bg-red-600',
}
const LABELS: Record<RoomStatus, string> = {
  available: 'Available', occupied: 'Occupied', cleaning: 'Cleaning', cleaning_required: 'Cleaning Req.', maintenance: 'Maintenance',
}

export default function AvailabilityGrid({ onSelect }: { onSelect?: (roomId: string) => void }) {
  const { rooms } = useStore()
  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-5 text-xs text-navy-500">
        {(Object.keys(COLORS) as RoomStatus[]).map(k => (
          <span key={k} className="flex items-center gap-1.5"><i className={'w-2.5 h-2.5 rounded-sm inline-block ' + COLORS[k]} />{LABELS[k]}</span>
        ))}
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
        {rooms.map(r => (
          <button key={r.id} onClick={() => onSelect?.(r.id)}
            className={'aspect-square rounded-lg flex flex-col items-center justify-center text-white font-bold text-xs gap-0.5 hover:brightness-110 transition ' + COLORS[r.status]}>
            <span>{r.roomNumber}</span>
            <span className="text-[8px] font-medium opacity-80">{LABELS[r.status]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
