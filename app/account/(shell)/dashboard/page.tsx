import Link from 'next/link'
import { ConciergeBell, Sparkles, UtensilsCrossed } from 'lucide-react'
import { getCurrentUser, getMyBookings, getMyPayments } from '../../../../lib/account'
import { naira, formatDate } from '../../../../lib/format'
import StatusBadge from '../../../../components/ui/StatusBadge'
import CancelBookingButton from '../CancelBookingButton'

export default async function DashboardPage() {
  const { profile } = await getCurrentUser()
  const [bookings, payments] = await Promise.all([getMyBookings(), getMyPayments()])
  const upcoming = bookings.find(b => ['confirmed', 'checked_in'].includes(b.status))
  const firstName = (profile?.name || 'there').split(' ')[0]

  return (
    <div>
      <section className="relative overflow-hidden rounded-xl2 min-h-72 p-6 md:p-9 mb-7 flex items-end text-white" style={{ backgroundImage: "linear-gradient(0deg, rgba(10,18,41,.88), rgba(10,18,41,.12)), url('https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1800&q=80')", backgroundPosition: 'center', backgroundSize: 'cover' }}>
        <div className="relative z-10 max-w-md">
          <p className="text-gold-300 uppercase tracking-[.16em] text-[10px] font-bold mb-3">Blue Pair Hotel</p>
          <h1 className="text-3xl md:text-4xl font-semibold">Good to have you here, {firstName}.</h1>
          <p className="text-sm text-white/80 mt-3 leading-relaxed">Your stay, your way. Order to your room, request hotel service, or explore everything Blue Pair has prepared for you.</p>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <Link href="/account/requests" className="card p-3.5 md:p-5 text-center hover:-translate-y-0.5 transition-transform"><UtensilsCrossed size={20} className="mx-auto text-gold-500 mb-2" /><span className="text-xs font-semibold">Room service</span></Link>
        <Link href="/account/requests" className="card p-3.5 md:p-5 text-center hover:-translate-y-0.5 transition-transform"><Sparkles size={20} className="mx-auto text-gold-500 mb-2" /><span className="text-xs font-semibold">Request help</span></Link>
        <Link href="/contact" className="card p-3.5 md:p-5 text-center hover:-translate-y-0.5 transition-transform"><ConciergeBell size={20} className="mx-auto text-gold-500 mb-2" /><span className="text-xs font-semibold">Concierge</span></Link>
      </div>

      {upcoming && (
        <div className="card p-6 flex flex-col md:flex-row gap-5 mb-8">
          {upcoming.room?.images?.[0] && (
            <img src={upcoming.room.images[0]} alt={upcoming.room.name} className="w-full md:w-40 h-40 rounded-xl2 object-cover" />
          )}
          <div className="flex-1">
            <span className="eyebrow">Upcoming stay</span>
            <div className="flex justify-between items-start gap-3 mt-1">
              <h3 className="text-xl font-semibold">{upcoming.room?.name ?? 'Room'}</h3>
              <StatusBadge status={upcoming.status} />
            </div>
            <p className="text-sm text-navy-500 mt-1.5">{formatDate(upcoming.checkIn)} → {formatDate(upcoming.checkOut)} · {upcoming.adults} adults</p>
            <p className="text-xs text-navy-400 mt-1">Ref: {upcoming.reference}</p>
            <div className="flex gap-2 mt-4">
              <Link href="/account/bookings" className="btn-outline btn-sm">View details</Link>
              {['pending', 'confirmed'].includes(upcoming.status) && <CancelBookingButton bookingId={upcoming.id} />}
            </div>
          </div>
        </div>
      )}

      {bookings.length === 0 && (
        <div className="card p-8 text-center mb-8">
          <p className="text-sm text-navy-500 mb-4">You don't have any bookings yet.</p>
          <Link href="/rooms" className="btn-primary">Browse rooms</Link>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold mb-3 text-sm">Booking history</h4>
          <div className="card divide-y divide-black/5">
            {bookings.length === 0 && <div className="px-5 py-4 text-sm text-navy-400">No bookings yet.</div>}
            {bookings.map(b => (
              <div key={b.id} className="px-5 py-4 flex justify-between items-center">
                <div><b className="text-sm block">{b.room?.name ?? 'Room'}</b><span className="text-xs text-navy-400">{formatDate(b.checkIn)}</span></div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Recent payments</h4>
          <div className="card divide-y divide-black/5">
            {payments.length === 0 && <div className="px-5 py-4 text-sm text-navy-400">No payments yet.</div>}
            {payments.map(p => (
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
