'use client'
import Link from 'next/link'
import { useStore } from '../../../../store/useStore'
import { naira, formatDate } from '../../../../lib/format'
import StatusBadge from '../../../../components/ui/StatusBadge'

export default function DashboardPage() {
  const { bookings, roomTypes, payments } = useStore()
  const mine = bookings.filter(b => b.customerId === 'c1')
  const upcoming = mine.find(b => ['confirmed','checked_in'].includes(b.status))
  const roomOf = (id: string) => roomTypes.find(r => r.id === id)

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Welcome back, Adaeze</h1>
      <p className="text-navy-400 text-sm mb-8">Here's what's happening with your stays.</p>

      {upcoming && (
        <div className="card p-6 flex flex-col md:flex-row gap-5 mb-8">
          <img src={roomOf(upcoming.roomTypeId)?.images[0]} alt={roomOf(upcoming.roomTypeId)?.name} className="w-full md:w-40 h-40 rounded-xl2 object-cover" />
          <div className="flex-1">
            <span className="eyebrow">Upcoming stay</span>
            <div className="flex justify-between items-start gap-3 mt-1">
              <h3 className="text-xl font-semibold">{roomOf(upcoming.roomTypeId)?.name}</h3>
              <StatusBadge status={upcoming.status} />
            </div>
            <p className="text-sm text-navy-500 mt-1.5">{formatDate(upcoming.checkIn)} → {formatDate(upcoming.checkOut)} · {upcoming.adults} adults</p>
            <p className="text-xs text-navy-400 mt-1">Ref: {upcoming.reference}</p>
            <div className="flex gap-2 mt-4">
              <Link href="/account/bookings" className="btn-outline btn-sm">View details</Link>
              <button className="btn-outline btn-sm text-red-600 border-red-100">Cancel booking</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold mb-3 text-sm">Booking history</h4>
          <div className="card divide-y divide-black/5">
            {mine.map(b => (
              <div key={b.id} className="px-5 py-4 flex justify-between items-center">
                <div><b className="text-sm block">{roomOf(b.roomTypeId)?.name}</b><span className="text-xs text-navy-400">{formatDate(b.checkIn)}</span></div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Recent payments</h4>
          <div className="card divide-y divide-black/5">
            {payments.filter(p => p.customer === 'Adaeze Okonkwo').map(p => (
              <div key={p.id} className="px-5 py-4 flex justify-between items-center">
                <div><b className="text-sm block">{p.reference}</b><span className="text-xs text-navy-400">{p.method}</span></div>
                <div className="text-right"><b className="text-sm block">{naira(p.amount)}</b><StatusBadge status={p.status} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
