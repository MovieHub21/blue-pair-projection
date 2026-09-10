'use client'
import { useState } from 'react'
import { naira, formatDate } from '../../../../lib/format'
import StatusBadge from '../../../../components/ui/StatusBadge'
import Modal from '../../../../components/ui/Modal'
import CancelBookingButton from '../CancelBookingButton'
import type { RoomType, Booking } from '../../../../data/mock'

type BookingWithRoom = Booking & { room: RoomType | null }

export default function MyBookingsClient({ bookings }: { bookings: BookingWithRoom[] }) {
  const [active, setActive] = useState<BookingWithRoom | null>(null)

  if (bookings.length === 0) {
    return <div className="card p-8 text-center text-sm text-navy-500">You don't have any bookings yet.</div>
  }

  return (
    <div>
      <div className="grid gap-4">
        {bookings.map(b => (
          <div key={b.id} className="card p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
            {b.room?.images?.[0] && <img src={b.room.images[0]} alt={b.room.name} className="w-full sm:w-28 h-28 rounded-xl object-cover" />}
            <div className="flex-1">
              <div className="flex justify-between items-start gap-2 flex-wrap">
                <div>
                  <b className="block">{b.room?.name ?? 'Room'}</b>
                  <span className="text-xs text-navy-400">{b.reference} · {formatDate(b.checkIn)} → {formatDate(b.checkOut)}</span>
                </div>
                <div className="text-right"><b className="font-display block">{naira(b.amount)}</b><StatusBadge status={b.paymentStatus} /></div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <StatusBadge status={b.status} />
                <button onClick={() => setActive(b)} className="btn-outline btn-sm ml-auto">View details</button>
                {['pending', 'confirmed'].includes(b.status) && <CancelBookingButton bookingId={b.id} />}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!active} onClose={() => setActive(null)} title="Booking details" subtitle={active?.reference}>
        {active && (
          <div className="flex flex-col gap-0.5">
            {[
              ['Room', active.room?.name ?? 'Room'],
              ['Check-in', formatDate(active.checkIn)],
              ['Check-out', formatDate(active.checkOut)],
              ['Guests', `${active.adults} adults, ${active.children} children`],
              ['Amount', naira(active.amount)],
              ['Payment status', active.paymentStatus],
              ['Booking status', active.status],
              ['Special requests', active.specialRequests || 'None'],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between text-sm py-2.5 border-b border-dashed border-black/10 last:border-none"><span className="text-navy-400">{l}</span><span className="font-medium capitalize">{v}</span></div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
