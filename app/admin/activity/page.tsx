'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Activity, CalendarDays, Download, Filter, Search, ArrowRight } from 'lucide-react'
import { supabase } from '../../../lib/supabase/client'
import { todayISO } from '../../../lib/format'

type ActivityRow = {
  id: string
  actor_user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  description: string
  metadata: Record<string, any>
  created_at: string
  actor_email?: string | null
  actor_name?: string | null
  friendly_description?: string
}

function startOfWeekISO() {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

function csvEscape(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

function prettyEntity(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function actionTone(action: string) {
  if (action === 'insert') return 'bg-emerald-50 text-emerald-700'
  if (action === 'delete') return 'bg-red-50 text-red-700'
  return 'bg-blue-50 text-blue-700'
}

function friendlyAction(action: string) {
  return action === 'insert' ? 'Created' : action === 'delete' ? 'Removed' : 'Updated'
}

function friendlyDescription(row: ActivityRow, emailByCustomer: Map<string, string>, roomById: Map<string, string>) {
  const data = row.metadata?.row ?? {}
  const guestEmail = emailByCustomer.get(String(data.customer_id ?? '')) || String(data.email ?? data.customer_email ?? '')
  const who = guestEmail || 'A guest'
  const id = String(data.reference ?? data.booking_ref ?? row.entity_id ?? '')
  const room = roomById.get(String(data.room_id ?? '')) || String(data.room ?? '')
  const entity = row.entity_type
  if (entity === 'bookings' && row.action === 'insert') return `${who} booked ${room ? `room ${room}` : 'a room'}${id ? ` · ${id}` : ''}`
  if (entity === 'room_service_orders' && row.action === 'insert') return `${who} ordered room service${id ? ` · Order ${id}` : ''}${room ? ` · Room ${room}` : ''}`
  if (entity === 'bar_orders' && row.action === 'insert') return `${who} placed an order${id ? ` · Order ${id}` : ''}`
  if (entity === 'payments') return row.action === 'insert' ? `Payment recorded for ${who}${data.booking_ref ? ` · Booking ${data.booking_ref}` : id ? ` · ${id}` : ''}` : row.action === 'update' ? `Payment status or details changed${id ? ` · ${id}` : ''}` : `Payment record removed${id ? ` · ${id}` : ''}`
  if (entity === 'financial_transactions') return row.action === 'insert' ? `Finance entry recorded${id ? ` · ${id}` : ''}` : row.action === 'update' ? `Finance entry changed${id ? ` · ${id}` : ''}` : `Finance entry removed${id ? ` · ${id}` : ''}`
  const subject = ({ bookings: 'booking', customers: 'guest profile', rooms: 'room', guest_requests: 'guest request', housekeeping_tasks: 'housekeeping task', maintenance_tickets: 'maintenance request', bar_orders: 'order', room_service_orders: 'room service order', financial_expenses: 'expense', staff: 'staff profile', menu_items: 'menu item', drinks: 'drink', short_lets: 'short-let', events: 'event', offers: 'offer', gallery_images: 'gallery image', amenities: 'amenity', room_types: 'room type', billboards: 'billboard' } as Record<string, string>)[entity] || entity.replace(/_/g, ' ')
  const label = data.name || data.title || data.category || data.room_number || data.room || id
  return `${friendlyAction(row.action)} ${subject}${label ? ` · ${label}` : ''}`
}

export default function ActivityPage() {
  const today = todayISO()
  const [preset, setPreset] = useState<'week' | 'month' | 'year' | 'custom'>('week')
  const [from, setFrom] = useState(startOfWeekISO())
  const [to, setTo] = useState(today)
  const [search, setSearch] = useState('')
  const [entity, setEntity] = useState('all')
  const [action, setAction] = useState('all')
  const [rows, setRows] = useState<ActivityRow[]>([])
  const [loading, setLoading] = useState(true)

  const applyPreset = (next: 'week' | 'month' | 'year' | 'custom') => {
    setPreset(next)
    if (next === 'week') setFrom(startOfWeekISO())
    if (next === 'month') setFrom(`${today.slice(0, 7)}-01`)
    if (next === 'year') setFrom(`${today.slice(0, 4)}-01-01`)
    if (next !== 'custom') setTo(today)
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const start = `${from}T00:00:00`
      const end = `${to}T23:59:59`
      const { data } = await supabase
        .from('activity_logs')
        .select('id, actor_user_id, action, entity_type, entity_id, description, metadata, created_at')
        .gte('created_at', start)
        .lte('created_at', end)
        .or('entity_type.neq.rooms,action.neq.update')
        .order('created_at', { ascending: false })
        .limit(1000)
      const logs = (data ?? []) as ActivityRow[]
      const actorIds = Array.from(new Set(logs.map(row => row.actor_user_id).filter(Boolean))) as string[]
      const customerIds = Array.from(new Set(logs.map(row => String(row.metadata?.row?.customer_id ?? '')).filter(Boolean)))
      const roomIds = Array.from(new Set(logs.map(row => String(row.metadata?.row?.room_id ?? '')).filter(Boolean)))
      const [profiles, customers, rooms] = await Promise.all([
        actorIds.length ? supabase.from('profiles').select('id,name,email').in('id', actorIds) : Promise.resolve({ data: [] as any[] }),
        customerIds.length ? supabase.from('customers').select('id,email').in('id', customerIds) : Promise.resolve({ data: [] as any[] }),
        roomIds.length ? supabase.from('rooms').select('id,room_number').in('id', roomIds) : Promise.resolve({ data: [] as any[] }),
      ])
      const profileById = new Map<string, any>((profiles.data ?? []).map((profile: any) => [String(profile.id), profile]))
      const emailByCustomer = new Map<string, string>((customers.data ?? []).map((customer: any) => [String(customer.id), String(customer.email ?? '')]))
      const roomById = new Map<string, string>((rooms.data ?? []).map((room: any) => [String(room.id), String(room.room_number ?? '')]))
      const enriched = logs.map(row => {
        const profile: any = profileById.get(row.actor_user_id ?? '')
        return { ...row, actor_email: profile?.email ?? null, actor_name: profile?.name ?? null, friendly_description: friendlyDescription(row, emailByCustomer, roomById) }
      })
      if (!cancelled) {
        setRows(enriched)
        setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [from, to])

  const entities = useMemo(() => ['all', ...Array.from(new Set(rows.map(r => r.entity_type)))], [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(row => {
      if (entity !== 'all' && row.entity_type !== entity) return false
      if (action !== 'all' && row.action !== action) return false
      if (!q) return true
      return [row.friendly_description, row.description, row.entity_type, row.entity_id, row.actor_user_id, row.actor_email].some(v => String(v ?? '').toLowerCase().includes(q))
    })
  }, [rows, search, entity, action])

  const counts = useMemo(() => ({
    total: filtered.length,
    inserts: filtered.filter(r => r.action === 'insert').length,
    updates: filtered.filter(r => r.action === 'update').length,
    deletes: filtered.filter(r => r.action === 'delete').length,
  }), [filtered])

  const download = () => {
    const header = ['Date', 'Action', 'Area', 'Record', 'Description', 'Actor']
    const lines = [header, ...filtered.map(r => [
      new Date(r.created_at).toLocaleString('en-NG'), friendlyAction(r.action), prettyEntity(r.entity_type), r.entity_id ?? '', r.friendly_description ?? r.description, r.actor_email ?? r.actor_user_id ?? 'System',
    ])].map(row => row.map(csvEscape).join(','))
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `blue-pair-activity-${from}-to-${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <span className="eyebrow">Owner visibility</span>
          <h1 className="text-2xl font-semibold mt-1">Hotel activity</h1>
          <p className="text-sm text-navy-400 mt-1 max-w-2xl">A live audit trail of operational changes across bookings, payments, rooms, guests, housekeeping, maintenance, staff and website data.</p>
        </div>
        <button onClick={download} disabled={!filtered.length} className="btn-primary disabled:opacity-40"><Download size={15} /> Download CSV</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5"><span className="text-xs text-navy-400">Events in view</span><b className="block text-2xl mt-1">{counts.total}</b></div>
        <div className="card p-5"><span className="text-xs text-navy-400">New records</span><b className="block text-2xl mt-1">{counts.inserts}</b></div>
        <div className="card p-5"><span className="text-xs text-navy-400">Updates</span><b className="block text-2xl mt-1">{counts.updates}</b></div>
        <div className="card p-5"><span className="text-xs text-navy-400">Deletions</span><b className="block text-2xl mt-1">{counts.deletes}</b></div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4"><Filter size={16} className="text-gold-600" /><h2 className="font-semibold">Activity filters</h2></div>
        <div className="flex flex-wrap gap-2 mb-4">
          {(['week', 'month', 'year', 'custom'] as const).map(item => <button key={item} onClick={() => applyPreset(item)} className={`px-3 py-2 rounded-full text-xs font-semibold capitalize ${preset === item ? 'bg-navy-950 text-white' : 'bg-navy-50 text-navy-600'}`}>This {item}</button>)}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="text-xs text-navy-400">From<input type="date" value={from} onChange={e => { setFrom(e.target.value); setPreset('custom') }} className="input mt-1" /></label>
          <label className="text-xs text-navy-400">To<input type="date" value={to} onChange={e => { setTo(e.target.value); setPreset('custom') }} className="input mt-1" /></label>
          <label className="text-xs text-navy-400">Area<select value={entity} onChange={e => setEntity(e.target.value)} className="input mt-1">{entities.map(e => <option key={e} value={e}>{e === 'all' ? 'All areas' : prettyEntity(e)}</option>)}</select></label>
          <label className="text-xs text-navy-400">Action<select value={action} onChange={e => setAction(e.target.value)} className="input mt-1"><option value="all">All actions</option><option value="insert">Created</option><option value="update">Updated</option><option value="delete">Deleted</option></select></label>
        </div>
        <div className="relative mt-3"><Search size={15} className="absolute left-3 top-3 text-navy-300" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search description, record ID or actor…" className="input pl-9 w-full" /></div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-5 border-b border-black/5 flex items-center justify-between"><div><h2 className="font-semibold">Operational timeline</h2><p className="text-xs text-navy-400 mt-1">Newest activity appears first.</p></div><Activity size={18} className="text-gold-600" /></div>
        {loading ? <div className="p-10 text-center text-sm text-navy-400">Loading activity…</div> : filtered.length === 0 ? <div className="p-10 text-center"><Activity size={24} className="mx-auto text-navy-200" /><p className="text-sm text-navy-500 mt-3">No activity matches these filters.</p></div> : <div className="divide-y divide-black/5">{filtered.map(row => <div key={row.id} className="p-5 flex gap-4 items-start hover:bg-navy-50/40 transition-colors"><div className="w-9 h-9 rounded-xl bg-gold-50 flex items-center justify-center shrink-0"><Activity size={15} className="text-gold-600" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${actionTone(row.action)}`}>{friendlyAction(row.action)}</span><span className="text-xs font-semibold text-navy-700">{prettyEntity(row.entity_type)}</span></div><p className="text-sm text-navy-700 mt-2">{row.friendly_description || row.description}</p><p className="text-[11px] text-navy-400 mt-1">{new Date(row.created_at).toLocaleString('en-NG')} · {row.actor_user_id ? row.actor_email || row.actor_name || 'Staff member' : 'System / automated action'}</p></div></div>)}</div>}
      </div>

      <div className="card p-5 bg-navy-950 text-white"><div className="flex items-start justify-between gap-4"><div><span className="text-[10px] uppercase tracking-[0.2em] text-gold-400">Owner note</span><h3 className="font-semibold mt-1">Use this as the hotel’s operational diary.</h3><p className="text-sm text-white/60 mt-2 max-w-2xl">The log is database-triggered, so it continues recording changes made by the app and future integrations. Combine it with the Reports page for financial totals and with the dashboard for today’s operating position.</p></div><Link href="/admin/reports/revenue" className="text-xs font-semibold text-gold-300 flex items-center gap-1 whitespace-nowrap">Open reports <ArrowRight size={13} /></Link></div></div>
    </div>
  )
}
