'use client'

import Link from 'next/link'

import { ArrowRight, Coffee, Wifi, Waves, Dumbbell, UtensilsCrossed, PartyPopper, Car, MapPin, Users, LogIn, LogOut } from 'lucide-react'

import SectionHeading from '../../components/ui/SectionHeading'
import RoomCard from '../../components/ui/RoomCard'
import InteractiveHotelExperience from '../../components/ui/InteractiveHotelExperience'
import { type RoomType, type Room, type Offer } from '../../data/mock'
import type { GalleryImage } from '../../lib/mappers'

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1572331165267-854da2b10ccc?auto=format&fit=crop&w=1400&q=85',
]

export default function HomeClient({ roomTypes, rooms, offers, gallery, headline, subtitle }: { roomTypes: RoomType[]; rooms: Room[]; offers: Offer[]; gallery: GalleryImage[]; headline?: string; subtitle?: string }) {
  const images = gallery.map(item => item.url).filter(Boolean)

  const heroImage = images[0] || FALLBACK_IMAGES[0] // swap this one image to update the hero everywhere it's used
  const availableCount = (roomTypeId: string) => rooms.filter(room => room.roomTypeId === roomTypeId && room.status === 'available').length

  const heroInfo = [
    { icon: MapPin, label: 'Location', value: 'Uromi, Edo State, Nigeria' },
    { icon: Users, label: 'Guest', value: '2' },
    { icon: LogIn, label: 'Check In', value: '3pm' },
    { icon: LogOut, label: 'Check Out', value: '12pm' },
  ]


  const experienceCards = [
    { title: 'Rooms & Suites', eyebrow: 'Stay', href: '/rooms', image: images[1] || FALLBACK_IMAGES[1], description: 'Refined spaces designed for quiet, comfortable stays.' },
    { title: 'Dining & Lounge', eyebrow: 'Taste', href: '/dining', image: images[2] || FALLBACK_IMAGES[2], description: 'Good food, relaxed evenings and places to gather.' },
    { title: 'Events & Occasions', eyebrow: 'Celebrate', href: '/events', image: images[3] || FALLBACK_IMAGES[3], description: 'Elegant spaces for celebrations, meetings and moments.' },
  ]

  return (
    <div className="bg-cream-50 text-navy-950">

      <header className="relative bg-cream-50 pb-14 pt-6 md:pb-20 md:pt-10">
        <div className="container-w px-5 md:px-10">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="max-w-xl">
              <span className="motion-fade-up eyebrow inline-block" style={{ animationDuration: '550ms' }}>Blue Pair · Uromi</span>
              <h1 className="motion-fade-up mt-4 font-display text-[2.4rem] font-medium leading-[1.05] tracking-[-.02em] text-navy-950 sm:text-5xl md:text-[3.3rem]" style={{ animationDelay: '130ms', animationDuration: '550ms' }}>
                {headline || <>Where Ever You Go, <span className="text-gold-600">Stay Only At Blue Pair.</span></>}
              </h1>
              <p className="motion-fade-up mt-5 max-w-md text-sm leading-6 text-navy-500 md:text-base" style={{ animationDelay: '260ms', animationDuration: '550ms' }}>{subtitle || 'Refined rooms, warm hospitality and everything you need for a comfortable stay in Uromi, Edo State.'}</p>
              <div className="motion-fade-up mt-7 flex flex-wrap gap-3" style={{ animationDelay: '380ms', animationDuration: '550ms' }}>
                
                <Link href="/about" className="btn-outline px-5 py-3.5">Discover Blue Pair</Link>
              </div>

            </div>

            <div className="motion-fade-up relative aspect-[4/3.5] overflow-hidden rounded-xl bg-navy-950 shadow-pop" style={{ animationDelay: '480ms', animationDuration: '550ms' }}>
              <img src={heroImage} alt="Blue Pair Hotel in Uromi, Edo State" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          </div>
        

        <div className="container-w px-5 md:px-1">
          <div className="motion-fade-up relative z-10 -mt-5 flex flex-wrap items-center gap-x-5 gap-y-4 rounded-2xl border border-black/5 bg-white px-4 py-4 shadow-pop md:-mt-7 md:gap-x-8 md:px-8 md:py-5" style={{ animationDelay: '620ms', animationDuration: '550ms' }}>
            {heroInfo.map(({ icon: Icon, label, value }, i) => (
              <div key={label} className={`motion-fade-up flex items-center gap-2.5 ${i > 0 ? 'border-l border-black/5 pl-5 md:pl-8' : ''}`} style={{ animationDelay: `${740 + i * 70}ms`, animationDuration: '550ms' }}>
                <Icon size={17} className="shrink-0 text-gold-600" />
                <div className="leading-tight">
                  <span className="block text-[9px] font-semibold uppercase tracking-wider text-navy-400">{label}</span>
                  <span className="block text-xs font-semibold text-navy-950 md:text-sm">{value}</span>
                </div>
              </div>
            ))}
            <Link href="/rooms" className="motion-fade-up btn-gold ml-auto shrink-0" style={{ animationDelay: '980ms', animationDuration: '550ms' }}>Book Now</Link>
          </div>
        </div>

        </div>

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
                <img loading="lazy" decoding="async" src={card.image} alt={card.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/35 to-transparent" />
                <div className="absolute inset-x-5 bottom-5"><span className="text-[9px] font-semibold uppercase tracking-[.18em] text-gold-300">{card.eyebrow}</span><h3 className="mt-1 font-display text-2xl font-medium">{card.title}</h3><p className="mt-1 max-w-xs text-xs leading-5 text-white/60">{card.description}</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold">Explore <ArrowRight size={13} /></span></div>
              </Link>)}
            </div>
          </div>
        </section>

        <section className="pb-16 md:pb-20">
          <div className="container-w">
            <div className="relative overflow-hidden rounded-2xl bg-navy-950 text-white">
              <img loading="lazy" decoding="async" src={images[4] || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1800&q=85'} alt="Blue Pair Hotel experience" className="absolute inset-0 h-full w-full object-cover opacity-55" />
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
            <div className="grid gap-6 md:grid-cols-3">{roomTypes.slice(0, 3).map(room => <RoomCard key={room.id} room={room} availableCount={availableCount(room.id)} showRoomCount />)}</div>
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
            <div className="relative min-h-[380px] overflow-hidden rounded-2xl"><img loading="lazy" decoding="async" src={FALLBACK_IMAGES[0]} alt="Blue Pair Hotel exterior" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-transparent to-transparent" /><div className="absolute bottom-5 left-5 right-5 rounded-xl border border-white/10 bg-navy-950/80 p-5 text-white backdrop-blur-md"><span className="eyebrow text-gold-300">The Blue Pair signature</span><h2 className="mt-2 font-display text-3xl font-medium">A stay that feels considered.</h2></div></div>
            <div><span className="eyebrow">Made for your stay</span><h2 className="mt-3 font-display text-3xl font-medium md:text-5xl">Comfort, character and thoughtful hospitality.</h2><p className="mt-5 max-w-xl text-sm leading-7 text-navy-600 md:text-base">From restful rooms to memorable evenings, Blue Pair brings the essentials of a refined hotel experience together under one roof.</p><Link href="/about" className="btn-outline mt-7 px-5 py-3">Discover our story <ArrowRight size={15} /></Link></div>
          </div>
        </section>
      </main>
    </div>
  )
}
