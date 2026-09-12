import Link from 'next/link'
import { ConciergeBell, Sparkles, UtensilsCrossed, ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import { getCurrentUser, getMyBookings, getMyPayments } from '../../../../lib/account'
import { naira, formatDate } from '../../../../lib/format'
import StatusBadge from '../../../../components/ui/StatusBadge'
import CancelBookingButton from '../CancelBookingButton'
import LiveDateTime from '../../../../components/ui/LiveDateTime'
import ReviewForm from '../ReviewForm'

export default async function DashboardPage() {
  const { profile } = await getCurrentUser()
  const [bookings, payments] = await Promise.all([getMyBookings(), getMyPayments()])
  const upcoming = bookings.find(b => ['confirmed', 'checked_in'].includes(b.status))
  const firstName = (profile?.name || 'there').split(' ')[0]
  const hasCheckedIn = bookings.some((b: any) => b.checkedInAt || b.checked_in_at || b.status === 'checked_in' || b.status === 'checked_out')

  return (
    <div>
      <LiveDateTime />

      <section className="relative overflow-hidden rounded-[1.5rem] min-h-[430px] md:min-h-[470px] mb-7 text-white flex items-end shadow-pop">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1800&q=85')" }} role="img" aria-label="A welcoming Blue Pair hotel room" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950/95 via-navy-950/65 to-navy-950/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-navy-950/10" />

        <div className="relative z-10 w-full p-7 md:p-10 lg:p-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-3.5 py-2 text-[10px] tracking-[0.16em] uppercase font-semibold text-white/90 mb-5">
              <Sparkles size={13} className="text-gold-300" />
              Welcome home
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.02] tracking-[-0.03em]">Good to have you here, {firstName}.</h1>
            <p className="text-base md:text-lg text-white/85 leading-relaxed mt-5 max-w-xl">Your Blue Pair space is ready. Settle in, keep an eye on your stay, request anything you need, or simply explore what is waiting for you.</p>

            {upcoming ? (
              <div className="mt-7 inline-flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md px-4 py-3.5 md:px-5">
                <div className="flex items-center gap-2.5 text-sm"><CalendarDays size={17} className="text-gold-300" /><span>Next stay</span></div>
                <div className="hidden sm:block h-5 w-px bg-white/20" />
                <div className="text-sm font-semibold">{upcoming.room?.name ?? 'Your room'}</div>
                <div className="text-xs text-white/65">{formatDate(upcoming.checkIn)} → {formatDate(upcoming.checkOut)}</div>
              </div>
            ) : (
              <Link href="/rooms" className="inline-flex items-center gap-2 mt-7 rounded-lg bg-gold-500 px-5 py-3 text-sm font-semibold text-navy-950 hover:bg-gold-400 transition-colors">Plan a stay <ArrowRight size={15} /></Link>
            )}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-6 text-xs text-white/60">
              <span className="flex items-center gap-1.5"><MapPin size={13} className="text-gold-300" /> Uromi, Edo State</span>
              <span>Hospitality made personal</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <Link href="/account/requests" className="group card p-3.5 md:p-5 hover:-translate-y-0.5 transition-transform"><UtensilsCrossed size={20} className="mx-auto text-gold-500 mb-2" /><span className="text-xs font-semibold block text-center">Room service</span><span className="hidden md:block text-[11px] text-navy-400 text-center mt-1">Order something in</span></Link>
        <Link href="/account/requests" className="group card p-3.5 md:p-5 hover:-translate-y-0.5 transition-transform"><Sparkles size={20} className="mx-auto text-gold-500 mb-2" /><span className="text-xs font-semibold block text-center">Request help</span><span className="hidden md:block text-[11px] text-navy-400 text-center mt-1">We are here for you</span></Link>
        <Link href="/contact" className="group card p-3.5 md:p-5 hover:-translate-y-0.5 transition-transform"><ConciergeBell size={20} className="mx-auto text-gold-500 mb-2" /><span className="text-xs font-semibold block text-center">Concierge</span><span className="hidden md:block text-[11px] text-navy-400 text-center mt-1">Ask us anything</span></Link>
      </div>

      {upcoming && (
        <div className="card p-6 flex flex-col md:flex-row gap-5 mb-8">
          {upcoming.room?.images?.[0] && <img src={upcoming.room.images[0]} alt={upcoming.room.name} className="w-full md:w-40 h-40 rounded-xl2 object-cover" />}
          <div className="flex-1">
            <span className="eyebrow">Upcoming stay</span>
            <div className="flex justify-between items-start gap-3 mt-1"><h3 className="text-xl font-semibold">{upcoming.room?.name ?? 'Room'}</h3><StatusBadge status={upcoming.status} /></div>
            <p className="text-sm text-navy-500 mt-1.5">{formatDate(upcoming.checkIn)} → {formatDate(upcoming.checkOut)} · {upcoming.adults} adults</p>
            <p className="text-xs text-navy-400 mt-1">Ref: {upcoming.reference}</p>
            <div className="flex gap-2 mt-4"><Link href="/account/bookings" className="btn-outline btn-sm">View details</Link>{['pending', 'confirmed'].includes(upcoming.status) && <CancelBookingButton bookingId={upcoming.id} />}</div>
          </div>
        </div>
      )}

      {bookings.length === 0 && <div className="card p-8 text-center mb-8"><p className="text-sm text-navy-500 mb-4">You don't have any bookings yet.</p><Link href="/rooms" className="btn-primary">Browse rooms</Link></div>}

      <div className="grid md:grid-cols-2 gap-6">
        <div><h4 className="font-semibold mb-3 text-sm">Booking history</h4><div className="card divide-y divide-black/5">{bookings.length === 0 && <div className="px-5 py-4 text-sm text-navy-400">No bookings yet.</div>}{bookings.map(b => <div key={b.id} className="px-5 py-4 flex justify-between items-center"><div><b className="text-sm block">{b.room?.name ?? 'Room'}</b><span className="text-xs text-navy-400">{formatDate(b.checkIn)}</span></div><StatusBadge status={b.status} /></div>)}</div></div>
        <div><h4 className="font-semibold mb-3 text-sm">Recent payments</h4><div className="card divide-y divide-black/5">{payments.length === 0 && <div className="px-5 py-4 text-sm text-navy-400">No payments yet.</div>}{payments.map(p => <div key={p.id} className="px-5 py-4 flex justify-between items-center"><div><b className="text-sm block">{p.reference}</b><span className="text-xs text-navy-400">{p.method}</span></div><div className="text-right"><b className="text-sm block">{naira(p.amount)}</b><StatusBadge status={p.status} /></div></div>)}</div></div>
      </div>

      {hasCheckedIn && <div className="mt-8"><ReviewForm /></div>}
    </div>
  )
}
