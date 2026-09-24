'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, CheckCircle2, Loader2, Users, BedDouble, Ruler, Clock3 } from 'lucide-react'
import { naira, todayISO, addDaysISO } from '../../../../../lib/format'
import { useAuth } from '../../../../../lib/useAuth'
import AvailabilityCalendar from '../../../../../components/booking/AvailabilityCalendar'
import type { RoomType } from '../../../../../data/mock'
import { onAvailabilityChange } from '../../../../../lib/availabilityRealtime'
import ImageCarousel from '../../../../../components/ui/ImageCarousel'
// A physical room carries no photos of its own — every room of this type shows the same, type-level gallery.
type Unit = { id:string; room_number:string; name?:string|null; slug:string; floor?:string; status:string }
type GuestStatus = 'available'|'availableSoon'|'taken'|'held'|'reserved'
function RoomGallery({ images, name }: { images:string[]; name:string }) {
 if (images.length === 0) return null
 // A slow, hands-off cross-fade — every room of this type shares the same gallery, so there is nothing to click through.
 return <ImageCarousel images={images} alt={name} className="h-[360px] sm:h-[420px] md:h-[500px] rounded-[1.25rem] md:rounded-[1.5rem] border border-gold-500/15 bg-navy-950 shadow-pop" autoPlay interval={6000} transition="fade" showArrows={false} showDots={images.length>1} />
}

