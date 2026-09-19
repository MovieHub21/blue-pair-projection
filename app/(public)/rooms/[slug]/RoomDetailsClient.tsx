'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Users, BedDouble, Ruler, CheckCircle2, ArrowRight } from 'lucide-react'
import { naira, todayISO, addDaysISO } from '../../../../lib/format'
import RoomCard from '../../../../components/ui/RoomCard'
import ImageCarousel from '../../../../components/ui/ImageCarousel'
import type { RoomType } from '../../../../data/mock'

type Unit={id:string;room_number:string;name:string;slug:string;image_url?:string|null;status:string;floor?:string}
type AvailabilityUnit=Unit & {guest_status?:'available'|'availableSoon'|'taken'|'held'|'reserved';available_from?:string|null}

function initialGuestStatus(unit: Unit): AvailabilityUnit['guest_status'] {
 return unit.status === 'available_soon' ? 'availableSoon' : 'available'
}

export default function RoomDetailsClient({room,units,others,availability}:{room:RoomType;units:Unit[];others:RoomType[];availability:Record<string,number>}){
 const params=useSearchParams()
 const [checkIn,setCheckIn]=useState(params.get('checkin')||todayISO()); const [checkOut,setCheckOut]=useState(params.get('checkout')||addDaysISO(2)); const [liveUnits,setLiveUnits]=useState<AvailabilityUnit[]>(() => units.map(u => ({...u,guest_status:initialGuestStatus(u)}))); const [checking,setChecking]=useState(false)
 const requestVersionRef=useRef(0)
 const nights=Math.max(1,Math.round((new Date(checkOut).getTime()-new Date(checkIn).getTime())/86400000)); const total=room.price*nights; const tax=Math.round(total*.075)

 useEffect(()=>{
  let cancelled=false
  const controller=new AbortController()

  const load=async()=>{
   if(!checkIn||!checkOut||checkIn>=checkOut)return
   const version=++requestVersionRef.current
   setChecking(true)
   try{
    const response=await fetch(`/api/public/availability?checkin=${encodeURIComponent(checkIn)}&checkout=${encodeURIComponent(checkOut)}&roomTypeId=${encodeURIComponent(room.id)}&_=${Date.now()}`,{cache:'no-store',signal:controller.signal})
    const data=await response.json().catch(()=>null)
    if(cancelled||controller.signal.aborted||version!==requestVersionRef.current)return
    if(response.ok&&Array.isArray(data?.rooms))setLiveUnits(data.rooms)
   }catch(error:any){
    if(error?.name!=='AbortError'&&!cancelled)console.error('[room-details][availability-error]',{roomTypeId:room.id,checkIn,checkOut,message:error?.message})
   }finally{
    if(!cancelled&&version===requestVersionRef.current)setChecking(false)
   }
  }

  void load()

  const refresh=()=>{
   if(!cancelled)void load()
  }
  window.addEventListener('bluepair:database-change',refresh)
  return()=>{
   cancelled=true
   controller.abort()
   requestVersionRef.current+=1
   window.removeEventListener('bluepair:database-change',refresh)
  }
 },[checkIn,checkOut,room.id])

 const availableCount=liveUnits.filter(u=>u.guest_status==='available').length

 return <div className="container-w px-6 md:px-10 py-8">
  <div className="text-xs text-navy-400 mb-5">Home / Rooms & Suites / {room.name}</div>
  <div className="grid lg:grid-cols-[1.35fr,.65fr] gap-10 items-start">
   <div>
    <ImageCarousel images={room.images} alt={room.name} className="h-[420px] rounded-2xl" showArrows showDots showCounter />
    <h1 className="text-3xl md:text-4xl font-semibold mt-8">{room.name}</h1>
    <p className="text-navy-500 mt-4 leading-relaxed max-w-2xl">{room.description}</p>
    <div className="flex flex-wrap gap-8 py-6 my-6 border-y border-black/10"><div className="flex gap-2"><Users size={18} className="text-gold-500"/><b>{room.guests} guests</b></div><div className="flex gap-2"><BedDouble size={18} className="text-gold-500"/><b>{room.bedType}</b></div><div className="flex gap-2"><Ruler size={18} className="text-gold-500"/><b>{room.sizeSqm} m²</b></div></div>
    <h3 className="text-lg font-semibold mb-4">Amenities</h3><div className="grid sm:grid-cols-2 gap-3 mb-10">{room.amenities.map(a=><div key={a} className="flex gap-2 text-sm"><CheckCircle2 size={16} className="text-gold-500"/>{a}</div>)}</div>
    <div className="flex items-center justify-between mb-4"><div><h2 className="text-2xl font-semibold">Choose your room</h2><p className="text-sm text-navy-400 mt-1">{checking?'Checking dates…':`${availableCount} of ${liveUnits.length} rooms available for your dates`}</p></div></div>
    <div className="space-y-2.5">{liveUnits.map(u=>{const state=u.guest_status||initialGuestStatus(u); const ok=state==='available'; const blocked=state!=='available'; const unavailableSoon=state==='availableSoon'; const roomContent=<><img src={u.image_url||room.images[0]} className={`w-16 h-14 sm:w-24 sm:h-20 shrink-0 rounded-md sm:rounded-md object-cover ${blocked?'grayscale opacity-45':''}`} alt={u.name||`Room ${u.room_number}`}/><div className="min-w-0 flex-1"><b className="block text-xs sm:text-sm truncate">{u.name||`Room ${u.room_number}`}</b><span className="text-[10px] sm:text-xs text-navy-400 block truncate">Room {u.room_number} · Floor {u.floor||'—'}</span><span className="text-[9px] sm:text-[10px] text-navy-400 block mt-1">View room details, images & booking options</span></div><div className="shrink-0"><ArrowRight size={14} className={blocked?'text-navy-200':'text-navy-300'}/></div></>; return ok?<Link key={u.id} href={`/rooms/${room.slug}/${u.slug}?checkin=${encodeURIComponent(checkIn)}&checkout=${encodeURIComponent(checkOut)}`} className="card p-2.5 sm:p-4 flex items-center gap-2.5 sm:gap-4 min-h-0 hover:border-gold-400/60 transition-colors">{roomContent}</Link>:<div key={u.id} aria-disabled="true" className={`card p-2.5 sm:p-4 flex items-center gap-2.5 sm:gap-4 min-h-0 cursor-not-allowed select-none ${unavailableSoon?'bg-navy-100/80 opacity-65':'opacity-55'}`}>{roomContent}</div>})}</div>
   </div>
   <aside className="card p-6 sticky top-24"><div className="flex items-baseline gap-2"><b className="font-display text-2xl">{naira(room.price)}</b><span className="text-xs text-navy-400">/ night</span></div><div className="h-px bg-black/10 my-5"/><label className="field-label">Check-in</label><input type="date" min={todayISO()} value={checkIn} onChange={e=>{setCheckIn(e.target.value);if(e.target.value>=checkOut)setCheckOut(addDaysISO(1,e.target.value))}} className="field-input mb-4"/><label className="field-label">Check-out</label><input type="date" min={addDaysISO(1,checkIn)} value={checkOut} onChange={e=>setCheckOut(e.target.value)} className="field-input mb-4"/><div className="flex justify-between text-sm"><span>{naira(room.price)} × {nights} nights</span><b>{naira(total)}</b></div><div className="flex justify-between text-sm mt-2"><span>Taxes & fees</span><b>{naira(tax)}</b></div><div className="flex justify-between font-semibold border-t border-black/10 mt-4 pt-4"><span>Total</span><b>{naira(total+tax)}</b></div>
    <div className="mt-5 rounded-xl bg-navy-50 border border-black/5 text-navy-600 text-sm p-4">Select a physical room above to see its specific details and the correct booking or reservation action.</div>
   </aside>
  </div>
  <h3 className="text-xl font-semibold mt-20 mb-5">Other room types</h3><div className="grid md:grid-cols-3 gap-6 pb-20">{others.map(r=><RoomCard key={r.id} room={r} availableCount={availability[r.id] ?? 0} showAvailabilityBadge={false}/>)}</div>
 </div>
}
