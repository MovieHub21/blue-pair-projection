'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, CalendarCheck, CheckCheck, ChevronRight, CreditCard, MessageSquare, Sparkles, Wrench } from 'lucide-react'

type Notification = { id:string; type:string; title:string; body:string; href:string|null; read_at:string|null; created_at:string }
const icons: Record<string, any> = { booking:CalendarCheck, payment:CreditCard, event_reservation:CalendarCheck, message:MessageSquare, request:Wrench, stay:Sparkles }

function dateLabel(value:string) {
  const date = new Date(value)
  return date.toLocaleDateString(undefined, { weekday:'short', day:'numeric', month:'short', year:'numeric' })
}

export default function NotificationsPage() {
  const [items,setItems] = useState<Notification[]>([])
  const [loading,setLoading] = useState(true)
  async function load() {
    const response = await fetch('/api/notifications?limit=100',{cache:'no-store'})
    const data = await response.json()
    if(response.ok) setItems(data.notifications ?? [])
    setLoading(false)
  }
  useEffect(()=>{ load() },[])
  async function markAll() {
    await fetch('/api/notifications',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'all_read'})})
    setItems(current=>current.map(item=>({...item,read_at:item.read_at||new Date().toISOString()})))
  }
  async function markOne(id:string) {
    await fetch('/api/notifications',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'read',id})})
    setItems(current=>current.map(item=>item.id===id?{...item,read_at:new Date().toISOString()}:item))
  }
  const unread = items.filter(item=>!item.read_at).length
  return (
    <main className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-gold-600">Stay connected</div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-navy-950 mt-1">Notifications</h1>
          <p className="text-sm text-navy-500 mt-1">Personal updates about your bookings, stay, reservations and messages.</p>
        </div>
        {unread>0 && <button onClick={markAll} className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy-950 text-white px-4 py-2.5 text-xs font-semibold hover:bg-navy-900"><CheckCheck size={14}/> Mark all as read</button>}
      </div>

      <div className="bg-white border border-black/5 rounded-2xl overflow-hidden shadow-sm">
        {loading ? <div className="p-12 text-center text-sm text-navy-400">Loading your notifications…</div> : items.length===0 ? (
          <div className="p-14 text-center"><div className="mx-auto w-14 h-14 rounded-2xl bg-cream-100 flex items-center justify-center text-navy-400"><Bell size={22}/></div><h2 className="mt-4 text-base font-semibold text-navy-900">Nothing new yet</h2><p className="mt-1 text-sm text-navy-400 max-w-sm mx-auto">When Blue Pair has an update for you, it will appear here.</p><Link href="/account/dashboard" className="inline-flex mt-5 text-xs font-semibold text-navy-700 hover:text-navy-950">Back to dashboard</Link></div>
        ) : (
          <div className="divide-y divide-black/5">
            {items.map(item=>{ const Icon=icons[item.type]||Bell; const row=<div className={`flex gap-4 p-4 sm:p-5 ${!item.read_at?'bg-blue-50/35':''}`}><div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${!item.read_at?'bg-navy-950 text-gold-400':'bg-cream-100 text-navy-500'}`}><Icon size={17}/></div><div className="min-w-0 flex-1"><div className="flex items-start gap-2"><h2 className="text-sm font-semibold text-navy-900 flex-1">{item.title}</h2>{!item.read_at&&<span className="w-2 h-2 rounded-full bg-gold-500 mt-1.5"/>}</div><p className="text-sm text-navy-500 leading-6 mt-1">{item.body}</p><div className="text-[11px] text-navy-400 mt-2">{dateLabel(item.created_at)} · {new Date(item.created_at).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}</div></div>{item.href&&<ChevronRight size={17} className="shrink-0 mt-2 text-navy-300"/>}</div>; return item.href?<Link key={item.id} href={item.href} onClick={()=>markOne(item.id)} className="block hover:bg-cream-100/50">{row}</Link>:<button key={item.id} onClick={()=>markOne(item.id)} className="w-full text-left hover:bg-cream-100/50">{row}</button> })}
          </div>
        )}
      </div>
    </main>
  )
}
