'use client'
import { useState } from 'react'
import { useStore } from '../../../store/useStore'
import AvailabilityGrid from '../../../components/admin/AvailabilityGrid'
import Modal from '../../../components/ui/Modal'
import type { RoomStatus } from '../../../data/mock'

const STATUS_OPTIONS: { key: RoomStatus; label: string }[] = [
  { key: 'available', label: 'Available' }, { key: 'occupied', label: 'Occupied' },
  { key: 'cleaning', label: 'Cleaning' }, { key: 'cleaning_required', label: 'Cleaning Required' }, { key: 'maintenance', label: 'Maintenance' },
]

export default function RoomAvailability() {
  const { rooms, roomTypes, setRoomStatus, pushToast } = useStore()
  const [activeId, setActiveId] = useState<string | null>(null)
  const room = rooms.find(r => r.id === activeId)
  const rt = room ? roomTypes.find(t => t.id === room.roomTypeId) : null

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Room Availability</h1>
      <p className="text-navy-400 text-sm mb-6">Click any room to update its status.</p>
      <div className="card p-6">
        <AvailabilityGrid onSelect={setActiveId} />
      </div>

      <Modal open={!!activeId} onClose={() => setActiveId(null)} title={room ? `Room ${room.roomNumber}` : ''} subtitle={rt?.name}>
        {room && (
          <div>
            <label className="field-label mb-2 block">Set status</label>
            <div className="grid grid-cols-2 gap-2.5">
              {STATUS_OPTIONS.map(s => (
                <button key={s.key} onClick={() => { setRoomStatus(room.id, s.key); pushToast(`Room ${room.roomNumber} set to ${s.label}`, 'success'); setActiveId(null) }}
                  className={'px-3.5 py-3 rounded-lg border text-xs font-semibold text-left ' + (room.status === s.key ? 'border-navy-950 bg-cream-100' : 'border-black/10')}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
