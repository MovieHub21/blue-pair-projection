import Link from 'next/link'
import { ConciergeBell, Sparkles, UtensilsCrossed, ArrowRight, CalendarDays, MapPin, BedDouble, Waves, Dumbbell, PartyPopper, Image, Tag, MapPinned, Clock3 } from 'lucide-react'
import { getCurrentUser, getMyBookings, getMyPayments } from '../../../../lib/account'
import { naira, formatDate } from '../../../../lib/format'
import StatusBadge from '../../../../components/ui/StatusBadge'
import CancelBookingButton from '../CancelBookingButton'
import GuestDateWeather from '../../../../components/account/GuestDateWeather'
import ReviewForm from '../ReviewForm'
import ImageCarousel from '../../../../components/ui/ImageCarousel'

export default async function DashboardPage() {
  const { profile } = await getCurrentUser()
  const [bookings, payments] = await Promise.all([getMyBookings(), getMyPayments()])
  const upcoming = bookings.find(b => ['confirmed', 'checked_in'].includes(b.status))
  const firstName = (profile?.name || 'there').split(' ')[0]
  const hasCheckedIn = bookings.some((b: any) => b.checkedInAt || b.checked_in_at || b.status === 'checked_in' || b.status === 'checked_out')

  const hotelGuide = [
    { icon: BedDouble, title: 'Rooms & suites', text: 'View rooms, suites and available stays.', href: '/rooms' },
    { icon: UtensilsCrossed, title: 'Dining', text: 'Restaurant, food, drinks and room service.', href: '/dining' },
    { icon: Waves, title: 'Pool', text: 'Explore the indoor pool and pool experience.', href: '/pool' },
    { icon: Dumbbell, title: 'Fitness gym', text: 'Keep your routine going during your stay.', href: '/gym' },
    { icon: PartyPopper, title: 'Club & events', text: 'Discover entertainment and event spaces.', href: '/club' },
    { icon: Sparkles, title: 'VIP & amenities', text: 'Lounge, parking and other guest amenities.', href: '/vip-lounge' },
    { icon: Image, title: 'Gallery', text: 'See the hotel, spaces and atmosphere.', href: '/gallery' },
    { icon: Tag, title: 'Offers', text: 'See current packages and special offers.', href: '/offers' },
    { icon: MapPinned, title: 'Find us', text: 'Location, contact and directions.', href: '/contact' },
  ]

  const heroImages = upcoming?.room?.images?.length
    ? upcoming.room.images
    : ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1800&q=85']
  const roomName = upcoming?.room?.name || 'Your Blue Pair stay'

  return (
    <div>
      <GuestDateWeather />

      <section className="relative overflow-hidden rounded-[1.75rem] border border-gold-500/20 bg-navy-950 min-h-[430px] md:min-h-[500px] mb-5 md:mb-7 text-white shadow-pop">
        <ImageCarousel images={heroImages} alt={upcoming?.room?.name ? `${upcoming.room.name} at Blue Pair Hotel` : 'Blue Pair Hotel'} className="absolute inset-0 h-full w-full" imageClassName="scale-[1.02]" autoPlay interval={5500} showArrows={heroImages.length > 1} showDots={heroImages.length > 1} showCounter={heroImages.length > 1} />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/80 via-navy-950/25 to-navy-950/95 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-navy-950 via-navy-950/75 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 top-[24%] h-[52%] bg-[radial-gradient(ellipse_at_center,rgba(10,18,41,0.48),transparent_72%)] pointer-events-none" />

        <div className="relative z-10 flex min-h-[430px] md:min-h-[500px] flex-col justify-between p-5 md:p-10 pointer-events-none">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/30 bg-navy-950/75 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-gold-300 backdrop-blur-md shadow-[0_2px_14px_rgba(0,0,0,0.3)]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Welcome Home</span>
            <span className="rounded-full border border-white/10 bg-navy-950/55 px-2.5 py-1 text-[9px] font-medium uppercase tracking-wider text-white/75 backdrop-blur-md shadow-[0_2px_14px_rgba(0,0,0,0.25)]">{upcoming ? (upcoming.status === 'checked_in' ? 'Currently staying' : 'Upcoming stay') : 'Blue Pair Hotel'}</span>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center text-center px-2 py-10">
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-gold-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{upcoming ? 'Your current reservation' : 'Your Blue Pair experience'}</p>
            <h1 className="font-display text-[2rem] sm:text-4xl md:text-5xl font-medium leading-[1.05] tracking-[-0.02em] text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.9)]">{upcoming ? roomName : 'A stay made personal.'}</h1>
            <p className="mt-3 max-w-sm text-[11px] sm:text-xs md:text-sm leading-relaxed text-white/85 drop-shadow-[0_2px_9px_rgba(0,0,0,0.95)]">{upcoming ? `Good to have you here, ${firstName}. Your space is prepared for a comfortable Blue Pair stay.` : `Good to have you here, ${firstName}. Explore Blue Pair, discover our rooms and make your next stay yours.`}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] text-white/80 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"><span className="flex items-center gap-1.5"><MapPin size={12} className="text-gold-300" /> Uromi, Edo State</span><span className="h-1 w-1 rounded-full bg-white/40" /><span>Hospitality made personal</span></div>
        </div>
      </section>

      {upcoming ? (
        <section className="mb-7 rounded-2xl border border-gold-500/20 bg-white p-4 md:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-black/5 pb-3.5"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/10 text-gold-600"><CalendarDays size={19} /></div><div><span className="text-[9px] font-bold uppercase tracking-[0.18em] text-gold-600">Current reservation</span><h2 className="font-display text-lg font-semibold text-navy-950">{roomName}</h2></div></div><StatusBadge status={upcoming.status} /></div>
          <div className="grid grid-cols-2 gap-3 pt-3.5 text-xs"><div className="rounded-xl bg-cream-100/70 p-3"><span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-navy-400"><CalendarDays size={11} /> Stay dates</span><p className="mt-1 font-semibold text-navy-900">{formatDate(upcoming.checkIn)} → {formatDate(upcoming.checkOut)}</p></div><div className="rounded-xl bg-cream-100/70 p-3"><span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-navy-400"><Clock3 size={11} /> Guests</span><p className="mt-1 font-semibold text-navy-900">{upcoming.adults} adults</p></div></div>
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><span className="text-[10px] text-navy-400">Ref: {upcoming.reference}</span><div className="flex gap-2"><Link href="/account/bookings" className="btn-outline btn-sm flex-1 sm:flex-none">View reservation</Link>{['pending', 'confirmed'].includes(upcoming.status) && <CancelBookingButton bookingId={upcoming.id} />}</div></div>
        </section>
      ) : (
        <section className="mb-7 rounded-2xl border border-gold-500/20 bg-white p-4 md:p-6 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/10 text-gold-600"><CalendarDays size={19} /></div><div className="min-w-0 flex-1"><span className="text-[9px] font-bold uppercase tracking-[0.18em] text-gold-600">Current reservation</span><h2 className="font-display text-base font-semibold text-navy-950">No reservation yet</h2></div><Link href="/rooms" className="shrink-0 rounded-xl bg-gold-500 px-3.5 py-2 text-[11px] font-semibold text-navy-950">Browse rooms</Link></div><p className="mt-3 text-[11px] leading-relaxed text-navy-400">Choose a room and make your next Blue Pair stay part of the experience.</p></section>
      )}

      <div className="grid grid-cols-3 gap-2.5 md:gap-3 mb-8"><Link href="/account/requests" className="group card p-3.5 md:p-5 hover:-translate-y-0.5 transition-transform"><UtensilsCrossed size={20} className="mx-auto text-gold-500 mb-2" /><span className="text-xs font-semibold block text-center">Room service</span><span className="hidden md:block text-[11px] text-navy-400 text-center mt-1">Order something in</span></Link><Link href="/account/requests" className="group card p-3.5 md:p-5 hover:-translate-y-0.5 transition-transform"><Sparkles size={20} className="mx-auto text-gold-500 mb-2" /><span className="text-xs font-semibold block text-center">Request help</span><span className="hidden md:block text-[11px] text-navy-400 text-center mt-1">We are here for you</span></Link><Link href="/contact" className="group card p-3.5 md:p-5 hover:-translate-y-0.5 transition-transform"><ConciergeBell size={20} className="mx-auto text-gold-500 mb-2" /><span className="text-xs font-semibold block text-center">Concierge</span><span className="hidden md:block text-[11px] text-navy-400 text-center mt-1">Ask us anything</span></Link></div>

      <section className="mb-8"><div className="flex items-end justify-between gap-4 mb-4"><div><span className="eyebrow">Discover Blue Pair</span><h2 className="text-xl md:text-2xl font-semibold mt-1">Everything the hotel has to offer</h2><p className="text-sm text-navy-500 mt-1">Explore the hotel without leaving your guest space.</p></div><Link href="/" className="hidden sm:flex text-sm font-semibold items-center gap-1.5 text-navy-900">Full website <ArrowRight size={14} /></Link></div><div className="grid grid-cols-2 md:grid-cols-3 gap-3">{hotelGuide.map(item => <Link key={item.title} href={item.href} className="group card p-4 md:p-5 hover:-translate-y-0.5 hover:shadow-pop transition-all"><div className="w-10 h-10 rounded-xl bg-gold-500/10 text-gold-600 flex items-center justify-center mb-3"><item.icon size={19} /></div><div className="font-semibold text-sm">{item.title}</div><p className="text-[11px] md:text-xs text-navy-400 leading-relaxed mt-1">{item.text}</p><span className="text-[11px] font-semibold text-navy-800 inline-flex items-center gap-1 mt-3">Explore <ArrowRight size={11} /></span></Link>)}</div></section>

      {bookings.length > 0 && <section className="grid md:grid-cols-2 gap-6"><div><h4 className="font-semibold mb-3 text-sm">Booking history</h4><div className="card divide-y divide-black/5">{bookings.map(b => <div key={b.id} className="px-5 py-4 flex justify-between items-center"><div><b className="text-sm block">{b.room?.name ?? 'Room'}</b><span className="text-xs text-navy-400">{formatDate(b.checkIn)}</span></div><StatusBadge status={b.status} /></div>)}</div></div><div><h4 className="font-semibold mb-3 text-sm">Recent payments</h4><div className="card divide-y divide-black/5">{payments.length === 0 && <div className="px-5 py-4 text-sm text-navy-400">No payments yet.</div>}{payments.map(p => <div key={p.id} className="px-5 py-4 flex justify-between items-center"><div><b className="text-sm block">{p.reference}</b><span className="text-xs text-navy-400">{p.method}</span></div><div className="text-right"><b className="text-sm block">{naira(p.amount)}</b><StatusBadge status={p.status} /></div></div>)}</div></div></section>}

      {hasCheckedIn && <div className="mt-8"><ReviewForm /></div>}
    </div>
  )
}
