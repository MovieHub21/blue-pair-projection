'use client'
import { useStore } from '../../../store/useStore'
import { naira, formatDate } from '../../../lib/format'
import StatusBadge from '../../../components/ui/StatusBadge'

export default function CheckInManagement() {
  const { bookings, roomTypes, customers, rooms, checkInBooking } = useStore()
  const arrivals = bookings.filter(b => ['confirmed','pending'].includes(b.status))
  const custOf = (id: string) => customers.find(c => c.id === id)
  const roomOf = (id: string) => roomTypes.find(r => r.id === id)
  const freeRoom = (roomTypeId: string) => rooms.find(r => r.roomTypeId === roomTypeId && r.status === 'available')

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Check-in Management</h1>
      <p className="text-navy-400 text-sm mb-6">Today's arrivals — assign a room and check guests in.</p>
      <div className="grid gap-4">
        {arrivals.map(b => {
          const room = freeRoom(b.roomTypeId)
          return (
            <div key={b.id} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <img src={roomOf(b.roomTypeId)?.images[0]} className="w-16 h-16 rounded-xl object-cover" />
              <div className="flex-1">
                <div className="flex items-center gap-2"><b>{custOf(b.customerId)?.name}</b><StatusBadge status={b.status} /></div>
                <span className="text-xs text-navy-400">{roomOf(b.roomTypeId)?.name} · {formatDate(b.checkIn)} → {formatDate(b.checkOut)} · {b.reference}</span>
              </div>
              <div className="text-right">
                <b className="font-display block">{naira(b.amount)}</b>
                <span className="text-xs text-navy-400">{room ? `Room ${room.roomNumber} available` : 'No room free — assign manually'}</span>
              </div>
              <button disabled={!room} onClick={() => room && checkInBooking(b.id, room.id)} className={'btn-sm ' + (room ? 'btn-primary' : 'btn-outline opacity-50 cursor-not-allowed')}>
                Confirm guest &amp; check in
              </button>
            </div>
          )
        })}
        {arrivals.length === 0 && <div className="card p-10 text-center text-navy-400 text-sm">No arrivals pending check-in.</div>}
      </div>
    </div>
  )
}