export default function IndividualRoomClient({ type, unit }: { type: RoomType; unit: Unit }) {
 const router=useRouter(); const params=useSearchParams(); const auth=useAuth(); const [checkIn,setCheckIn]=useState(params.get('checkin')||todayISO()); const [checkOut,setCheckOut]=useState(params.get('checkout')||addDaysISO(1,params.get('checkin')||todayISO())); const [status,setStatus]=useState<GuestStatus|null>(null); const [checking,setChecking]=useState(true); const [error,setError]=useState<string|null>(null)
 const name=unit.name||`Room ${unit.room_number}`; const gallery=useMemo(()=>Array.from(new Set((type.images||[]).filter(Boolean))),[type.images]); const nights=Math.max(1,Math.round((new Date(checkOut).getTime()-new Date(checkIn).getTime())/86400000)); const total=type.price*nights; const tax=Math.round(total*.075)
 useEffect(()=>{if(!checkIn||!checkOut||checkIn>=checkOut){setChecking(false);setStatus(null);return}let cancelled=false;const load=async()=>{if(!cancelled){setChecking(true);setStatus(null)}try{const response=await fetch(`/api/public/availability?checkin=${encodeURIComponent(checkIn)}&checkout=${encodeURIComponent(checkOut)}&roomTypeId=${encodeURIComponent(type.id)}&_=${Date.now()}`,{cache:'no-store'});const data=response.ok?await response.json():null;if(cancelled)return;const current=data?.rooms?.find((r:any)=>r.id===unit.id);setStatus(current?.guest_status||null)}catch{if(!cancelled)setError('Unable to check this room right now.')}finally{if(!cancelled)setChecking(false)}};void load();const stopListening=onAvailabilityChange(()=>void load());return()=>{cancelled=true;stopListening()}},[checkIn,checkOut,type.id,unit.id])
 const updateDates=(ci:string,co:string)=>{
  setCheckIn(ci)
  setCheckOut(co)
  const url=new URL(window.location.href)
  url.searchParams.set('checkin',ci)
  url.searchParams.set('checkout',co)
  window.history.replaceState(window.history.state,'',url.toString())
}
 const bookable=!checking&&status==='available'
 return <div className="container-w min-w-0 max-w-full overflow-x-hidden px-4 sm:px-6 md:px-10 py-8">
  <Link href={`/rooms/${type.slug}?checkin=${encodeURIComponent(checkIn)}&checkout=${encodeURIComponent(checkOut)}`} 
  className="text-xs text-navy-400 hover:text-navy-700">← Back to {type.name}</Link>
  <div className="grid min-w-0 lg:grid-cols-[1.35fr,.65fr] gap-8 mt-5"><div className="min-w-0 max-w-full">

    <RoomGallery images={gallery} name={name}/><span className="eyebrow mt-8 inline-block">{type.category} · Room 
      {unit.room_number}</span><h1 className="text-4xl font-semibold mt-2">{name}</h1><p className="text-xs text-navy-400 mt-2">
        Floor {unit.floor||'—'} · Specific physical room</p>
        <p className="text-navy-500 leading-relaxed mt-4">{type.description}</p>

        <div className="flex flex-wrap gap-8 py-6 my-6 border-y border-black/10"><div className="flex gap-2"><Users size={18} 

        className="text-gold-500"/><b>{type.guests} guests</b></div><div className="flex gap-2"><BedDouble size={18} 
        className="text-gold-500"/><b>{type.bedType}</b></div><div className="flex gap-2"><Ruler size={18} 
        className="text-gold-500"/><b>{type.sizeSqm} m²</b></div></div><AvailabilityCalendar roomId={unit.id} 
        initialCheckIn={checkIn} initialCheckOut={checkOut} onSelect={updateDates}/>

        <h2 className="text-xl font-semibold mt-8 mb-4">Amenities</h2><div className="grid sm:grid-cols-2 gap-3">
          {type.amenities.map(a=><div key={a} className="flex gap-2 text-sm"><CheckCircle2 size={16} 
          className="text-gold-500"/>{a}</div>)}</div></div><aside className="card p-6 h-fit sticky top-24 min-w-0 max-w-full">
           
            <div className="text-xs text-navy-400 mb-2">Room rate</div><b className="font-display text-3xl">{naira(type.price)}
              </b><span className="text-xs text-navy-400"> / night</span><div className="h-px bg-black/10 my-5"/>
             
              <div className="flex justify-between text-sm"><span>{naira(type.price)} × {nights} nights</span><b>
                {naira(total)}</b></div><div className="flex justify-between text-sm mt-2"><span>Taxes & fees</span>
                <b>{naira(tax)}</b></div><div className="flex justify-between font-semibold border-t border-black/10 mt-4 pt-4">
               
                <span>Total</span><b>{naira(total+tax)}</b></div>{bookable&&<Link href={`/booking?room=${type.slug}&unit=$
                {unit.id}&checkin=${encodeURIComponent(checkIn)}&checkout=${encodeURIComponent(checkOut)}`} 
                className="btn-primary w-full justify-center mt-5">Book & pay 
                
                <ArrowRight size={15}/></Link>}
                {!checking&&status==='availableSoon'&&<button type="button" disabled 
                className="w-full justify-center mt-5 rounded-md bg-navy-100 text-navy-400 px-4 py-3 
                text-sm font-semibold cursor-not-allowed">Unavailable for selected dates</button>}
                {!checking&&status==='held'&&<div className="mt-5 rounded-md bg-amber-50 px-3 py-2.5 
                text-xs text-amber-800 flex gap-2"><Clock3 size={15} className="shrink-0 mt-0.5"/>
               
                <span>Another guest is currently completing payment for these dates. Please try again in a few minutes.
                  </span></div>}{!checking&&status==='taken'&&<button type="button" disabled 
                  className="w-full justify-center mt-5 rounded-md bg-navy-100 text-navy-400 px-4 py-3 
                  text-sm font-semibold cursor-not-allowed">Unavailable for selected dates</button>}
                  {!checking&&status==='reserved'&&<Link href="/account/bookings" className="btn-gold 
                  w-full justify-center mt-5">Continue payment <ArrowRight size={15}/></Link>}
                  {checking&&<div className="mt-5 text-center text-xs text-navy-400"><Loader2 size={14} 
                  className="inline animate-spin mr-1"/>Checking dates…</div>}{error&&
                  <div className="mt-3 rounded-md bg-red-50 px-3 py-2.5 text-xs text-red-700">{error}
                  </div>}
                  </aside>
                  </div>
                  </div>
}
