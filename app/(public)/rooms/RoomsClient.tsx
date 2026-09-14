'use client'
import {useMemo,useState} from 'react'
import {useSearchParams} from 'next/navigation'
import Link from 'next/link'
import {ChevronDown,ArrowRight,SlidersHorizontal} from 'lucide-react'
import type {RoomType,Room} from '../../../data/mock'

export default function RoomsClient({roomTypes,rooms}:{roomTypes:RoomType[];rooms:Room[]}){
 const params=useSearchParams(); const[type,setType]=useState('All'); const[price,setPrice]=useState('all')
 const types=['All',...roomTypes.map(r=>r.name)]
 const filtered=useMemo(()=>{
  const byType=type==='All'?roomTypes:roomTypes.filter(r=>r.name===type)
  if(price==='low') return [...byType].sort((a,b)=>Number(a.price)-Number(b.price))
  if(price==='high') return [...byType].sort((a,b)=>Number(b.price)-Number(a.price))
  return byType
 },[roomTypes,type,price])
 return <div className="container-w px-6 md:px-10 py-8">
  {params.get('checkin')&&<div className="mb-5 text-xs sm:text-sm bg-emerald-50 text-emerald-700 rounded-xl px-4 py-2.5 font-medium">Showing availability for {params.get('checkin')} → {params.get('checkout')}</div>}
  <div className="mb-7 sm:mb-10 flex items-center gap-2">
   <div className="hidden sm:flex flex-wrap gap-2 flex-1">
    {types.map(t=><button key={t} onClick={()=>setType(t)} className={'px-3.5 py-2 rounded-full text-xs border '+(type===t?'bg-navy-950 text-white border-navy-950':'border-black/15 text-navy-700')}>{t}</button>)}
   </div>
   <label className="sm:hidden flex-1 relative">
    <SlidersHorizontal size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-500 pointer-events-none"/>
    <select value={type} onChange={e=>setType(e.target.value)} className="w-full h-9 appearance-none rounded-lg border border-black/10 bg-white pl-9 pr-8 text-xs font-medium text-navy-800 outline-none">
     {types.map(t=><option key={t} value={t}>{t==='All'?'All room types':t}</option>)}
    </select>
    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-500 pointer-events-none"/>
   </label>
   <label className="relative shrink-0">
    <select value={price} onChange={e=>setPrice(e.target.value)} className="h-9 appearance-none rounded-lg border border-black/10 bg-white pl-3 pr-8 text-xs font-medium text-navy-800 outline-none">
     <option value="all">Price</option><option value="low">Lowest first</option><option value="high">Highest first</option>
    </select>
    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-navy-500 pointer-events-none"/>
   </label>
  </div>
  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pb-16 sm:pb-20">
   {filtered.map(r=>{
    const count=rooms.filter(x=>x.roomTypeId===r.id&&x.status==='available').length
    return <Link href={`/rooms/${r.slug}`} key={r.id} className="card overflow-hidden group">
     <div className="relative h-52 sm:h-60 overflow-hidden"><img src={r.images[0]} className="w-full h-full object-cover group-hover:scale-[1.03] transition" alt={r.name}/><span className={'absolute top-2.5 left-2.5 '+(count?'pill-green':'pill-red')+' bg-white/95'}>{count?`${count} available`:'Sold out'}</span></div>
     <div className="p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><h2 className="text-base sm:text-xl font-semibold">{r.name}</h2><b className="font-display text-sm sm:text-lg shrink-0">₦{Number(r.price).toLocaleString()}<span className="font-body text-[9px] sm:text-xs text-navy-400">/night</span></b></div><p className="text-xs sm:text-sm text-navy-500 mt-1.5 sm:mt-2 line-clamp-2">{r.description}</p><div className="flex items-center justify-end mt-3 sm:mt-5"><span className="text-xs sm:text-sm font-semibold flex items-center gap-1">View rooms <ArrowRight size={13}/></span></div></div>
    </Link>
   })}
  </div>
  {!filtered.length&&<div className="py-16 text-center text-sm text-navy-500">No rooms match this filter.</div>}
 </div>
}
