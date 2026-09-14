'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, BedDouble, Ruler, CheckCircle2, ArrowRight } from 'lucide-react'
import { naira, todayISO, addDaysISO } from '../../../../lib/format'
import RoomCard from '../../../../components/ui/RoomCard'
import type { RoomType } from '../../../../data/mock'

type Unit={id:string;room_number:string;name:string;slug:string;image_url?:string|null;status:string;floor?:string}
export default function RoomDetailsClient({room,units,others,availability}:{room:RoomType;units:Unit[];others:RoomType[];availability:Record<string,number>}){
 const router=useRouter(); const [checkIn,setCheckIn]=useState(todayISO()); const [checkOut,setCheckOut]=useState(addDaysISO(2));
 const available=units.filter(u=>u.status==='available'); const selected=available[0]; const nights=Math.max(1,Math.round((new Date(checkOut).getTime()-new Date(checkIn).getTime())/86400000)); const total=room.price*nights; const tax=Math.round(total*.075)
 return <div className="container-w px-6 md:px-10 py-8">
  <div className="text-xs text-navy-400 mb-5">Home / Rooms & Suites / {room.name}</div>
  <div className="grid lg:grid-cols-[1.35fr,.65fr] gap-10 items-start">
   <div>
    <div className="h-[420px] rounded-2xl overflow-hidden"><img src={room.images[0]} className="w-full h-full object-cover" alt={room.name}/></div>
    <h1 className="text-3xl md:text-4xl font-semibold mt-8">{room.name}</h1>
    <p className="text-navy-500 mt-4 leading-relaxed max-w-2xl">{room.description}</p>
    <div className="flex flex-wrap gap-8 py-6 my-6 border-y border-black/10"><div className="flex gap-2"><Users size={18} className="text-gold-500"/><b>{room.guests} guests</b></div><div className="flex gap-2"><BedDouble size={18} className="text-gold-500"/><b>{room.bedType}</b></div><div className="flex gap-2"><Ruler size={18} className="text-gold-500"/><b>{room.sizeSqm} m²</b></div></div>
    <h3 className="text-lg font-semibold mb-4">Amenities</h3><div className="grid sm:grid-cols-2 gap-3 mb-10">{room.amenities.map(a=><div key={a} className="flex gap-2 text-sm"><CheckCircle2 size={16} className="text-gold-500"/>{a}</div>)}</div>
    <div className="flex items-center justify-between mb-4"><div><h2 className="text-2xl font-semibold">Choose your room</h2><p className="text-sm text-navy-400 mt-1">{available.length} of {units.length} rooms currently available</p></div></div>
    <div className="space-y-2.5">{units.map(u=>{const ok=u.status==='available'; return <div key={u.id} className="card p-2.5 sm:p-4 flex items-center gap-2.5 sm:gap-4 min-h-0">
      <img src={u.image_url||room.images[0]} className="w-16 h-14 sm:w-24 sm:h-20 shrink-0 rounded-md sm:rounded-lg object-cover" alt={u.name||`Room ${u.room_number}`}/>
      <div className="min-w-0 flex-1"><b className="block text-xs sm:text-sm truncate">{u.name||`Room ${u.room_number}`}</b><span className="text-[10px] sm:text-xs text-navy-400 block truncate">Room {u.room_number} · Floor {u.floor||'—'}</span></div>
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0"><span className={(ok?'pill-green':'pill-red')+' !text-[9px] sm:!text-[11px] !px-2 sm:!px-3 !py-0.5 sm:!py-1'}>{ok?'Available':u.status.replace('_',' ')}</span>{ok&&<Link href={`/rooms/${room.slug}/${u.slug}`} className="btn-outline btn-sm !min-h-8 !px-2 sm:!px-3 !text-[10px] sm:!text-xs">View <ArrowRight size={11}/></Link>}</div>
    </div>})}</div>
   </div>
   <aside className="card p-6 sticky top-24"><div className="flex items-baseline gap-2"><b className="font-display text-2xl">{naira(room.price)}</b><span className="text-xs text-navy-400">/ night</span></div><div className="h-px bg-black/10 my-5"/><label className="field-label">Check-in</label><input type="date" value={checkIn} onChange={e=>setCheckIn(e.target.value)} className="field-input mb-4"/><label className="field-label">Check-out</label><input type="date" value={checkOut} onChange={e=>setCheckOut(e.target.value)} className="field-input mb-4"/><div className="flex justify-between text-sm"><span>{naira(room.price)} × {nights} nights</span><b>{naira(total)}</b></div><div className="flex justify-between text-sm mt-2"><span>Taxes & fees</span><b>{naira(tax)}</b></div><div className="flex justify-between font-semibold border-t border-black/10 mt-4 pt-4"><span>Total</span><b>{naira(total+tax)}</b></div>{selected?<button onClick={()=>router.push(`/booking?room=${room.slug}&unit=${selected.id}&checkin=${checkIn}&checkout=${checkOut}`)} className="btn-primary w-full justify-center mt-5">Book an available room</button>:<div className="mt-5 rounded-xl bg-red-50 text-red-700 text-sm p-4">No rooms of this type are available right now.</div>}</aside>
  </div>
  <h3 className="text-xl font-semibold mt-20 mb-5">Other room types</h3><div className="grid md:grid-cols-3 gap-6 pb-20">{others.map(r=><RoomCard key={r.id} room={r} availableCount={availability[r.id] ?? 0}/>)}</div>
 </div>
}
