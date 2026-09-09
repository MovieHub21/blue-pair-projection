'use client'
import { useStore } from '../../../store/useStore'
import { naira, formatDate } from '../../../lib/format'
import StatusBadge from '../../../components/ui/StatusBadge'

export default function Arrivals() {
  const { bookings, roomTypes, customers, rooms, checkInBooking } = useStore()
  const arrivals = bookings.filter(b => ['confirmed','pending'].includes(b.status))
  const custOf = (id: string) => customers.find(c => c.id === id)
  const roomOf = (id: string) => roomTypes.find(r => r.id === id)
  const freeRoom = (roomTypeId: string) => rooms.find(r => r.roomTypeId === roomTypeId && r.status === 'available')

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Today's Arrivals</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead><tr className="text-left text-xs text-navy-400 border-b border-black/5"><th className="p-4">Guest</th><th className="p-4">Room type</th><th className="p-4">Nights</th><th className="p-4">Amount</th><th className="p-4">Status</th><th className="p-4"></th></tr></thead>
          <tbody>
            {arrivals.map(b => {
              const room = freeRoom(b.roomTypeId)
              return (
                <tr key={b.id} className="border-b border-black/5 last:border-none">
                  <td className="p-4"><b>{custOf(b.customerId)?.name}</b><div className="text-xs text-navy-400">{b.reference}</div></td>
                  <td className="p-4 text-navy-500">{roomOf(b.roomTypeId)?.name}</td>
                  <td className="p-4 text-navy-500">{formatDate(b.checkIn)} → {formatDate(b.checkOut)}</td>
                  <td className="p-4 font-display">{naira(b.amount)}</td>
                  <td className="p-4"><StatusBadge status={b.status} /></td>
                  <td className="p-4"><button disabled={!room} onClick={() => room && checkInBooking(b.id, room.id)} className={'btn-sm ' + (room ? 'btn-primary' : 'btn-outline opacity-50')}>Check in</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
