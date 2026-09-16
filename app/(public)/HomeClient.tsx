'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight, Calendar, Coffee, Users, Wifi, Waves, Dumbbell, UtensilsCrossed, PartyPopper, Car, Minus, Plus } from 'lucide-react'
import SectionHeading from '../../components/ui/SectionHeading'
import RoomCard from '../../components/ui/RoomCard'
import InteractiveHotelExperience from '../../components/ui/InteractiveHotelExperience'
import { type RoomType, type Room, type Offer } from '../../data/mock'
import type { GalleryImage } from '../../lib/mappers'
import { todayISO, addDaysISO } from '../../lib/format'

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1572331165267-854da2b10ccc?auto=format&fit=crop&w=1400&q=85',
]

export default function HomeClient({ roomTypes, rooms, offers, gallery, headline, subtitle }: { roomTypes: RoomType[]; rooms: Room[]; offers: Offer[]; gallery: GalleryImage[]; headline?: string; subtitle?: string }) {
  const router = useRouter()
  const [checkIn, setCheckIn] = useState(todayISO())
  const [checkOut, setCheckOut] = useState(addDaysISO(2))
  const [adults, setAdults] = useState(2)
  const [showOccupancy, setShowOccupancy] = useState(false)
  const [selectedRoomId, setSelectedRoomId] = useState(roomTypes[0]?.id || '')

  const images = gallery.map(item => item.url).filter(Boolean)
  const heroImage = images[0] || FALLBACK_IMAGES[0]
  const selectedRoom = roomTypes.find(room => room.id === selectedRoomId) || roomTypes[0]
  const availableCount = (roomTypeId: string) => rooms.filter(room => room.roomTypeId === roomTypeId && room.status === 'available').length
  const displayDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
  const displayWeekday = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString('en-NG', { weekday: 'long' })
  const openAvailability = () => router.push(`/rooms?checkin=${checkIn}&checkout=${checkOut}&guests=${adults}${selectedRoom ? `&room=${selectedRoom.slug}` : ''}`)

  const experienceCards = [
    { title: 'Rooms & Suites', eyebrow: 'Stay', href: '/rooms', image: images[1] || FALLBACK_IMAGES[1], description: 'Refined spaces designed for quiet, comfortable stays.' },
    { title: 'Dining & Lounge', eyebrow: 'Taste', href: '/dining', image: images[2] || FALLBACK_IMAGES[2], description: 'Good food, relaxed evenings and places to gather.' },
    { title: 'Events & Occasions', eyebrow: 'Celebrate', href: '/events', image: images[3] || FALLBACK_IMAGES[3], description: 'Elegant spaces for celebrations, meetings and moments.' },
  ]

  return (
    <div className="bg-cream-50 text-navy-950">
      <header className="relative isolate min-h-[620px] overflow-hidden bg-navy-950 text-white md:min-h-[700px]">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${heroImage}')` }} role="img" aria-label="Blue Pair Hotel & Suites in Uromi, Edo State" />
        <div className="absolute inset-0 bg-navy-950/45" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950/85 via-navy-950/45 to-navy-950/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-navy-950/30" />

        <div className="relative z-10 container-w flex min-h-[620px] items-center px-5 pb-28 pt-28 md:min-h-[700px] md:px-10 md:pb-36">
          <div className="max-w-2xl">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[.2em] text-white/85 backdrop-blur-md">Blue Pair · Uromi</span>
            <h1 className="max-w-2xl font-display text-[2.7rem] font-medium leading-[1.02] tracking-[-.035em] sm:text-5xl md:text-6xl lg:text-[4.8rem]">
              {headline || <>A refined stay, <em className="italic text-gold-300">thoughtfully made for you.</em></>}
            </h1>
            {subtitle && <p className="mt-5 max-w-lg text-sm leading-6 text-white/70 md:text-base">{subtitle}</p>}
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/rooms" className="btn-gold px-5 py-3.5">Explore rooms <ArrowRight size={15} /></Link>
              <Link href="/about" className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-5 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/15">Discover Blue Pair</Link>
            </div>
          </div>
        </div>

        <section className="absolute inset-x-0 bottom-0 z-20 px-3 sm:px-5 md:px-10" aria-labelledby="stay-planner-title">
          <div className="container-w rounded-t-[1.5rem] border border-white/10 bg-navy-950/90 shadow-2xl backdrop-blur-xl">
            <div className="grid gap-3 p-4 sm:p-5 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end md:p-6">
              <label className="relative min-w-0 cursor-pointer rounded-xl border border-white/10 bg-white/[.06] px-4 py-3 transition-colors hover:border-gold-300/50">
                <span className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[.14em] text-white/45"><Calendar size={14} className="text-gold-300" /> Check-in</span>
                <strong className="mt-1.5 block truncate text-sm text-white">{displayDate(checkIn)}</strong>
                <span className="mt-0.5 block truncate text-[10px] text-white/35">{displayWeekday(checkIn)} · 2:00 PM</span>
                <input aria-label="Check-in date" type="date" min={todayISO()} value={checkIn} onChange={event => { setCheckIn(event.target.value); if (event.target.value >= checkOut) setCheckOut(addDaysISO(1, event.target.value)) }} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
              </label>
              <label className="relative min-w-0 cursor-pointer rounded-xl border border-white/10 bg-white/[.06] px-4 py-3 transition-colors hover:border-gold-300/50">
                <span className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[.14em] text-white/45"><Calendar size={14} className="text-gold-300" /> Check-out</span>
                <strong className="mt-1.5 block truncate text-sm text-white">{displayDate(checkOut)}</strong>
                <span className="mt-0.5 block truncate text-[10px] text-white/35">{displayWeekday(checkOut)} · 11:00 AM</span>
                <input aria-label="Check-out date" type="date" min={addDaysISO(1, checkIn)} value={checkOut} onChange={event => setCheckOut(event.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
              </label>
              <div className="rounded-xl border border-white/10 bg-white/[.06] px-4 py-3">
                <div className="flex items-center gap-3">
                  <Users size={15} className="text-gold-300" />
                  <div className="min-w-0 flex-1"><span className="block text-[9px] font-semibold uppercase tracking-[.14em] text-white/45">Guests</span><strong className="mt-1 block truncate text-sm text-white">{adults} {adults === 1 ? 'Adult' : 'Adults'}</strong></div>
                  <button type="button" onClick={() => setShowOccupancy(value => !value)} className="text-[10px] font-semibold text-gold-300">Change</button>
                </div>
                {showOccupancy && <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3"><span className="text-xs text-white/55">Adults</span><div className="flex items-center gap-2"><button type="button" onClick={() => setAdults(value => Math.max(1, value - 1))} className="grid h-7 w-7 place-items-center rounded-full border border-white/15 text-white" aria-label="Remove one adult"><Minus size={12} /></button><strong className="w-5 text-center text-xs text-white">{adults}</strong><button type="button" onClick={() => setAdults(value => Math.min(selectedRoom?.guests || 8, value + 1))} className="grid h-7 w-7 place-items-center rounded-full border border-white/15 text-white" aria-label="Add one adult"><Plus size={12} /></button></div></div>}
              </div>
              <button type="button" onClick={openAvailability} className="btn-gold min-h-[62px] justify-center rounded-xl px-6 text-xs uppercase tracking-[.08em] md:min-w-[170px]">Check availability <ArrowRight size={16} /></button>
            </div>
          </div>
        </section>
      </header>

      <main>
        <section className="section pt-16 md:pt-20">
          <div className="container-w">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div><span className="eyebrow">Explore Blue Pair</span><h2 className="mt-2 font-display text-3xl font-medium md:text-4xl">Everything you came for.</h2></div>
              <Link href="/about" className="hidden items-center gap-1.5 text-sm font-semibold text-navy-800 sm:flex">View all <ArrowRight size={14} /></Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {experienceCards.map(card => <Link href={card.href} key={card.title} className="group relative min-h-[330px] overflow-hidden rounded-2xl border border-navy-900/10 bg-navy-950 text-white shadow-sm">
                <img src={card.image} alt={card.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/35 to-transparent" />
                <div className="absolute inset-x-5 bottom-5"><span className="text-[9px] font-semibold uppercase tracking-[.18em] text-gold-300">{card.eyebrow}</span><h3 className="mt-1 font-display text-2xl font-medium">{card.title}</h3><p className="mt-1 max-w-xs text-xs leading-5 text-white/60">{card.description}</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold">Explore <ArrowRight size={13} /></span></div>
              </Link>)}
            </div>
          </div>
        </section>

        <section className="pb-16 md:pb-20">
          <div className="container-w">
            <div className="relative overflow-hidden rounded-2xl bg-navy-950 text-white">
              <img src={images[4] || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1800&q=85'} alt="Blue Pair Hotel experience" className="absolute inset-0 h-full w-full object-cover opacity-55" />
              <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/65 to-transparent" />
              <div className="relative min-h-[280px] px-6 py-10 md:min-h-[320px] md:px-12 md:py-14">
                <div className="max-w-xl"><span className="eyebrow text-gold-300">Your stay, your way</span><h2 className="mt-3 max-w-lg font-display text-3xl font-medium leading-tight md:text-5xl">Make your time at Blue Pair feel effortless.</h2><p className="mt-4 max-w-md text-sm leading-6 text-white/60">Stay, dine, unwind, celebrate and explore — with everything you need in one place.</p><Link href="/rooms" className="btn-gold mt-6 px-5 py-3">Plan your stay <ArrowRight size={15} /></Link></div>
              </div>
            </div>
          </div>
        </section>

        <InteractiveHotelExperience gallery={gallery} />

        <section className="section">
          <div className="container-w">
            <div className="mb-10 flex items-end justify-between gap-4"><SectionHeading eyebrow="Featured stays" title="Rooms & suites" /><Link href="/rooms" className="hidden items-center gap-1.5 text-sm font-semibold text-navy-900 sm:flex">View all rooms <ArrowRight size={14} /></Link></div>
            <div className="grid gap-6 md:grid-cols-3">{roomTypes.slice(0, 3).map(room => <RoomCard key={room.id} room={room} availableCount={availableCount(room.id)} />)}</div>
          </div>
        </section>

        <section className="section bg-navy-950 text-white">
          <div className="container-w">
            <SectionHeading eyebrow="On the property" title="More to enjoy at Blue Pair" light center subtitle="Thoughtful spaces, good food and experiences made for your stay." />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {[{ icon: Waves, name: 'Indoor Pool', to: '/pool' }, { icon: Dumbbell, name: 'Fitness Gym', to: '/gym' }, { icon: UtensilsCrossed, name: 'Blue Pair Restaurant', to: '/dining' }, { icon: PartyPopper, name: 'The Club', to: '/club' }, { icon: Wifi, name: 'VIP Lounge', to: '/vip-lounge' }, { icon: Car, name: 'VIP Parking', to: '/parking' }].map(item => <Link href={item.to} key={item.name} className="group rounded-xl border border-white/10 bg-white/[.04] p-5 transition-colors hover:bg-white/[.08]"><div className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-gold-500/15 text-gold-300"><item.icon size={18} /></div><div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold">{item.name}</span><ArrowRight size={14} className="text-white/30 transition-transform group-hover:translate-x-1 group-hover:text-gold-300" /></div></Link>)}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container-w grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
            <div className="relative min-h-[380px] overflow-hidden rounded-2xl"><img src={FALLBACK_IMAGES[0]} alt="Blue Pair Hotel exterior" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-transparent to-transparent" /><div className="absolute bottom-5 left-5 right-5 rounded-xl border border-white/10 bg-navy-950/80 p-5 text-white backdrop-blur-md"><span className="eyebrow text-gold-300">The Blue Pair signature</span><h2 className="mt-2 font-display text-3xl font-medium">A stay that feels considered.</h2></div></div>
            <div><span className="eyebrow">Made for your stay</span><h2 className="mt-3 font-display text-3xl font-medium md:text-5xl">Comfort, character and thoughtful hospitality.</h2><p className="mt-5 max-w-xl text-sm leading-7 text-navy-600 md:text-base">From restful rooms to memorable evenings, Blue Pair brings the essentials of a refined hotel experience together under one roof.</p><Link href="/about" className="btn-outline mt-7 px-5 py-3">Discover our story <ArrowRight size={15} /></Link></div>
          </div>
        </section>
      </main>
    </div>
  )
}
