'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Clock3, XCircle } from 'lucide-react'
import { formatDate } from '../../../lib/format'

type Reservation = { id:string; guest_name:string; guest_email:string; guest_phone:string; guest_count:number; notes:string|null; staff_note:string|null; status:string; created_at:string; events?: { title:string; date:string; price:number } | null }

const statusLabel: Record<string,string> = { pending:'Awaiting review', reserved:'Reserved', declined:'Declined', cancelled:'Cancelled' }

export default function EventReservations() {
  const [rows,setRows] = useState<Reservation[]>([])
  const [loading,setLoading] = useState(true)
  const [busy,setBusy] = useState('')
  const [note,setNote] = useState<Record<string,string>>({})
  const [filter,setFilter] = useState('pending')

  async function load() { setLoading(true); const r=await fetch('/api/admin/event-reservations',{cache:'no-store'}); const d=await r.json(); if(r.ok) setRows(d.reservations||[]); setLoading(false) }
  useEffect(()=>{ load() },[])
  async function update(id:string,status:'reserved'|'declined') { setBusy(id); try { const r=await fetch('/api/admin/event-reservations',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({reservationId:id,status,staffNote:note[id]||''})}); if(r.ok) await load(); } finally { setBusy('') } }
  const filtered=filter==='all'?rows:rows.filter(r=>r.status===filter)

  return <section className="mt-10">
    <div className="flex items-end justify-between gap-4 mb-4 flex-wrap"><div><h2 className="text-xl font-semibold">Event reservation requests</h2><p className="text-xs text-navy-400 mt-1">Reception reviews requests here. Guests are emailed automatically when their status changes.</p></div><div className="flex gap-1 bg-black/5 rounded-lg p-1">{['pending','reserved','declined','all'].map(v=><button key={v} onClick={()=>setFilter(v)} className={`px-3 py-1.5 rounded-md text-xs font-semibold ${filter===v?'bg-white shadow-sm':''}`}>{v==='pending'?'Pending':v==='all'?'All':v[0].toUpperCase()+v.slice(1)}</button>)}</div></div>
    <div className="grid gap-3">{loading?<div className="card p-6 text-sm text-navy-400">Loading reservation requests…</div>:filtered.length===0?<div className="card p-8 text-center text-sm text-navy-400">No {filter==='all'?'event ':filter+' '}reservation requests.</div>:filtered.map(r=><div key={r.id} className="card p-5"><div className="flex flex-col lg:flex-row lg:items-start gap-5"><div className="flex-1"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{r.events?.title||'Event'}</h3><p className="text-xs text-navy-400 mt-1">{r.events?.date ? formatDate(r.events.date) : ''} · Request {r.id.slice(0,8)}</p></div><span className={r.status==='reserved'?'pill-green':r.status==='declined'?'pill-red':'pill-amber'}>{r.status==='reserved'?<CheckCircle2 size={12}/>:r.status==='declined'?<XCircle size={12}/>:<Clock3 size={12}/>} {statusLabel[r.status]||r.status}</span></div><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 text-sm"><div><span className="text-[10px] uppercase tracking-wide text-navy-400 block">Guest</span><b>{r.guest_name}</b></div><div><span className="text-[10px] uppercase tracking-wide text-navy-400 block">Contact</span><span>{r.guest_phone}<br/>{r.guest_email}</span></div><div><span className="text-[10px] uppercase tracking-wide text-navy-400 block">Guests</span><b>{r.guest_count}</b></div><div><span className="text-[10px] uppercase tracking-wide text-navy-400 block">Requested</span><span>{new Date(r.created_at).toLocaleString('en-NG')}</span></div></div>{r.notes&&<p className="mt-4 rounded-lg bg-cream-100 p-3 text-xs text-navy-600"><b>Guest note:</b> {r.notes}</p>}</div>{r.status==='pending'&&<div className="w-full lg:w-64 shrink-0"><label className="field-label">Reception note (optional)</label><textarea rows={3} className="field-input !h-auto py-2.5 text-xs" placeholder="e.g. Table 6 confirmed" value={note[r.id]||''} onChange={e=>setNote({...note,[r.id]:e.target.value})}/><div className="flex gap-2 mt-2"><button disabled={busy===r.id} onClick={()=>update(r.id,'declined')} className="btn-outline btn-sm flex-1 justify-center text-red-600">Decline</button><button disabled={busy===r.id} onClick={()=>update(r.id,'reserved')} className="btn-primary btn-sm flex-1 justify-center">Mark reserved</button></div></div>}</div></div>)}</div>
  </section>
}
