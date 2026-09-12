'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Calendar, Users, BedDouble, ArrowRight, Wifi, Waves, Dumbbell, UtensilsCrossed, PartyPopper, Car } from 'lucide-react'
import SectionHeading from '../../components/ui/SectionHeading'
import RoomCard from '../../components/ui/RoomCard'
import { type RoomType, type Offer } from '../../data/mock'
import type { GalleryImage } from '../../lib/mappers'
import { todayISO, addDaysISO } from '../../lib/format'

export default function HomeClient({ roomTypes, offers, gallery, headline, subtitle }: { roomTypes: RoomType[]; offers: Offer[]; gallery: GalleryImage[]; headline?: string; subtitle?: string }) {
  const router = useRouter()
  const [checkIn, setCheckIn] = useState(todayISO())
  const [checkOut, setCheckOut] = useState(addDaysISO(2))

  return (
    <div>
      <header className="relative h-[92vh] min-h-[640px] text-white flex items-end">
        <div className="absolute inset-0 bg-hero" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1800&q=80')" }} role="img" aria-label="Blue Pair Hotel, Uromi, Edo State" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/25 to-navy-950/10" />
        <div className="relative z-10 container-w px-6 md:px-10 pb-16 w-full">
          <div className="flex items-center gap-2.5 text-[11px] tracking-[0.16em] uppercase font-bold text-gold-300 mb-5">
            <span className="w-9 h-px bg-gold-300" />Uromi, Edo State — Est. 2014
          </div>
          <h1 className="text-4xl md:text-6xl font-semibold leading-[1.05] max-w-2xl">
            {headline || <>Premium hospitality, <em className="italic text-gold-300 font-medium">the Blue Pair way</em>.</>}
          </h1>
          <p className="mt-5 max-w-md text-white/80 text-[15.5px] leading-relaxed">
            {subtitle || "Sixty rooms and suites, a resident restaurant and bar, an indoor pool, and a private Annex for extended stays — Edo State's most complete luxury address, right here in Uromi."}
          </p>
          <div className="flex gap-3 mt-8">
            <Link href="/booking" className="btn-gold">Book a room</Link>
            <Link href="/about" className="btn-ghost-light">Explore the hotel</Link>
          </div>
        </div>
      </header>

      <div className="container-w px-6 md:px-10 relative z-20 -mt-12">
        <div className="card p-5 md:p-6 grid md:grid-cols-5 gap-4 md:gap-0">
          <div className="md:px-5 md:border-r border-black/10">
            <label className="field-label flex items-center gap-1.5"><Calendar size={13} /> Check-in</label>
            <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="field-input" />
          </div>
          <div className="md:px-5 md:border-r border-black/10">
            <label className="field-label flex items-center gap-1.5"><Calendar size={13} /> Check-out</label>
            <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="field-input" />
          </div>
          <div className="md:px-5 md:border-r border-black/10">
            <label className="field-label flex items-center gap-1.5"><Users size={13} /> Guests</label>
            <select className="field-input"><option>2 adults, 0 children</option><option>1 adult</option><option>2 adults, 2 children</option></select>
          </div>
          <div className="md:px-5">
            <label className="field-label flex items-center gap-1.5"><BedDouble size={13} /> Room type</label>
            <select className="field-input"><option>Any room</option>{roomTypes.map(r => <option key={r.id}>{r.name}</option>)}</select>
          </div>
          <div className="md:pl-5 flex items-end">
            <button onClick={() => router.push(`/rooms?checkin=${checkIn}&checkout=${checkOut}`)} className="btn-primary w-full justify-center">Search availability</button>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="container-w">
          <div className="flex justify-between items-end mb-10 flex-wrap gap-4">
            <SectionHeading eyebrow="Featured stays" title="Rooms guests choose most" />
            <Link href="/rooms" className="text-sm font-semibold flex items-center gap-1.5 text-navy-900">View all rooms →</Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {roomTypes.slice(0, 3).map(r => <RoomCard key={r.id} room={r} />)}
          </div>
        </div>
      </section>

      <section className="section bg-navy-950 text-white">
        <div className="container-w">
          <SectionHeading eyebrow="On the property" title="Everything a Uromi stay needs" light center
            subtitle="From sunrise laps in the indoor pool to late dinners at the Blue Pair Restaurant." />
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { icon: Waves, name: 'Indoor Pool', to: '/pool' },
              { icon: Dumbbell, name: 'Fitness Gym', to: '/gym' },
              { icon: UtensilsCrossed, name: 'Blue Pair Restaurant', to: '/dining' },
              { icon: PartyPopper, name: 'The Club', to: '/club' },
              { icon: Wifi, name: 'VIP Lounge', to: '/vip-lounge' },
              { icon: Car, name: 'VIP Parking', to: '/parking' },
            ].map(a => (
              <Link href={a.to} key={a.name} className="bg-white/5 border border-white/10 rounded-xl2 p-6 hover:bg-white/10 transition-colors">
                <div className="w-11 h-11 rounded-full bg-gold-500/15 text-gold-300 flex items-center justify-center mb-4"><a.icon size={19} /></div>
                <div className="font-semibold text-[15px]">{a.name}</div>
                <div className="text-white/40 text-xs mt-1 flex items-center gap-1">Explore <ArrowRight size={12} /></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-w grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative h-[440px] rounded-xl2 overflow-hidden">
            <img src="https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1000&q=80" alt="Blue Pair Hotel exterior, Uromi, Edo State" className="w-full h-full object-cover" />
            <div className="absolute bottom-5 left-5 bg-navy-950/90 backdrop-blur text-white rounded-xl2 px-6 py-5 flex gap-7">
              <div><b className="font-display text-2xl block">60</b><span className="text-[11px] text-white/60 uppercase">Rooms &amp; suites</span></div>
              <div><b className="font-display text-2xl block">12</b><span className="text-[11px] text-white/60 uppercase">Years in Uromi</span></div>
              <div><b className="font-display text-2xl block">4.8</b><span className="text-[11px] text-white/60 uppercase">Guest rating</span></div>
            </div>
          </div>
          <div>
            <span className="eyebrow">Blue Pair Signature</span>
            <h2 className="text-3xl md:text-4xl font-semibold mt-3 mb-5">A homegrown luxury brand, built for Edo State</h2>
            <p className="text-navy-500 text-[15px] leading-relaxed">Blue Pair Hotel opened its doors in Uromi with one goal — to bring genuinely world-class hospitality to Esan North-East. Every room, every plate at the restaurant, and every event on the Club terrace is built around that promise.</p>
            <Link href="/about" className="btn-outline mt-7">Our story</Link>
          </div>
        </div>
      </section>

      <section className="section bg-cream-100">
        <div className="container-w">
          <SectionHeading eyebrow="Limited-time" title="Current offers" />
          <div className="grid md:grid-cols-3 gap-6">
            {offers.map(o => (
              <div key={o.id} className="card p-6 flex flex-col gap-3">
                <span className="pill-gold w-fit">{o.discount}</span>
                <h4 className="text-lg font-semibold">{o.title}</h4>
                <p className="text-sm text-navy-500">{o.description}</p>
                <Link href="/offers" className="text-sm font-semibold text-navy-900 mt-2 flex items-center gap-1">See details <ArrowRight size={13} /></Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-w">
          <div className="flex justify-between items-end mb-10 flex-wrap gap-4">
            <SectionHeading eyebrow="Gallery" title="A closer look" />
            <Link href="/gallery" className="text-sm font-semibold flex items-center gap-1.5 text-navy-900">Full gallery <ArrowRight size={14} /></Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {gallery.slice(0, 8).map((g, i) => (
              <div key={g.id} className={'rounded-xl2 overflow-hidden ' + (i === 0 ? 'col-span-2 row-span-2 h-full' : 'h-40')}>
                <img src={g.url} alt={g.caption || 'Blue Pair Hotel, Uromi, Edo State'} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-cream-100">
        <div className="container-w grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <span className="eyebrow">Find us</span>
            <h2 className="text-3xl font-semibold mt-3 mb-4">Auchi Road, Uromi, Edo State</h2>
            <p className="text-navy-500 text-sm leading-relaxed max-w-md">Set in the heart of Uromi, a short drive from Ekpoma and Auchi, with VIP parking and airport pickup available from Benin Airport.</p>
            <div className="flex gap-8 mt-6">
              <div><span className="eyebrow block mb-1">Phone</span><span className="text-sm font-semibold">+234 901 234 5678</span></div>
              <div><span className="eyebrow block mb-1">Email</span><span className="text-sm font-semibold">reservations@bluepairhotel.com</span></div>
            </div>
            <Link href="/contact" className="btn-outline mt-7">Get directions</Link>
          </div>
          <div className="h-96 rounded-xl2 bg-navy-100 flex items-center justify-center relative overflow-hidden border border-black/5">
            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, #22346e33 0, transparent 40%), radial-gradient(circle at 70% 70%, #C79A3E33 0, transparent 40%)' }} />
            <div className="w-14 h-14 rounded-full bg-navy-900 flex items-center justify-center relative z-10 shadow-pop"><span className="w-3 h-3 bg-gold-400 rounded-full" /></div>
          </div>
        </div>
      </section>
    </div>
  )
}
