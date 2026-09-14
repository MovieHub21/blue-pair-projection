'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Users, BedDouble, Ruler, CheckCircle2, ArrowRight, Loader2, BellRing } from 'lucide-react'
import { naira, todayISO, addDaysISO } from '../../../../lib/format'
import RoomCard from '../../../../components/ui/RoomCard'
import ImageCarousel from '../../../../components/ui/ImageCarousel'
import type { RoomType } from '../../../../data/mock'
import { useAuth } from '../../../../lib/useAuth'

type Unit={id:string;room_number:string;name:string;slug:string;image_url?:string|null;status:string;floor?:string}
type AvailabilityUnit=Unit & {guest_status?:'available'|'availableSoon'|'taken'|'reserved';available_from?:string|null}

export default function RoomDetailsClient({room,units,others,availability}:{room:RoomType;units:Unit[];others:RoomType[];availability:Record<string,number>}){
 const router=useRouter(); const params=useSearchParams(); const auth=useAuth()
 const [checkIn,setCheckIn]=useState(params.get('checkin')||todayISO()); const [checkOut,setCheckOut]=useState(params.get('checkout')||addDaysISO(2)); const [liveUnits,setLiveUnits]=useState<AvailabilityUnit[]>(units as AvailabilityUnit[]); const [checking,setChecking]=useState(false); const [reserving,setReserving]=useState(false); const [reserved,setReserved]=useState<string|null>(null); const [error,setError]=useState<string|null>(null)
 const nights=Math.max(1,Math.round((new Date(checkOut).getTime()-new Date(checkIn).getTime())/86400000)); const total=room.price*nights; const tax=Math.round(total*.075)

 useEffect(()=>{
  if(!checkIn||!checkOut||checkIn>=checkOut)return
  setChecking(true); setError(null); setLiveUnits([])
  fetch(`/api/public/availability?checkin=${encodeURIComponent(checkIn)}&checkout=${encodeURIComponent(checkOut)}&roomTypeId=${encodeURIComponent(room.id)}`,{cache:'no-store'})
   .then(r=>r.ok?r.json():null).then(data=>{if(data?.rooms)setLiveUnits(data.rooms);else setLiveUnits([])}).catch(()=>{setLiveUnits([]);setError('Unable to check room availability right now.')}).finally(()=>setChecking(false))
 },[checkIn,checkOut,room.id])

 const available=liveUnits.filter(u=>u.guest_status==='available'); const selected=available[0]
 const availableSoon=liveUnits.filter(u=>u.guest_status==='availableSoon'); const soonRoom=availableSoon[0]
 const reservable=selected||soonRoom
 const reservingSoon=!selected&&Boolean(soonRoom)
 async function reserveRoom(){
  setError(null)
  if(!auth.userId){router.push(`/account/login?redirect=${encodeURIComponent(`/rooms/${room.slug}?checkin=${checkIn}&checkout=${checkOut}`)}`);return}
  if(!reservable){setError('There is no room available for those dates yet.');return}
  setReserving(true)
  try{
   const response=await fetch('/api/public/reservations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({roomTypeId:room.id,roomId:selected?.id||null,checkIn,checkOut,adults:2,children:0,amount:total+tax})})
   const data=await response.json().catch(()=>null)
   if(!response.ok) throw new Error(data?.error||'Unable to reserve this room right now.')
   setReserved(data?.booking?.reference||'Reservation received')
  }catch(e:any){setError(e?.message||'Unable to reserve this room right now.')}finally{setReserving(false)}
 }

 return <div className="container-w px-6 md:px-10 py-8">
  <div className="text-xs text-navy-400 mb-5">Home / Rooms & Suites / {room.name}</div>
  <div className="grid lg:grid-cols-[1.35fr,.65fr] gap-10 items-start">
   <div>
    <ImageCarousel images={room.images} alt={room.name} className="h-[420px] rounded-2xl" showArrows showDots showCounter />
    <h1 className="text-3xl md:text-4xl font-semibold mt-8">{room.name}</h1>
    <p className="text-navy-500 mt-4 leading-relaxed max-w-2xl">{room.description}</p>
    <div className="flex flex-wrap gap-8 py-6 my-6 border-y border-black/10"><div className="flex gap-2"><Users size={18} className="text-gold-500"/><b>{room.guests} guests</b></div><div className="flex gap-2"><BedDouble size={18} className="text-gold-500"/><b>{room.bedType}</b></div><div className="flex gap-2"><Ruler size={18} className="text-gold-500"/><b>{room.sizeSqm} m²</b></div></div>
    <h3 className="text-lg font-semibold mb-4">Amenities</h3><div className="grid sm:grid-cols-2 gap-3 mb-10">{room.amenities.map(a=><div key={a} className="flex gap-2 text-sm"><CheckCircle2 size={16} className="text-gold-500"/>{a}</div>)}</div>
    <div className="flex items-center justify-between mb-4"><div><h2 className="text-2xl font-semibold">Choose your room</h2><p className="text-sm text-navy-400 mt-1">{checking?'Checking dates…':`${available.length} of ${liveUnits.length} rooms available for your dates`}</p></div></div>
    <div className="space-y-2.5">{liveUnits.map(u=>{const state=u.guest_status||u.status; const ok=state==='available'; const soon=state==='availableSoon'; const ownReserved=state==='reserved'; return <Link key={u.id} href={`/rooms/${room.slug}/${u.slug}?checkin=${encodeURIComponent(checkIn)}&checkout=${encodeURIComponent(checkOut)}`} className="card p-2.5 sm:p-4 flex items-center gap-2.5 sm:gap-4 min-h-0 hover:border-gold-400/60 transition-colors">
      <img src={u.image_url||room.images[0]} className="w-16 h-14 sm:w-24 sm:h-20 shrink-0 rounded-md sm:rounded-lg object-cover" alt={u.name||`Room ${u.room_number}`}/>
      <div className="min-w-0 flex-1"><b className="block text-xs sm:text-sm truncate">{u.name||`Room ${u.room_number}`}</b><span className="text-[10px] sm:text-xs text-navy-400 block truncate">Room {u.room_number} · Floor {u.floor||'—'}</span><span className="text-[9px] sm:text-[10px] text-navy-400 block mt-1">View room details, images & booking options</span></div>
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0"><span className={(ok?'pill-green':soon?'rounded-full border border-gold-200 bg-gold-50 text-gold-700':ownReserved?'rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700':'pill-red')+' bg-white/95 !text-[9px] sm:!text-[11px] !px-2 sm:!px-3 !py-0.5 sm:!py-1'}>{checking?'Checking…':ok?'Available':soon?'Available soon':ownReserved?'Reserved':'Taken'}</span><ArrowRight size={14} className="text-navy-300"/></div>
    </Link>})}</div>
   </div>
   <aside className="card p-6 sticky top-24"><div className="flex items-baseline gap-2"><b className="font-display text-2xl">{naira(room.price)}</b><span className="text-xs text-navy-400">/ night</span></div><div className="h-px bg-black/10 my-5"/><label className="field-label">Check-in</label><input type="date" min={todayISO()} value={checkIn} onChange={e=>{setCheckIn(e.target.value);if(e.target.value>=checkOut)setCheckOut(addDaysISO(1,e.target.value))}} className="field-input mb-4"/><label className="field-label">Check-out</label><input type="date" min={addDaysISO(1,checkIn)} value={checkOut} onChange={e=>setCheckOut(e.target.value)} className="field-input mb-4"/><div className="flex justify-between text-sm"><span>{naira(room.price)} × {nights} nights</span><b>{naira(total)}</b></div><div className="flex justify-between text-sm mt-2"><span>Taxes & fees</span><b>{naira(tax)}</b></div><div className="flex justify-between font-semibold border-t border-black/10 mt-4 pt-4"><span>Total</span><b>{naira(total+tax)}</b></div>
    <div className="mt-5 rounded-xl bg-navy-50 border border-black/5 text-navy-600 text-sm p-4">Select a physical room above to see its specific details and the correct booking or reservation action.</div>
    {reserved&&<div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><b>Reservation received</b><p className="mt-1 text-xs leading-5">Reference {reserved}. No payment has been taken. We will notify you when the room is ready for payment.</p><Link href="/account/bookings" className="btn-outline btn-sm mt-3">View reservation</Link></div>}
    {error&&<div className="mt-3 rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-700">{error}</div>}
   </aside>
  </div>
  <h3 className="text-xl font-semibold mt-20 mb-5">Other room types</h3><div className="grid md:grid-cols-3 gap-6 pb-20">{others.map(r=><RoomCard key={r.id} room={r} availableCount={availability[r.id] ?? 0}/>)}</div>
 </div>
}
