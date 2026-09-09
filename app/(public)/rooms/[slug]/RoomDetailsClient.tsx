'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Users, BedDouble, Ruler, Star, CheckCircle2, Calendar } from 'lucide-react'
import { naira } from '../../../../lib/format'
import RoomCard from '../../../../components/ui/RoomCard'
import type { RoomType } from '../../../../data/mock'

export default function RoomDetailsClient({ room, others }: { room: RoomType; others: RoomType[] }) {
  const router = useRouter()
  const [checkIn, setCheckIn] = useState('2026-08-14')
  const [checkOut, setCheckOut] = useState('2026-08-16')
  const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
  const subtotal = room.price * nights
  const tax = Math.round(subtotal * 0.075)
  const total = subtotal + tax

  return (
    <div>
      <div className="container-w px-6 md:px-10 pt-6">
        <div className="text-xs text-navy-400 mb-4">Home / Rooms &amp; Suites / {room.name}</div>
        <div className="grid grid-cols-1 md:grid-cols-[1.6fr,1fr] gap-2.5 h-[440px] rounded-xl2 overflow-hidden">
          <img src={room.images[0]} alt={room.name} className="w-full h-full object-cover" />
          <div className="hidden md:grid grid-rows-2 gap-2.5">
            <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=700&q=80" alt={`${room.name} bathroom, Blue Pair Hotel`} className="w-full h-full object-cover" />
            <div className="relative">
              <img src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=700&q=80" alt={`${room.name} interior, Blue Pair Hotel`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-navy-950/55 flex items-center justify-center text-white text-sm font-semibold">+6 photos</div>
            </div>
          </div>
        </div>
      </div>

      <section className="section pb-24">
        <div className="container-w grid lg:grid-cols-[1.6fr,1fr] gap-14 items-start">
          <div>
            <span className="eyebrow">{room.category}</span>
            <div className="flex justify-between items-start mt-2 gap-4 flex-wrap">
              <h1 className="text-3xl md:text-4xl font-semibold">{room.name}</h1>
              <div className="flex items-center gap-1 text-gold-500 text-sm whitespace-nowrap">
                {'★★★★★'.split('').map((s,i)=><Star key={i} size={14} fill="currentColor" />)}
                <span className="text-navy-400 ml-1.5">(186 reviews)</span>
              </div>
            </div>
            <p className="text-navy-500 mt-4 leading-relaxed max-w-xl">{room.description}</p>

            <div className="flex flex-wrap gap-8 py-6 mt-6 border-y border-black/10">
              <div className="flex items-center gap-2.5"><Users size={18} className="text-gold-500" /><div><b className="block text-sm">{room.guests} guests</b><span className="text-xs text-navy-400">Max occupancy</span></div></div>
              <div className="flex items-center gap-2.5"><BedDouble size={18} className="text-gold-500" /><div><b className="block text-sm">{room.bedType}</b><span className="text-xs text-navy-400">Bed configuration</span></div></div>
              <div className="flex items-center gap-2.5"><Ruler size={18} className="text-gold-500" /><div><b className="block text-sm">{room.sizeSqm} m²</b><span className="text-xs text-navy-400">Room size</span></div></div>
            </div>

            <h4 className="text-lg font-semibold mt-8 mb-4">Amenities</h4>
            <div className="grid sm:grid-cols-2 gap-3">
              {room.amenities.map(a => <div key={a} className="flex items-center gap-2.5 text-sm text-navy-700"><CheckCircle2 size={16} className="text-gold-500" />{a}</div>)}
            </div>

            <h4 className="text-lg font-semibold mt-10 mb-2">Check-in / check-out</h4>
            <p className="text-sm text-navy-500">Check-in from 2:00 PM · Check-out by 12:00 PM. Early check-in and late check-out available on request.</p>
          </div>

          <aside className="card p-6 sticky top-24">
            <div className="flex items-baseline gap-2"><b className="font-display text-2xl">{naira(room.price)}</b><span className="text-xs text-navy-400">/ night before taxes</span></div>
            <div className="h-px bg-black/10 my-5" />
            <label className="field-label flex items-center gap-1.5"><Calendar size={13}/>Check-in</label>
            <input type="date" value={checkIn} onChange={e=>setCheckIn(e.target.value)} className="field-input mb-4" />
            <label className="field-label flex items-center gap-1.5"><Calendar size={13}/>Check-out</label>
            <input type="date" value={checkOut} onChange={e=>setCheckOut(e.target.value)} className="field-input mb-4" />
            <label className="field-label">Guests</label>
            <select className="field-input">{Array.from({length: room.guests}, (_,i)=>i+1).map(n=><option key={n}>{n} guest{n>1?'s':''}</option>)}</select>
            <button onClick={() => router.push(`/booking?room=${room.slug}&checkin=${checkIn}&checkout=${checkOut}`)} className="btn-primary w-full justify-center mt-5">Reserve this room</button>
            <p className="text-[11px] text-navy-400 text-center mt-2.5">You won't be charged yet</p>
            <div className="h-px bg-black/10 my-5" />
            <div className="flex justify-between text-sm text-navy-500 py-1.5"><span>{naira(room.price)} × {nights} nights</span><span>{naira(subtotal)}</span></div>
            <div className="flex justify-between text-sm text-navy-500 py-1.5"><span>Taxes &amp; fees</span><span>{naira(tax)}</span></div>
            <div className="flex justify-between text-base font-semibold pt-3 mt-2 border-t border-black/10"><span>Total</span><b className="font-display text-lg">{naira(total)}</b></div>
          </aside>
        </div>

        <h4 className="text-xl font-semibold mt-20 mb-6">Similar rooms</h4>
        <div className="grid md:grid-cols-3 gap-6">
          {others.map(r => <RoomCard key={r.id} room={r} />)}
        </div>
      </section>
    </div>
  )
}
