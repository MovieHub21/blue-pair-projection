'use client'
import {useState} from 'react'
import {useSearchParams} from 'next/navigation'
import Link from 'next/link'
import {ChevronDown,ArrowRight} from 'lucide-react'
import type {RoomType,Room} from '../../../data/mock'

export default function RoomsClient({roomTypes,rooms}:{roomTypes:RoomType[];rooms:Room[]}){
 const params=useSearchParams(); const[type,setType]=useState('All')
 const types=['All',...roomTypes.map(r=>r.name)]
 const filtered=type==='All'?roomTypes:roomTypes.filter(r=>r.name===type)
 return <div className="container-w px-6 md:px-10 py-8">
  {params.get('checkin')&&<div className="mb-6 text-sm bg-emerald-50 text-emerald-700 rounded-xl2 px-5 py-3.5 font-medium">Showing availability for {params.get('checkin')} → {params.get('checkout')}</div>}
  <div className="flex flex-wrap gap-2.5 mb-10">
   {types.map(t=><button key={t} onClick={()=>setType(t)} className={'px-4 py-2.5 rounded-full text-sm border '+(type===t?'bg-navy-950 text-white border-navy-950':'border-black/15 text-navy-700')}>{t}</button>)}
   <button className="px-4 py-2.5 rounded-full text-sm border border-black/15 text-navy-700 flex items-center gap-1.5 ml-auto">Price <ChevronDown size={13}/></button>
  </div>
  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
   {filtered.map(r=>{
    const count=rooms.filter(x=>x.roomTypeId===r.id&&x.status==='available').length
    return <Link href={`/rooms/${r.slug}`} key={r.id} className="card overflow-hidden group">
     <div className="relative h-60 overflow-hidden"><img src={r.images[0]} className="w-full h-full object-cover group-hover:scale-[1.03] transition" alt={r.name}/><span className={'absolute top-3.5 left-3.5 '+(count?'pill-green':'pill-red')+' bg-white/95'}>{count?`${count} available`:'Sold out'}</span></div>
     <div className="p-5"><h2 className="text-xl font-semibold">{r.name}</h2><p className="text-sm text-navy-500 mt-2 line-clamp-2">{r.description}</p><div className="flex items-center justify-between mt-5"><b className="font-display text-lg">₦{Number(r.price).toLocaleString()} <span className="font-body text-xs text-navy-400">/ night</span></b><span className="text-sm font-semibold flex items-center gap-1">View rooms <ArrowRight size={14}/></span></div></div>
    </Link>
   })}
  </div>
 </div>
}
