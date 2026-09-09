'use client'
import { useStore } from '../../../store/useStore'
import { formatDate } from '../../../lib/format'

export default function RoomAssignment() {
  const { bookings, roomTypes, customers, rooms, checkInBooking } = useStore()
  const needsAssignment = bookings.filter(b => b.status === 'confirmed' && !b.roomId)
  const custOf = (id: string) => customers.find(c => c.id === id)
  const roomOf = (id: string) => roomTypes.find(r => r.id === id)

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Room Assignment</h1>
      <p className="text-sm text-navy-400 mb-6">Assign an available physical room to each confirmed booking.</p>
      <div className="grid gap-4">
        {needsAssignment.map(b => {
          const options = rooms.filter(r => r.roomTypeId === b.roomTypeId && r.status === 'available')
          return (
            <div key={b.id} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1"><b>{custOf(b.customerId)?.name}</b><div className="text-xs text-navy-400">{roomOf(b.roomTypeId)?.name} · {formatDate(b.checkIn)} → {formatDate(b.checkOut)}</div></div>
              <div className="flex gap-2 flex-wrap">
                {options.length === 0 && <span className="text-xs text-navy-400">No rooms currently free</span>}
                {options.map(r => (
                  <button key={r.id} onClick={() => checkInBooking(b.id, r.id)} className="btn-outline btn-sm">Assign {r.roomNumber}</button>
                ))}
              </div>
            </div>
          )
        })}
        {needsAssignment.length === 0 && <div className="card p-10 text-center text-navy-400 text-sm">All confirmed bookings have rooms assigned.</div>}
      </div>
    </div>
  )
}
