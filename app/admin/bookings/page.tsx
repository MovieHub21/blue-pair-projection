'use client'
import { useState } from 'react'
import { useStore } from '../../../store/useStore'
import { naira, formatDate } from '../../../lib/format'
import StatusBadge from '../../../components/ui/StatusBadge'
import Modal from '../../../components/ui/Modal'
import { Search } from 'lucide-react'

export default function BookingManagement() {
  const { bookings, roomTypes, customers, rooms, cancelBooking, checkInBooking, checkOutBooking } = useStore()
  const [active, setActive] = useState<typeof bookings[0] | null>(null)
  const [q, setQ] = useState('')
  const custOf = (id: string) => customers.find(c => c.id === id)
  const roomOf = (id: string) => roomTypes.find(r => r.id === id)
  const filtered = bookings.filter(b => (custOf(b.customerId)?.name ?? '').toLowerCase().includes(q.toLowerCase()) || b.reference.toLowerCase().includes(q.toLowerCase()))
  const freeRoom = (roomTypeId: string) => rooms.find(r => r.roomTypeId === roomTypeId && r.status === 'available')

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Booking Management</h1>
        <div className="flex items-center gap-2 bg-white border border-black/10 rounded-full px-4 py-2 w-64">
          <Search size={14} className="text-navy-400" /><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search bookings…" className="text-sm outline-none flex-1" />
        </div>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead><tr className="text-left text-xs text-navy-400 border-b border-black/5">
            <th className="p-4">Booking ID</th><th className="p-4">Customer</th><th className="p-4">Room</th><th className="p-4">Check-in</th>
            <th className="p-4">Check-out</th><th className="p-4">Amount</th><th className="p-4">Payment</th><th className="p-4">Status</th><th className="p-4">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map(b => (
              <tr key={b.id} className="border-b border-black/5 last:border-none">
                <td className="p-4 font-medium">{b.reference}</td>
                <td className="p-4">{custOf(b.customerId)?.name}</td>
                <td className="p-4 text-navy-500">{roomOf(b.roomTypeId)?.name}</td>
                <td className="p-4 text-navy-500">{formatDate(b.checkIn)}</td>
                <td className="p-4 text-navy-500">{formatDate(b.checkOut)}</td>
                <td className="p-4 font-display">{naira(b.amount)}</td>
                <td className="p-4"><StatusBadge status={b.paymentStatus} /></td>
                <td className="p-4"><StatusBadge status={b.status} /></td>
                <td className="p-4">
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setActive(b)} className="text-xs font-semibold text-navy-900">View</button>
                    {b.status === 'confirmed' && <button onClick={() => { const r = freeRoom(b.roomTypeId); if (r) checkInBooking(b.id, r.id) }} className="text-xs font-semibold text-emerald-700">Check-in</button>}
                    {b.status === 'checked_in' && <button onClick={() => checkOutBooking(b.id)} className="text-xs font-semibold text-blue-700">Check-out</button>}
                    {['pending','confirmed'].includes(b.status) && <button onClick={() => cancelBooking(b.id)} className="text-xs font-semibold text-red-600">Cancel</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!active} onClose={() => setActive(null)} title="Booking details" subtitle={active?.reference}>
        {active && (
          <div className="flex flex-col gap-0.5">
            {[
              ['Customer', custOf(active.customerId)?.name],
              ['Email', custOf(active.customerId)?.email],
              ['Phone', custOf(active.customerId)?.phone],
              ['Room', roomOf(active.roomTypeId)?.name],
              ['Dates', `${formatDate(active.checkIn)} → ${formatDate(active.checkOut)}`],
              ['Guests', `${active.adults} adults, ${active.children} children`],
              ['Amount', naira(active.amount)],
              ['Special requests', active.specialRequests || 'None'],
            ].map(([l,v]) => (
              <div key={l} className="flex justify-between text-sm py-2.5 border-b border-dashed border-black/10 last:border-none"><span className="text-navy-400">{l}</span><span className="font-medium">{v}</span></div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
