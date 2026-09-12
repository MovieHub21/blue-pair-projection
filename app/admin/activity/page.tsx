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
}

function startOfWeekISO() {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

function csvEscape(value: unknown) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`
}

function prettyEntity(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function actionTone(action: string) {
  if (action === 'insert') return 'bg-emerald-50 text-emerald-700'
  if (action === 'delete') return 'bg-red-50 text-red-700'
  return 'bg-blue-50 text-blue-700'
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
        .order('created_at', { ascending: false })
        .limit(1000)
      if (!cancelled) {
        setRows((data ?? []) as ActivityRow[])
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
      return [row.description, row.entity_type, row.entity_id, row.actor_user_id].some(v => String(v ?? '').toLowerCase().includes(q))
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
      new Date(r.created_at).toLocaleString('en-NG'), r.action, prettyEntity(r.entity_type), r.entity_id ?? '', r.description, r.actor_user_id ?? 'System',
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
        {loading ? <div className="p-10 text-center text-sm text-navy-400">Loading activity…</div> : filtered.length === 0 ? <div className="p-10 text-center"><Activity size={24} className="mx-auto text-navy-200" /><p className="text-sm text-navy-500 mt-3">No activity matches these filters.</p></div> : <div className="divide-y divide-black/5">{filtered.map(row => <div key={row.id} className="p-5 flex gap-4 items-start hover:bg-navy-50/40 transition-colors"><div className="w-9 h-9 rounded-xl bg-gold-50 flex items-center justify-center shrink-0"><Activity size={15} className="text-gold-600" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${actionTone(row.action)}`}>{row.action}</span><span className="text-xs font-semibold text-navy-700">{prettyEntity(row.entity_type)}</span>{row.entity_id && <span className="text-[11px] text-navy-300">#{row.entity_id}</span>}</div><p className="text-sm text-navy-700 mt-2">{row.description}</p><p className="text-[11px] text-navy-400 mt-1">{new Date(row.created_at).toLocaleString('en-NG')} · {row.actor_user_id ? `Staff ${row.actor_user_id.slice(0, 8)}…` : 'System / server action'}</p></div></div>)}</div>}
      </div>

      <div className="card p-5 bg-navy-950 text-white"><div className="flex items-start justify-between gap-4"><div><span className="text-[10px] uppercase tracking-[0.2em] text-gold-400">Owner note</span><h3 className="font-semibold mt-1">Use this as the hotel’s operational diary.</h3><p className="text-sm text-white/60 mt-2 max-w-2xl">The log is database-triggered, so it continues recording changes made by the app and future integrations. Combine it with the Reports page for financial totals and with the dashboard for today’s operating position.</p></div><Link href="/admin/reports/revenue" className="text-xs font-semibold text-gold-300 flex items-center gap-1 whitespace-nowrap">Open reports <ArrowRight size={13} /></Link></div></div>
    </div>
  )
}
