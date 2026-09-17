'use client'

import { useState } from 'react'
import { useStore } from '../../../store/useStore'
import { naira, formatDate, todayISO } from '../../../lib/format'
import StatusBadge from '../../../components/ui/StatusBadge'

export default function CheckOutManagement() {
  const { bookings, roomTypes, customers, rooms, loadAll, pushToast } = useStore()
  const [note, setNote] = useState<Record<string,string>>({})
  const today=todayISO();const departures=bookings.filter(b=>b.status==='checked_in'&&b.checkOut>=today).sort((a,b)=>a.checkOut.localeCompare(b.checkOut));const custOf=(id:string)=>customers.find(c=>c.id===id);const roomOf=(id:string)=>roomTypes.find(r=>r.id===id);const physicalRoom=(id?:string)=>rooms.find(r=>r.id===id)
  async function checkout(id:string){const response=await fetch('/api/admin/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({bookingId:id})});const data=await response.json().catch(()=>({}));if(!response.ok){pushToast(data.error||'Could not check out guest.','error');return}await loadAll();pushToast('Guest checked out. The room is marked Cleaning Required for the actual checkout date.','success')}
  return <div><h1 className="text-2xl font-semibold mb-1">Check-out Management</h1><p className="text-navy-400 text-sm mb-6">Guests whose scheduled check-out is today or later. Checking out flags the room for housekeeping on the actual checkout date.</p><div className="grid gap-4">{departures.map(b=>{const dueToday=b.checkOut===today;return <div key={b.id} className={`card p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${dueToday?'border border-gold-200':''}`}><img src={roomOf(b.roomTypeId)?.images[0]} className="w-16 h-16 rounded-xl object-cover"/><div className="flex-1"><div className="flex items-center gap-2 flex-wrap"><b>{custOf(b.customerId)?.name}</b><StatusBadge status={b.status}/>{dueToday&&<span className="rounded-full bg-gold-50 text-gold-700 px-2.5 py-1 text-[11px] font-semibold">Due today</span>}</div><span className="text-xs text-navy-400">Room {physicalRoom(b.roomId)?.roomNumber} · {roomOf(b.roomTypeId)?.name} · {b.reference} · Check-out {formatDate(b.checkOut)}</span></div><input value={note[b.id]??''} onChange={e=>setNote({...note,[b.id]:e.target.value})} placeholder="Add checkout note…" className="field-input w-52 hidden md:block"/><button onClick={()=>void checkout(b.id)} className="btn-primary btn-sm">Check out guest</button></div>})}{departures.length===0&&<div className="card p-10 text-center text-navy-400 text-sm">No guests are due to check out today or later.</div>}</div></div>
}
