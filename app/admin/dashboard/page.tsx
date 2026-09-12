'use client'

import { useMemo, useState } from 'react'
import { useStore } from '../../../store/useStore'
import { naira, todayISO } from '../../../lib/format'
import StatCard from '../../../components/ui/StatCard'
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts'
import { Wallet, BedDouble, LogIn, LogOut, ClipboardList, Users, CreditCard, Wrench } from 'lucide-react'
import LiveDateTime from '../../../components/ui/LiveDateTime'

function startOfWeekISO() {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

function dateInRange(value: string | undefined, start: string, end: string) {
  return !!value && value >= start && value <= end
}

export default function AdminDashboardPage() {
  const { rooms, bookings, customers, payments, maintenanceTickets, guestRequests, loaded } = useStore()
  const [range, setRange] = useState<'week' | 'month' | 'year'>('week')
  const today = todayISO()
  const weekStart = startOfWeekISO()
  const rangeStart = range === 'week' ? weekStart : range === 'month' ? `${today.slice(0, 7)}-01` : `${today.slice(0, 4)}-01-01`

  const stats = useMemo(() => {
    const paid = payments.filter(p => p.status === 'success' || p.status === 'successful')
    const revenue = paid.filter(p => dateInRange(p.date, rangeStart, today)).reduce((sum, p) => sum + Number(p.amount || 0), 0)
    const periodBookings = bookings.filter(b => dateInRange(b.createdAt || b.checkIn, rangeStart, today) && b.status !== 'cancelled')
    const checkIns = bookings.filter(b => dateInRange(b.checkIn, rangeStart, today)).length
    const checkOuts = bookings.filter(b => dateInRange(b.checkOut, rangeStart, today)).length
    const occupied = rooms.filter(r => r.status === 'occupied').length
    const available = rooms.filter(r => r.status === 'available').length
    const cleaning = rooms.filter(r => r.status === 'cleaning_required').length
    const pending = bookings.filter(b => b.status === 'pending').length
    const activeGuests = bookings.filter(b => b.status === 'checked_in').length
    const openMaintenance = maintenanceTickets.filter(t => !['resolved', 'closed', 'completed'].includes(String(t.status).toLowerCase())).length
    const openRequests = guestRequests.filter(r => !['resolved', 'completed', 'closed'].includes(String(r.status).toLowerCase())).length
    const sourceMap: Record<string, number> = {}
    periodBookings.forEach(b => {
      const source = String((b as any).source || 'online') === 'walk_in' ? 'Walk-in' : 'Online'
      sourceMap[source] = (sourceMap[source] || 0) + 1
    })
    return { revenue, periodBookings, checkIns, checkOuts, occupied, available, cleaning, pending, activeGuests, openMaintenance, openRequests, sourceMap }
  }, [payments, bookings, rooms, maintenanceTickets, guestRequests, rangeStart, today])

  const revenueByDay = useMemo(() => {
    const paid = payments.filter(p => (p.status === 'success' || p.status === 'successful') && p.date >= rangeStart && p.date <= today)
    const map: Record<string, number> = {}
    paid.forEach(p => { map[p.date] = (map[p.date] || 0) + Number(p.amount || 0) })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-7).map(([date, value]) => ({ day: date.slice(5), value }))
  }, [payments, rangeStart, today])

  const sourceData = Object.entries(stats.sourceMap).map(([name, value]) => ({ name, value }))
  const occupancy = rooms.length ? Math.round((stats.occupied / rooms.length) * 100) : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div><span className="eyebrow"><LiveDateTime /></span><h1 className="text-2xl font-semibold mt-1">Hotel overview</h1><p className="text-sm text-navy-400 mt-1">Live operational and financial snapshot from Supabase.</p></div>
        <div className="flex items-center gap-1 rounded-full border border-black/10 bg-white p-1">{(['week', 'month', 'year'] as const).map(item => <button key={item} onClick={() => setRange(item)} className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${range === item ? 'bg-navy-950 text-white' : 'text-navy-500'}`}>This {item}</button>)}</div>
      </div>
      {!loaded ? <div className="card p-8 text-center text-sm text-navy-400">Loading live hotel data…</div> : <>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"><StatCard label={`Revenue · this ${range}`} value={naira(stats.revenue)} icon={<Wallet size={17} />} tint="green" /><StatCard label="Current occupancy" value={`${occupancy}%`} icon={<BedDouble size={17} />} delta={`${stats.available} rooms available`} tint="navy" /><StatCard label={`Check-ins · this ${range}`} value={String(stats.checkIns)} icon={<LogIn size={17} />} /><StatCard label={`Check-outs · this ${range}`} value={String(stats.checkOuts)} icon={<LogOut size={17} />} tint="navy" /></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"><StatCard label="Guests currently staying" value={String(stats.activeGuests)} icon={<Users size={17} />} /><StatCard label="Pending bookings" value={String(stats.pending)} icon={<ClipboardList size={17} />} /><StatCard label="Open guest requests" value={String(stats.openRequests)} /><StatCard label="Open maintenance" value={String(stats.openMaintenance)} icon={<Wrench size={17} />} deltaTone={stats.openMaintenance ? 'down' : undefined} /></div>
        <div className="grid lg:grid-cols-[1.6fr,1fr] gap-6 mb-6"><div className="card p-6"><div className="flex justify-between items-center mb-2"><div><h3 className="font-semibold">Collected revenue</h3><p className="text-xs text-navy-400 mt-1">Successful payments recorded during this period.</p></div><span className="pill-gold">{naira(stats.revenue)}</span></div>{revenueByDay.length ? <ResponsiveContainer width="100%" height={220}><BarChart data={revenueByDay}><XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} /><Tooltip formatter={(v: number) => naira(v)} /><Bar dataKey="value" fill="#C79A3E" radius={[6,6,2,2]} /></BarChart></ResponsiveContainer> : <div className="h-[220px] flex items-center justify-center text-sm text-navy-400">No successful payments in this period.</div>}</div><div className="card p-6"><h3 className="font-semibold">Booking source</h3><p className="text-xs text-navy-400 mt-1 mb-4">Where this period’s bookings came from.</p>{sourceData.length ? <div className="flex items-center gap-5"><ResponsiveContainer width={140} height={140}><PieChart><Pie data={sourceData} dataKey="value" innerRadius={40} outerRadius={64} paddingAngle={2}>{sourceData.map((_, i) => <Cell key={i} fill={i ? '#22346E' : '#C79A3E'} />)}</Pie></PieChart></ResponsiveContainer><div className="space-y-2 text-xs">{sourceData.map((d, i) => <span key={d.name} className="flex items-center gap-2"><i className="w-2.5 h-2.5 rounded-sm" style={{ background: i ? '#22346E' : '#C79A3E' }} />{d.name} — {d.value}</span>)}</div></div> : <div className="h-[140px] flex items-center text-sm text-navy-400">No bookings in this period.</div>}</div></div>
        <div className="card p-6"><div className="flex justify-between items-center mb-5"><div><h3 className="font-semibold">Front-desk health</h3><p className="text-xs text-navy-400 mt-1">Things the owner may want to act on.</p></div><CreditCard size={18} className="text-gold-600" /></div><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"><div className="rounded-xl bg-navy-50 p-4"><span className="text-xs text-navy-400">Rooms needing cleaning</span><b className="block text-xl mt-1">{stats.cleaning}</b></div><div className="rounded-xl bg-navy-50 p-4"><span className="text-xs text-navy-400">Customers in database</span><b className="block text-xl mt-1">{customers.length}</b></div><div className="rounded-xl bg-navy-50 p-4"><span className="text-xs text-navy-400">Bookings in period</span><b className="block text-xl mt-1">{stats.periodBookings.length}</b></div><div className="rounded-xl bg-navy-50 p-4"><span className="text-xs text-navy-400">Rooms in inventory</span><b className="block text-xl mt-1">{rooms.length}</b></div></div></div>
      </>}
    </div>
  )
}
