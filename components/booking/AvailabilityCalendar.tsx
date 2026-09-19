'use client'
import {useEffect,useMemo,useState} from 'react'
import {ChevronLeft,ChevronRight,CalendarDays} from 'lucide-react'
import {addDaysISO,todayISO} from '../../lib/format'
import {onAvailabilityChange} from '../../lib/availabilityRealtime'

type Day={date:string;status:'available'|'booked'|'held'|'availableSoon';reference?:string|null;source?:string|null;check_in?:string|null;check_out?:string|null}
function monthStart(v:string){return `${v.slice(0,7)}-01`}
function monthLabel(v:string){return new Date(`${v}T00:00:00`).toLocaleDateString('en-NG',{month:'long',year:'numeric'})}
function pad(n:number){return String(n).padStart(2,'0')}
function daysInMonth(v:string){const d=new Date(`${v}T00:00:00Z`);d.setUTCMonth(d.getUTCMonth()+1);d.setUTCDate(0);return d.getUTCDate()}
function dayOfWeek(v:string){return new Date(`${v}T00:00:00Z`).getUTCDay()}

export default function AvailabilityCalendar({roomId,initialCheckIn,initialCheckOut,onSelect}:{roomId:string;initialCheckIn?:string;initialCheckOut?:string;onSelect?:(checkIn:string,checkOut:string)=>void}){
 const today=todayISO()
 const defaultStart=addDaysISO(1,today)
 const initialStart=initialCheckIn&&initialCheckIn>today?initialCheckIn:defaultStart
 const initialEnd=initialCheckOut&&initialCheckOut>initialStart?initialCheckOut:addDaysISO(1,initialStart)
 const [month,setMonth]=useState(monthStart(initialStart));const [days,setDays]=useState<Day[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState<string|null>(null);const [notice,setNotice]=useState<string|null>(null);const [start,setStart]=useState(initialStart);const [end,setEnd]=useState(initialEnd)
 useEffect(()=>{let cancelled=false;let requestVersion=0
  const load=async()=>{const version=++requestVersion;const startedAt=Date.now();const from=month;const to=addDaysISO(1,`${month.slice(0,7)}-${pad(daysInMonth(month))}`);setLoading(true);try{const response=await fetch(`/api/public/room-calendar?roomId=${encodeURIComponent(roomId)}&from=${from}&to=${to}&_=${Date.now()}`,{cache:'no-store'});const data=await response.json().catch(()=>null);console.info('[room-calendar][client-response]',{roomId,from,to,ok:response.ok,status:response.status,dayCount:data?.days?.length??0,error:data?.error??null,elapsedMs:Date.now()-startedAt});if(cancelled||version!==requestVersion)return;if(response.ok&&data?.days){setDays(data.days);setError(null);if(!initialCheckIn||initialCheckIn<=today){const availablePair=data.days.find((d:Day,i:number)=>d.date>today&&d.status==='available'&&data.days[i+1]?.date===addDaysISO(1,d.date)&&data.days[i+1]?.status==='available');if(availablePair){const next=addDaysISO(1,availablePair.date);setStart(availablePair.date);setEnd(next)}}}else setError(data?.error||'Unable to load calendar.')}catch{if(!cancelled)setError('Unable to load calendar.')}finally{if(!cancelled&&version===requestVersion)setLoading(false)}}
  void load()
  const refresh=(detail:{table:string|null;operation:string|null})=>{console.info('[room-calendar][realtime-refresh]',{roomId,month,table:detail.table??null,operation:detail.operation??null,receivedAt:new Date().toISOString()});void load()}
  const stopListening=onAvailabilityChange(refresh)
  return()=>{cancelled=true;stopListening();console.info('[room-calendar][effect-cleanup]',{roomId,month})}
 },[roomId,month])
 const cells=useMemo(()=>{const blanks=Array.from({length:dayOfWeek(month)}).map((_,i)=>({blank:i}));return [...blanks,...days]},[month,days])
 function choose(date:string,status:Day['status']){if(date<today){setNotice('That date has already passed.');return}if(status!=='available'){const day=days.find(d=>d.date===date);if(status==='booked')setNotice(`${date} is already taken for a paid reservation${day?.reference?` (${day.reference})`:''}. Please choose another date.`);else if(status==='held')setNotice(`${date} is temporarily held for another guest. Please choose another date.`);else setNotice(`${date} is currently unavailable. Please choose another date.`);return}setNotice(null);if(!start||end){setStart(date);setEnd('');return}if(date<=start){setStart(date);setEnd('');return}setEnd(date);onSelect?.(start,date)}
 const previousMonthDisabled=month<=monthStart(today)
 return (
  <div className="rounded-2xl border border-black/[0.07] bg-white p-4 sm:p-5 shadow-sm">
   <div className="flex items-center justify-between mb-4"><div><div className="flex items-center gap-2"><CalendarDays size={15} className="text-gold-600"/><h3 className="text-sm font-semibold">Room availability</h3></div><p className="text-[10px] text-navy-400 mt-1">Select your reservation dates</p></div><div className="flex gap-1"><button type="button" disabled={previousMonthDisabled} onClick={()=>{const d=new Date(`${month}T00:00:00Z`);d.setUTCMonth(d.getUTCMonth()-1);const next=`${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-01`;if(next>=monthStart(today))setMonth(next)}} className="w-7 h-7 rounded-lg border border-black/10 flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-30"><ChevronLeft size={14}/></button><button type="button" onClick={()=>{const d=new Date(`${month}T00:00:00Z`);d.setUTCMonth(d.getUTCMonth()+1);setMonth(`${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-01`)}} className="w-7 h-7 rounded-lg border border-black/10 flex items-center justify-center"><ChevronRight size={14}/></button></div></div>
   <div className="text-center text-xs font-semibold mb-3">{monthLabel(month)}</div><div className="grid grid-cols-7 gap-1 mb-2">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(x=><span key={x} className="text-center text-[9px] uppercase tracking-wider text-navy-400">{x.slice(0,2)}</span>)}</div>
   <div className="grid grid-cols-7 gap-1">{cells.map((cell:any,i:number)=>{if(cell.blank!==undefined)return <span key={`blank-${i}`} className="h-9 sm:h-10"/>;const past=cell.date<today;const taken=cell.status==='booked';const disabled=past||cell.status!=='available';const title=past?'Past date':taken?`Taken${cell.reference?` · ${cell.reference}`:''}`:cell.status==='held'?'Temporarily held':cell.status==='availableSoon'?'Unavailable':'Available';const className='h-9 sm:h-10 rounded-lg text-[10px] font-semibold border transition '+(cell.date===start||cell.date===end?'bg-navy-950 text-white border-navy-950':past?'bg-navy-50 text-navy-300 border-transparent cursor-not-allowed':cell.status==='available'?'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100':taken?'bg-red-100 text-red-700 border-red-200 cursor-not-allowed':cell.status==='held'?'bg-amber-50 text-amber-700 border-amber-100 cursor-not-allowed':'bg-navy-50 text-navy-400 border-transparent cursor-not-allowed');return <button key={cell.date} type="button" disabled={disabled} onClick={()=>choose(cell.date,cell.status)} title={title} aria-label={`${cell.date}: ${title}`} className={className}>{Number(cell.date.slice(-2))}</button>})}</div>
   {loading&&<p className="text-[10px] text-navy-400 mt-3 text-center">Loading availability…</p>}{error&&<p className="text-[10px] text-red-600 mt-3 text-center">{error}</p>}{notice&&<p role="status" className="text-[10px] text-red-600 mt-3 text-center font-medium">{notice}</p>}
   <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-black/[0.07] text-[9px] text-navy-500"><span>🟢 Available</span><span>🔴 Taken</span><span>🟡 Held</span><span>⚫ Unavailable</span></div>{start&&end&&<p className="text-[10px] text-navy-500 mt-3 text-center">Selected: <b>{start}</b> → <b>{end}</b></p>}
  </div>
 )
}
