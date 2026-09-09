'use client'
import { useState } from 'react'
import { useStore } from '../../../../store/useStore'
import { naira, formatDate } from '../../../../lib/format'
import StatusBadge from '../../../../components/ui/StatusBadge'
import Modal from '../../../../components/ui/Modal'

export default function MyBookingsPage() {
  const { bookings, roomTypes, cancelBooking } = useStore()
  const mine = bookings.filter(b => b.customerId === 'c1')
  const [active, setActive] = useState<typeof bookings[0] | null>(null)
  const roomOf = (id: string) => roomTypes.find(r => r.id === id)

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">My Bookings</h1>
      <div className="grid gap-4">
        {mine.map(b => (
          <div key={b.id} className="card p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
            <img src={roomOf(b.roomTypeId)?.images[0]} alt={roomOf(b.roomTypeId)?.name} className="w-full sm:w-28 h-28 rounded-xl object-cover" />
            <div className="flex-1">
              <div className="flex justify-between items-start gap-2 flex-wrap">
                <div>
                  <b className="block">{roomOf(b.roomTypeId)?.name}</b>
                  <span className="text-xs text-navy-400">{b.reference} · {formatDate(b.checkIn)} → {formatDate(b.checkOut)}</span>
                </div>
                <div className="text-right"><b className="font-display block">{naira(b.amount)}</b><StatusBadge status={b.paymentStatus} /></div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <StatusBadge status={b.status} />
                <button onClick={() => setActive(b)} className="btn-outline btn-sm ml-auto">View details</button>
                {['pending','confirmed'].includes(b.status) && (
                  <button onClick={() => cancelBooking(b.id)} className="btn-outline btn-sm text-red-600 border-red-100">Cancel</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!active} onClose={() => setActive(null)} title="Booking details" subtitle={active?.reference}>
        {active && (
          <div className="flex flex-col gap-0.5">
            {[
              ['Room', roomOf(active.roomTypeId)?.name],
              ['Check-in', formatDate(active.checkIn)],
              ['Check-out', formatDate(active.checkOut)],
              ['Guests', `${active.adults} adults, ${active.children} children`],
              ['Amount', naira(active.amount)],
              ['Payment status', active.paymentStatus],
              ['Booking status', active.status],
              ['Special requests', active.specialRequests || 'None'],
            ].map(([l,v]) => (
              <div key={l} className="flex justify-between text-sm py-2.5 border-b border-dashed border-black/10 last:border-none"><span className="text-navy-400">{l}</span><span className="font-medium capitalize">{v}</span></div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
