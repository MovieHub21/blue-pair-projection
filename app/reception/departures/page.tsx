'use client'
import { useStore } from '../../../store/useStore'
import { formatDate } from '../../../lib/format'
import StatusBadge from '../../../components/ui/StatusBadge'

export default function Departures() {
  const { bookings, roomTypes, customers, rooms, checkOutBooking } = useStore()
  const departures = bookings.filter(b => b.status === 'checked_in')
  const custOf = (id: string) => customers.find(c => c.id === id)
  const roomOf = (id: string) => roomTypes.find(r => r.id === id)
  const physicalRoom = (id?: string) => rooms.find(r => r.id === id)

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Today's Departures</h1>
      <p className="text-sm text-navy-400 mb-6">Checking out automatically flags the room for housekeeping.</p>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead><tr className="text-left text-xs text-navy-400 border-b border-black/5"><th className="p-4">Guest</th><th className="p-4">Room</th><th className="p-4">Check-out</th><th className="p-4">Status</th><th className="p-4"></th></tr></thead>
          <tbody>
            {departures.map(b => (
              <tr key={b.id} className="border-b border-black/5 last:border-none">
                <td className="p-4"><b>{custOf(b.customerId)?.name}</b><div className="text-xs text-navy-400">{b.reference}</div></td>
                <td className="p-4 text-navy-500">Room {physicalRoom(b.roomId)?.roomNumber} · {roomOf(b.roomTypeId)?.name}</td>
                <td className="p-4 text-navy-500">{formatDate(b.checkOut)}</td>
                <td className="p-4"><StatusBadge status={b.status} /></td>
                <td className="p-4"><button onClick={() => checkOutBooking(b.id)} className="btn-primary btn-sm">Check out</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
