'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, BedDouble, CalendarDays, MapPin, PartyPopper, UtensilsCrossed, Waves } from 'lucide-react'
import type { GalleryImage } from '../../lib/mappers'

type Experience = {
  id: string
  eyebrow: string
  title: string
  description: string
  href: string
  icon: typeof BedDouble
  image: string
  position: string
}

export default function InteractiveHotelExperience({ gallery }: { gallery: GalleryImage[] }) {
  const images = useMemo(() => gallery.map(item => item.url).filter(Boolean), [gallery])
  const fallback = 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1800&q=85'
  const poolImage = images[2] || 'https://images.unsplash.com/photo-1572331165267-854da2b10ccc?auto=format&fit=crop&w=1200&q=85'
  const diningImage = images[3] || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=85'
  const roomImage = images[1] || fallback
  const eventsImage = images[4] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=85'

  const experiences: Experience[] = [
    { id: 'rooms', eyebrow: 'Stay', title: 'Rooms & suites', description: 'Find your room, choose your dates and see what is actually available before you reserve.', href: '/rooms', icon: BedDouble, image: roomImage, position: 'left-[23%] top-[38%]' },
    { id: 'dining', eyebrow: 'Taste', title: 'Blue Pair Restaurant', description: 'Explore dining, menus and the spaces made for relaxed meals and evenings.', href: '/dining', icon: UtensilsCrossed, image: diningImage, position: 'left-[68%] top-[29%]' },
    { id: 'pool', eyebrow: 'Unwind', title: 'Indoor pool', description: 'Take a quieter look around one of the places guests come to slow down.', href: '/pool', icon: Waves, image: poolImage, position: 'left-[62%] top-[70%]' },
    { id: 'events', eyebrow: 'Celebrate', title: 'Events & occasions', description: 'Discover spaces for celebrations, meetings and nights worth remembering.', href: '/events', icon: PartyPopper, image: eventsImage, position: 'left-[31%] top-[69%]' },
  ]

  const [activeId, setActiveId] = useState('rooms')
  const active = experiences.find(item => item.id === activeId) || experiences[0]

  return (
    <section className="section overflow-hidden bg-navy-950 text-white" aria-labelledby="hotel-explorer-title">
      <div className="container-w">
        <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_.98fr] lg:gap-16">
          <div>
            <span className="eyebrow text-gold-300">Explore Blue Pair</span>
            <h2 id="hotel-explorer-title" className="mt-3 max-w-xl text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">Don’t just browse the hotel. <em className="font-medium italic text-gold-300">Explore it.</em></h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/60 md:text-base">Move through the property and discover the places that make a Blue Pair stay feel complete. Every point opens the real destination behind it.</p>

            <div className="mt-8 grid gap-2 sm:grid-cols-2">
              {experiences.map(item => {
                const Icon = item.icon
                const selected = item.id === activeId
                return (
                  <button key={item.id} type="button" onClick={() => setActiveId(item.id)} aria-pressed={selected} className={`group rounded-2xl border p-4 text-left transition-all duration-300 ${selected ? 'border-gold-300/60 bg-white/10 shadow-[0_18px_55px_rgba(0,0,0,.18)]' : 'border-white/10 bg-white/[.035] hover:border-white/20 hover:bg-white/[.07]'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors ${selected ? 'bg-gold-400 text-navy-950' : 'bg-white/10 text-gold-300'}`}><Icon size={18} /></span>
                      <span className="min-w-0"><span className="block text-[10px] font-semibold uppercase tracking-[.16em] text-white/40">{item.eyebrow}</span><span className="mt-1 block truncate text-sm font-semibold text-white">{item.title}</span></span>
                      <ArrowRight size={15} className={`ml-auto shrink-0 transition-transform ${selected ? 'translate-x-0 text-gold-300' : '-translate-x-1 text-white/30 group-hover:translate-x-0'}`} />
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-7 rounded-2xl border border-white/10 bg-white/[.04] p-5 backdrop-blur-sm sm:p-6">
              <span className="text-[10px] font-semibold uppercase tracking-[.18em] text-gold-300">{active.eyebrow}</span>
              <h3 className="mt-2 text-xl font-semibold">{active.title}</h3>
              <p className="mt-2 max-w-lg text-sm leading-6 text-white/55">{active.description}</p>
              <Link href={active.href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-gold-300">Explore {active.title} <ArrowRight size={15} /></Link>
            </div>
          </div>

          <div className="relative min-h-[500px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a1730] shadow-2xl">
            <img src={active.image} alt={active.title} className="absolute inset-0 h-full w-full object-cover opacity-55 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/20 to-navy-950/5" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(199,154,62,.12),transparent_42%)]" />

            <div className="absolute left-5 top-5 z-10 flex items-center gap-2 rounded-full border border-white/15 bg-navy-950/55 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[.15em] text-white/75 backdrop-blur-xl"><MapPin size={13} className="text-gold-300" /> Blue Pair · Uromi</div>

            <div className="absolute inset-0 z-10">
              {experiences.map(item => {
                const Icon = item.icon
                const selected = item.id === activeId
                return (
                  <button key={item.id} type="button" onClick={() => setActiveId(item.id)} className={`absolute ${item.position} -translate-x-1/2 -translate-y-1/2 transition-all duration-300`} aria-label={`Explore ${item.title}`}>
                    <span className={`relative grid h-11 w-11 place-items-center rounded-full border shadow-xl transition-all ${selected ? 'scale-110 border-gold-200 bg-gold-300 text-navy-950' : 'border-white/60 bg-navy-950/75 text-white hover:scale-110 hover:border-gold-300 hover:text-gold-300'}`}>
                      <Icon size={17} />
                      {selected && <span className="absolute inset-[-7px] animate-ping rounded-full border border-gold-300/35" />}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="absolute inset-x-5 bottom-5 z-20 rounded-2xl border border-white/10 bg-navy-950/75 p-5 backdrop-blur-xl sm:inset-x-6 sm:bottom-6">
              <div className="flex items-end justify-between gap-4">
                <div><span className="text-[10px] font-semibold uppercase tracking-[.18em] text-gold-300">Selected destination</span><h3 className="mt-1 text-xl font-semibold">{active.title}</h3></div>
                <Link href={active.href} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-navy-950 transition-transform hover:scale-105" aria-label={`Open ${active.title}`}><ArrowRight size={17} /></Link>
              </div>
              <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-4 text-[10px] uppercase tracking-[.12em] text-white/35"><CalendarDays size={13} className="text-gold-300" /> Choose dates when you are ready to check real availability</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
