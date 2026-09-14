'use client'
import {useCallback,useEffect,useMemo,useRef,useState} from 'react'
import {useSearchParams} from 'next/navigation'
import Link from 'next/link'
import {ArrowLeft,ArrowRight,ChevronDown,SlidersHorizontal,Users,Maximize2} from 'lucide-react'
import type {RoomType,Room} from '../../../data/mock'

export default function RoomsClient({roomTypes,rooms}:{roomTypes:RoomType[];rooms:Room[]}){
 const params=useSearchParams();
 const[type,setType]=useState('All');
 const[price,setPrice]=useState('all');
 const carouselRef=useRef<HTMLDivElement>(null);
 const rafRef=useRef<number|null>(null);
 const types=['All',...roomTypes.map(r=>r.name)];

 const filtered=useMemo(()=>{
  const byType=type==='All'?roomTypes:roomTypes.filter(r=>r.name===type)
  if(price==='low') return [...byType].sort((a,b)=>Number(a.price)-Number(b.price))
  if(price==='high') return [...byType].sort((a,b)=>Number(b.price)-Number(a.price))
  return byType
 },[roomTypes,type,price])

 const availableForType=(name:string)=>{
  if(name==='All') return rooms.filter(r=>r.status==='available').length
  const roomType=roomTypes.find(r=>r.name===name)
  return roomType?rooms.filter(r=>r.roomTypeId===roomType.id&&r.status==='available').length:0
 }

 const scrollToType=useCallback((name:string)=>{
  setType(name)
  const container=carouselRef.current
  if(!container) return
  const target=Array.from(container.children).find(el=>el.getAttribute('data-room-type')===name) as HTMLElement|undefined
  target?.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'})
 },[])

 const syncTypeToScroll=useCallback(()=>{
  const container=carouselRef.current
  if(!container) return
  const center=container.scrollLeft+container.clientWidth/2
  let closest:string|undefined
  let distance=Infinity
  Array.from(container.children).forEach(el=>{
   const item=el as HTMLElement
   const itemCenter=item.offsetLeft+item.offsetWidth/2
   const nextDistance=Math.abs(itemCenter-center)
   if(nextDistance<distance){distance=nextDistance;closest=item.getAttribute('data-room-type')||undefined}
  })
  if(closest&&closest!==type) setType(closest)
 },[type])

 const handleCarouselScroll=()=>{
  if(rafRef.current) cancelAnimationFrame(rafRef.current)
  rafRef.current=requestAnimationFrame(syncTypeToScroll)
 }

 useEffect(()=>()=>{if(rafRef.current) cancelAnimationFrame(rafRef.current)},[])

 return <div className="container-w px-6 md:px-10 py-8">
  {params.get('checkin')&&<div className="mb-5 text-xs sm:text-sm bg-emerald-50 text-emerald-700 rounded-xl px-4 py-2.5 font-medium">Showing availability for {params.get('checkin')} → {params.get('checkout')}</div>}

  <div className="mb-7 sm:mb-10">
   <div className="hidden sm:flex items-center gap-2">
    <div className="flex flex-wrap gap-2 flex-1">
     {types.map(t=><button key={t} onClick={()=>setType(t)} className={'px-3.5 py-2 rounded-full text-xs border '+(type===t?'bg-navy-950 text-white border-navy-950':'border-black/15 text-navy-700')}>{t}</button>)}
    </div>
    <label className="relative shrink-0">
     <select value={price} onChange={e=>setPrice(e.target.value)} className="h-9 appearance-none rounded-lg border border-black/10 bg-white pl-3 pr-8 text-xs font-medium text-navy-800 outline-none">
      <option value="all">Price</option><option value="low">Lowest first</option><option value="high">Highest first</option>
     </select>
     <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-navy-500 pointer-events-none"/>
    </label>
   </div>

   <div className="sm:hidden">
    <div className="flex items-center justify-between mb-2.5 px-0.5">
     <div><p className="text-[10px] uppercase tracking-[0.16em] text-navy-400 font-semibold">Room types</p><p className="text-xs text-navy-500 mt-0.5">Swipe to explore</p></div>
     <label className="relative shrink-0">
      <SlidersHorizontal size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-navy-500 pointer-events-none"/>
      <select value={price} onChange={e=>setPrice(e.target.value)} aria-label="Sort rooms by price" className="h-8 appearance-none rounded-lg border border-black/10 bg-white pl-7 pr-7 text-[10px] font-semibold text-navy-800 outline-none">
       <option value="all">Price</option><option value="low">Lowest first</option><option value="high">Highest first</option>
      </select><ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-navy-500 pointer-events-none"/>
     </label>
    </div>
    <div className="relative -mx-6 overflow-hidden">
     <div ref={carouselRef} onScroll={handleCarouselScroll} className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory overscroll-x-contain px-[14vw] pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {types.map((name,index)=>{
       const roomType=roomTypes.find(r=>r.name===name); const available=availableForType(name); const active=type===name; const image=roomType?.images?.[0]
       return <button key={name} type="button" data-room-type={name} aria-pressed={active} onClick={()=>scrollToType(name)} className={'relative shrink-0 w-[72vw] max-w-[285px] min-h-[72px] snap-center snap-always rounded-2xl border text-left transition-all duration-300 ease-out '+(active?'bg-navy-950 text-white border-navy-950 shadow-[0_10px_28px_rgba(8,24,48,0.18)] scale-100':'bg-white text-navy-800 border-black/10 opacity-70 scale-[.94] shadow-sm')}>
        <div className="flex items-center gap-3 p-2.5"><div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-navy-100">{image?<img src={image} alt="" className="w-full h-full object-cover"/>:<div className="w-full h-full bg-navy-100"/>}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="text-sm font-semibold truncate">{name}</span>{index===0&&<span className={'text-[8px] uppercase tracking-[.12em] font-bold '+(active?'text-white/55':'text-navy-400')}>All</span>}</div><div className={'flex items-center gap-2 mt-1 text-[10px] '+(active?'text-white/65':'text-navy-400')}><span>{available} available</span>{roomType&&<><span>•</span><span>From ₦{Number(roomType.price).toLocaleString()}</span></>}</div></div><span className={'w-7 h-7 rounded-full flex items-center justify-center shrink-0 '+(active?'bg-white/10 text-white':'bg-navy-50 text-navy-500')}><ArrowRight size={13}/></span></div>
       </button>
      })}
     </div>
     {types.length>1&&<><button type="button" onClick={()=>scrollToType(types[Math.max(0,types.indexOf(type)-1)])} aria-label="Previous room type" className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/95 border border-black/10 shadow-sm flex items-center justify-center text-navy-700"><ArrowLeft size={12}/></button><button type="button" onClick={()=>scrollToType(types[Math.min(types.length-1,types.indexOf(type)+1)])} aria-label="Next room type" className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/95 border border-black/10 shadow-sm flex items-center justify-center text-navy-700"><ArrowRight size={12}/></button></>}
    </div>
    {types.length>1&&<div className="flex items-center justify-center gap-1 mt-2.5" aria-hidden="true">{types.map(name=><span key={name} className={'h-1 rounded-full transition-all duration-300 '+(type===name?'w-4 bg-navy-950':'w-1 bg-navy-200')}/>)}</div>}
   </div>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 lg:gap-6 pb-16 sm:pb-20">
   {filtered.map((r,index)=>{
    const count=rooms.filter(x=>x.roomTypeId===r.id&&x.status==='available').length
    const pattern=index%6
    const featured=pattern===0
    const middle=pattern>=1&&pattern<=3
    const paired=pattern>=4
    const reversed=pattern===5
    const span=pattern===0?'md:col-span-12':middle?'md:col-span-4':'md:col-span-6'
    const cardHeight=featured?'md:min-h-[390px]':middle?'md:min-h-[410px]':'md:min-h-[340px]'
    return <Link href={`/rooms/${r.slug}`} key={r.id} className={'group '+span}>
     <article className={'group h-full overflow-hidden rounded-[1.35rem] border border-black/[0.07] bg-white shadow-[0_10px_35px_rgba(8,24,48,0.06)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(8,24,48,0.11)] '+cardHeight+' '+(featured?'md:grid md:grid-cols-[1.35fr_.65fr]':paired?'md:grid md:grid-cols-2':'')}>
      <div className={'relative overflow-hidden '+(featured?'h-64 md:h-full':middle?'h-56 sm:h-64 md:h-64':paired?'h-52 sm:h-60 md:h-full '+(reversed?'md:order-2':'md:order-1'):'h-52 sm:h-60 md:h-56')}>
       <img src={r.images[0]} className="w-full h-full object-cover transition duration-700 group-hover:scale-[1.035]" alt={r.name}/>
       <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-transparent to-transparent opacity-85"/>
       <span className={'absolute top-4 left-4 '+(count?'pill-green':'pill-red')+' bg-white/95'}>{count?`${count} available`:'Sold out'}</span>
       {featured&&<span className="absolute bottom-4 left-4 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-[10px] uppercase tracking-[.16em] font-semibold px-3 py-1.5">Signature room</span>}
      </div>
      <div className={'flex flex-col min-w-0 '+(featured?'p-5 sm:p-7 md:p-9 justify-center':middle?'p-4 sm:p-5 md:p-5':paired?'p-5 sm:p-6 md:p-7 justify-center '+(reversed?'md:order-1':'md:order-2'):'p-4 sm:p-5 md:p-7 justify-center')}>
       <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1"><p className="text-[9px] uppercase tracking-[.16em] text-navy-400 font-semibold mb-1">{featured?'Featured stay':middle?'Blue Pair rooms':'Private stay'}</p><h2 className={featured?'text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight':'text-base sm:text-lg md:text-xl font-semibold tracking-tight'}>{r.name}</h2></div>
        <b className={'font-display shrink-0 '+(featured?'text-base sm:text-lg':'text-sm sm:text-base')}>₦{Number(r.price).toLocaleString()}<span className="font-body text-[9px] sm:text-xs text-navy-400">/night</span></b>
       </div>
       <p className={'text-xs sm:text-sm text-navy-500 mt-2 leading-relaxed '+(featured?'line-clamp-4 max-w-xl':'line-clamp-3')}>{r.description}</p>
       <div className="grid grid-cols-2 gap-2 mt-4 w-full max-w-xs">
        <div className="rounded-xl bg-navy-50 px-3 py-2"><div className="flex items-center gap-1.5 text-navy-400"><Users size={12}/><span className="text-[9px] uppercase tracking-wider">Guests</span></div><p className="text-xs font-semibold mt-1">Up to {r.guests}</p></div>
        <div className="rounded-xl bg-navy-50 px-3 py-2"><div className="flex items-center gap-1.5 text-navy-400"><Maximize2 size={12}/><span className="text-[9px] uppercase tracking-wider">Space</span></div><p className="text-xs font-semibold mt-1">{r.sizeSqm} m²</p></div>
       </div>
       <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-black/[0.07]"><span className="text-[9px] text-navy-400 truncate">{count} of {rooms.filter(x=>x.roomTypeId===r.id).length} rooms available</span><span className="text-xs font-semibold flex items-center gap-1 shrink-0">Explore room <ArrowRight size={13} className="transition-transform group-hover:translate-x-1"/></span></div>
      </div>
     </article>
    </Link>
   })}
  </div>
  {!filtered.length&&<div className="py-16 text-center text-sm text-navy-500">No rooms match this filter.</div>}
 </div>
}
