'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import StatCard from '../../../../components/ui/StatCard'
import { naira, todayISO } from '../../../../lib/format'
import { Wallet, TrendingUp, CalendarCheck, Sparkles, Wrench, Download, Users, BedDouble, Activity, ReceiptText, CircleDollarSign } from 'lucide-react'
import { supabase } from '../../../../lib/supabase/client'
import { mapBooking, mapCustomer, mapHousekeepingTask, mapMaintenanceTicket, mapPayment, mapRoom, mapGuestRequest } from '../../../../lib/mappers'
import type { Booking, Customer, HousekeepingTask, MaintenanceTicket, Payment, Room } from '../../../../data/mock'
import type { GuestRequest } from '../../../../lib/mappers'

const REPORTS = [
  { key: 'revenue', label: 'Revenue' }, { key: 'occupancy', label: 'Occupancy' }, { key: 'bookings', label: 'Bookings' },
  { key: 'payments', label: 'Payments' }, { key: 'finance', label: 'Finance' }, { key: 'housekeeping', label: 'Housekeeping' }, { key: 'maintenance', label: 'Maintenance' },
  { key: 'operations', label: 'Operations' },
]

type Range = 'week' | 'month' | 'year' | 'custom'
type FinanceExpense = { id: string; reference: string; category: string; vendor?: string | null; description: string; amount: number | string; method: string; incurred_at: string }
type FinanceSnapshot = { grossSales: number; refunds: number; expenses: number; net: number; byMethod: Record<string, number>; expensesRows: FinanceExpense[] }

function isoDate(d: Date) { return d.toISOString().slice(0, 10) }
function startOfWeek() { const d = new Date(); const day = d.getDay(); d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day)); return isoDate(d) }
function daysBetween(start: string, end: string) { return Math.max(1, Math.round((new Date(`${end}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime()) / 86400000) + 1) }
function inRange(value: string | undefined, start: string, end: string) { return !!value && value >= start && value <= end }
function csvCell(value: unknown) { return `"${String(value ?? '').replace(/"/g, '""')}"` }
function downloadCsv(filename: string, headers: string[], rows: unknown[][]) { const csv = [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\n'); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url) }

export default function ReportsPage({ params }: { params: { type: string } }) {
  const router = useRouter()
  const active = params.type ?? 'revenue'
  const [bookings, setBookings] = useState<Booking[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [housekeepingTasks, setHousekeepingTasks] = useState<HousekeepingTask[]>([])
  const [maintenanceTickets, setMaintenanceTickets] = useState<MaintenanceTicket[]>([])
  const [guestRequests, setGuestRequests] = useState<GuestRequest[]>([])
  const [loaded, setLoaded] = useState(false)
  const [dataError, setDataError] = useState('')
  const today = todayISO()
  const [range, setRange] = useState<Range>('week')
  const [customStart, setCustomStart] = useState(startOfWeek())
  const [customEnd, setCustomEnd] = useState(today)
  const [finance, setFinance] = useState<FinanceSnapshot | null>(null)
  const [financeLoading, setFinanceLoading] = useState(false)
  const [financeError, setFinanceError] = useState('')

  useEffect(() => {
    let cancelled = false
    let requestVersion = 0

    const loadReportData = async () => {
      const version = ++requestVersion
      setLoaded(false)
      setDataError('')

      const [bookingsResult, paymentsResult, roomsResult, customersResult, housekeepingResult, maintenanceResult, requestsResult] = await Promise.all([
        supabase.from('bookings').select('*').order('created_at', { ascending: false }),
        supabase.from('payments').select('*').gte('date', start).lte('date', end).order('date', { ascending: false }),
        supabase.from('rooms').select('*').order('room_number'),
        supabase.from('customers').select('*').order('name'),
        supabase.from('housekeeping_tasks').select('*').order('room'),
        supabase.from('maintenance_tickets').select('*').order('date_reported', { ascending: false }),
        supabase.from('guest_requests').select('*').order('created_at', { ascending: false }),
      ])

      if (cancelled || version !== requestVersion) return

      const firstError = [bookingsResult, paymentsResult, roomsResult, customersResult, housekeepingResult, maintenanceResult, requestsResult].find(result => result.error)?.error
      if (firstError) {
        setDataError(firstError.message || 'Unable to load report data.')
        setLoaded(true)
        return
      }

      setBookings((bookingsResult.data ?? []).map(mapBooking))
      setPayments((paymentsResult.data ?? []).map(mapPayment))
      setRooms((roomsResult.data ?? []).map(mapRoom))
      setCustomers((customersResult.data ?? []).map(mapCustomer))
      setHousekeepingTasks((housekeepingResult.data ?? []).map(mapHousekeepingTask))
      setMaintenanceTickets((maintenanceResult.data ?? []).map(mapMaintenanceTicket))
      setGuestRequests((requestsResult.data ?? []).map(mapGuestRequest))
      setLoaded(true)
    }

    void loadReportData()

    const refresh = () => void loadReportData()
    window.addEventListener('bluepair:database-change', refresh)
    return () => {
      cancelled = true
      window.removeEventListener('bluepair:database-change', refresh)
    }
  }, [start, end])

  const { start, end } = useMemo(() => {
    if (range === 'custom') return { start: customStart, end: customEnd }
    if (range === 'week') return { start: startOfWeek(), end: today }
    if (range === 'month') return { start: `${today.slice(0, 7)}-01`, end: today }
    return { start: `${today.slice(0, 4)}-01-01`, end: today }
  }, [range, customStart, customEnd, today])

  useEffect(() => {
    let cancelled = false
    setFinanceLoading(true); setFinanceError('')
    fetch('/api/admin/finance', { cache: 'no-store' })
      .then(async response => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error || 'Unable to load finance report.'); return payload })
      .then(payload => { if (cancelled) return; setFinance({ grossSales: Number(payload.summary?.grossSales || 0), refunds: Number(payload.summary?.refunds || 0), expenses: Number(payload.summary?.expenses || 0), net: Number(payload.summary?.net || 0), byMethod: payload.byMethod || {}, expensesRows: payload.expenses || [] }) })
      .catch(error => { if (!cancelled) setFinanceError(error.message || 'Unable to load finance report.') })
      .finally(() => { if (!cancelled) setFinanceLoading(false) })
    const refresh=()=>{cancelled=false;void (async()=>{try{const response=await fetch('/api/admin/finance',{cache:'no-store'});const payload=await response.json();if(!response.ok)throw new Error(payload.error||'Unable to load finance report.');setFinance({grossSales:Number(payload.summary?.grossSales||0),refunds:Number(payload.summary?.refunds||0),expenses:Number(payload.summary?.expenses||0),net:Number(payload.summary?.net||0),byMethod:payload.byMethod||{},expensesRows:payload.expenses||[]})}catch(error:any){setFinanceError(error?.message||'Unable to load finance report.')}})()};window.addEventListener('bluepair:database-change',refresh);return()=>{cancelled=true;window.removeEventListener('bluepair:database-change',refresh)}
  }, [start, end])

  const periodPayments = useMemo(() => payments.filter(p => inRange(p.date, start, end)), [payments, start, end])
  const successfulPayments = periodPayments.filter(p => ['success', 'successful'].includes(String(p.status).toLowerCase()))
  const periodBookings = bookings.filter(b => inRange(b.createdAt || b.checkIn, start, end))
  const cancelled = periodBookings.filter(b => b.status === 'cancelled').length
  const checkIns = bookings.filter(b => inRange(b.checkIn, start, end)).length
  const checkOuts = bookings.filter(b => inRange(b.checkOut, start, end)).length
  const revenue = successfulPayments.reduce((s, p) => s + Number(p.amount || 0), 0)
  const pendingValue = periodBookings.filter(b => b.paymentStatus !== 'paid' && b.status !== 'cancelled').reduce((s, b) => s + Number(b.amount || 0), 0)
  const bookingNights = periodBookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => { const overlapStart = b.checkIn > start ? b.checkIn : start; const overlapEnd = b.checkOut < end ? b.checkOut : end; return sum + Math.max(0, daysBetween(overlapStart, overlapEnd) - 1) }, 0)
  const roomNights = rooms.length * Math.max(1, daysBetween(start, end))
  const occupancy = roomNights ? Math.min(100, Math.round((bookingNights / roomNights) * 100)) : 0
  const avgBooking = periodBookings.length ? Math.round(periodBookings.reduce((s, b) => s + Number(b.amount || 0), 0) / periodBookings.length) : 0
  const sourceCounts = periodBookings.reduce<Record<string, number>>((m, b) => { const k = (b as any).source === 'walk_in' ? 'Walk-in' : 'Online'; m[k] = (m[k] || 0) + 1; return m }, {})
  const methodTotals = successfulPayments.reduce<Record<string, number>>((m, p) => { const raw = String(p.method || 'Unknown'); const k = raw.toLowerCase() === 'paystack' ? 'Paystack' : raw.toLowerCase() === 'cash' ? 'Cash' : raw.toLowerCase() === 'pos' ? 'POS' : raw; m[k] = (m[k] || 0) + Number(p.amount || 0); return m }, {})
  const openMaintenance = maintenanceTickets.filter(t => !['resolved', 'closed', 'completed'].includes(String(t.status).toLowerCase())).length
  const openRequests = guestRequests.filter(r => !['resolved', 'closed', 'completed'].includes(String(r.status).toLowerCase())).length
  const periodExpenses = useMemo(() => finance?.expensesRows.filter(e => inRange(e.incurred_at.slice(0, 10), start, end)) ?? [], [finance, start, end])
  const periodExpenseTotal = periodExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const periodGrossIncome = useMemo(() => periodPayments.filter(p => ['success', 'successful'].includes(String(p.status).toLowerCase())).reduce((sum, p) => sum + Number(p.amount || 0), 0), [periodPayments])
  const periodNet = periodGrossIncome - periodExpenseTotal

  const revenueChart = useMemo(() => { const map: Record<string, number> = {}; successfulPayments.forEach(p => { map[p.date] = (map[p.date] || 0) + Number(p.amount || 0) }); return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date: date.slice(5), value })) }, [successfulPayments])

  function exportReport() {
    if (active === 'payments') return downloadCsv(`blue-pair-payments-${start}-to-${end}.csv`, ['Date', 'Reference', 'Booking', 'Customer', 'Amount', 'Method', 'Status'], periodPayments.map(p => [p.date, p.reference, p.bookingRef, p.customer, p.amount, p.method, p.status]))
    if (active === 'finance') return downloadCsv(`blue-pair-finance-${start}-to-${end}.csv`, ['Type', 'Date', 'Reference', 'Category', 'Vendor', 'Description', 'Method', 'Amount'], [...successfulPayments.map(p => ['Income', p.date, p.reference, '', '', p.customer, p.method, p.amount]), ...periodExpenses.map(e => ['Expense', e.incurred_at, e.reference, e.category, e.vendor || '', e.description, e.method, e.amount])])
    if (active === 'bookings') return downloadCsv(`blue-pair-bookings-${start}-to-${end}.csv`, ['Created', 'Booking', 'Customer', 'Check-in', 'Check-out', 'Guests', 'Amount', 'Payment', 'Status', 'Source'], periodBookings.map(b => [b.createdAt, b.reference, customers.find(c => c.id === b.customerId)?.name, b.checkIn, b.checkOut, `${b.adults} adults / ${b.children} children`, b.amount, b.paymentStatus, b.status, (b as any).source || 'online']))
    if (active === 'housekeeping') return downloadCsv(`blue-pair-housekeeping-${start}-to-${end}.csv`, ['Room', 'Room type', 'Status', 'Priority', 'Assigned to', 'Completed at'], housekeepingTasks.map(t => [t.room, t.roomType, t.status, t.priority, t.assignedTo, t.completedAt]))
    if (active === 'maintenance') return downloadCsv(`blue-pair-maintenance-${start}-to-${end}.csv`, ['Room', 'Issue', 'Priority', 'Assigned to', 'Date reported', 'Status'], maintenanceTickets.filter(t => inRange(t.dateReported, start, end)).map(t => [t.room, t.issue, t.priority, t.assignedTo, t.dateReported, t.status]))
    return downloadCsv(`blue-pair-${active}-${start}-to-${end}.csv`, ['Metric', 'Value'], [['Revenue', revenue], ['Expenses', periodExpenseTotal], ['Net income', periodNet], ['Bookings', periodBookings.length], ['Cancelled', cancelled], ['Occupancy', `${occupancy}%`], ['Check-ins', checkIns], ['Check-outs', checkOuts], ['Pending value', pendingValue], ['Open maintenance', openMaintenance], ['Open guest requests', openRequests]])
  }

  return <div>
    <div className="flex items-start justify-between gap-4 mb-5 flex-wrap"><div><h1 className="text-2xl font-semibold">Reports & Analytics</h1><p className="text-sm text-navy-400 mt-1">A live owner view of money, guests, rooms and hotel operations.</p></div><button onClick={exportReport} className="btn-outline flex items-center gap-2"><Download size={15} /> Download report</button></div>
    <div className="card p-4 mb-6 flex flex-wrap items-center gap-2">{(['week', 'month', 'year', 'custom'] as Range[]).map(r => <button key={r} onClick={() => setRange(r)} className={`px-4 py-2 rounded-full text-xs font-semibold capitalize ${range === r ? 'bg-navy-950 text-white' : 'bg-navy-50 text-navy-500'}`}>{r === 'custom' ? 'Custom' : `This ${r}`}</button>)}{range === 'custom' && <div className="flex items-center gap-2 ml-1"><input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="field-input text-xs" /><span className="text-xs text-navy-400">to</span><input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="field-input text-xs" /></div>}<span className="ml-auto text-xs text-navy-400">{start} → {end}</span></div>
    <div className="flex gap-2 mb-8 flex-wrap">{REPORTS.map(r => <button key={r.key} onClick={() => router.push(`/admin/reports/${r.key}`)} className={'px-3.5 py-2 rounded-full text-xs font-semibold border ' + (active === r.key ? 'bg-navy-950 text-white border-navy-950' : 'border-black/15')}>{r.label}</button>)}</div>
    {!loaded ? <div className="card p-10 text-center text-sm text-navy-400">Loading live report data…</div> : <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"><StatCard label="Collected revenue" value={naira(revenue)} icon={<Wallet size={17} />} tint="green" /><StatCard label="Expenses" value={naira(periodExpenseTotal)} icon={<ReceiptText size={17} />} deltaTone={periodExpenseTotal ? 'down' : undefined} /><StatCard label="Net income" value={naira(periodNet)} icon={<CircleDollarSign size={17} />} tint={periodNet >= 0 ? 'green' : 'navy'} /><StatCard label="Occupancy" value={`${occupancy}%`} icon={<BedDouble size={17} />} tint="navy" /></div>
      {active === 'finance' && <div className="space-y-6">{financeError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{financeError}</div>}{financeLoading && !finance ? <div className="card p-10 text-center text-sm text-navy-400">Loading finance report…</div> : finance && <><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"><div className="card p-5"><span className="text-xs text-navy-400">Gross income</span><b className="block text-2xl font-display mt-1">{naira(periodGrossIncome)}</b></div><div className="card p-5"><span className="text-xs text-navy-400">Expenses</span><b className="block text-2xl font-display mt-1 text-red-700">{naira(periodExpenseTotal)}</b></div><div className="card p-5"><span className="text-xs text-navy-400">Net income</span><b className={`block text-2xl font-display mt-1 ${periodNet >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{naira(periodNet)}</b></div><div className="card p-5"><span className="text-xs text-navy-400">Ledger total</span><b className="block text-2xl font-display mt-1">{naira(finance.net)}</b><p className="text-xs text-navy-400 mt-2">All posted periods</p></div></div><div className="grid lg:grid-cols-2 gap-6"><div className="card p-6"><h3 className="font-semibold mb-4">Income by method</h3><div className="space-y-3">{(['Paystack', 'Cash', 'POS'] as const).map(method => <div key={method} className="flex items-center justify-between rounded-xl bg-navy-50 px-4 py-3"><span className="text-sm text-navy-600">{method}</span><b>{naira(finance.byMethod[method] || 0)}</b></div>)}</div></div><div className="card p-6"><h3 className="font-semibold mb-4">Expenses in selected period</h3>{periodExpenses.length ? <div className="space-y-3">{periodExpenses.map(e => <div key={e.id} className="flex items-center justify-between border-b border-black/5 pb-3 last:border-0"><div className="min-w-0"><b className="text-sm">{e.category}</b><p className="truncate text-xs text-navy-400">{e.description} · {e.method}</p></div><b className="ml-4 shrink-0 text-red-700">−{naira(Number(e.amount))}</b></div>)}</div> : <p className="text-sm text-navy-400">No expenses recorded in this period.</p>}</div></div></>}</div>}
      {active === 'revenue' && <div className="space-y-6"><div className="grid lg:grid-cols-3 gap-4"><div className="card p-5"><span className="text-xs text-navy-400">Paid successfully</span><b className="block text-2xl font-display mt-1">{naira(revenue)}</b></div><div className="card p-5"><span className="text-xs text-navy-400">Operating expenses</span><b className="block text-2xl font-display mt-1 text-red-700">{naira(periodExpenseTotal)}</b></div><div className="card p-5"><span className="text-xs text-navy-400">Net operating income</span><b className={`block text-2xl font-display mt-1 ${periodNet >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{naira(periodNet)}</b></div></div><div className="card p-6"><h3 className="font-semibold">Money collected over time</h3><p className="text-xs text-navy-400 mt-1 mb-4">Only successful payments are included.</p>{revenueChart.length ? <ResponsiveContainer width="100%" height={280}><BarChart data={revenueChart}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" /><XAxis dataKey="date" fontSize={11} axisLine={false} tickLine={false} /><YAxis fontSize={10} axisLine={false} tickLine={false} /><Tooltip formatter={(v: number) => naira(v)} /><Bar dataKey="value" fill="#C79A3E" radius={[6,6,2,2]} /></BarChart></ResponsiveContainer> : <div className="h-[280px] flex items-center justify-center text-sm text-navy-400">No successful payments in this period.</div>}</div></div>}
      {active === 'occupancy' && <div className="grid lg:grid-cols-2 gap-6"><div className="card p-6"><h3 className="font-semibold">Occupancy calculation</h3><p className="text-sm text-navy-400 mt-1 mb-5">Booked room-nights compared with the hotel's room inventory for the selected period.</p><div className="text-5xl font-display">{occupancy}%</div><div className="grid grid-cols-2 gap-3 mt-6"><div className="rounded-xl bg-navy-50 p-4"><span className="text-xs text-navy-400">Booked room-nights</span><b className="block text-lg mt-1">{bookingNights}</b></div><div className="rounded-xl bg-navy-50 p-4"><span className="text-xs text-navy-400">Available room-nights</span><b className="block text-lg mt-1">{roomNights}</b></div></div></div><div className="card p-6"><h3 className="font-semibold mb-5">Current room status</h3><div className="space-y-3">{['occupied', 'available', 'cleaning_required', 'maintenance'].map(status => { const count = rooms.filter(r => r.status === status).length; return <div key={status} className="flex justify-between border-b border-black/5 pb-3 text-sm"><span className="capitalize text-navy-500">{status.replace('_', ' ')}</span><b>{count}</b></div> })}</div></div></div>}
      {active === 'bookings' && <div className="space-y-6"><div className="grid sm:grid-cols-3 gap-4"><StatCard label="Cancelled" value={String(cancelled)} deltaTone="down" /><StatCard label="Check-ins" value={String(checkIns)} tint="green" /><StatCard label="Check-outs" value={String(checkOuts)} tint="navy" /></div><div className="card p-6"><h3 className="font-semibold mb-4">Booking source</h3><div className="grid sm:grid-cols-2 gap-4">{Object.entries(sourceCounts).map(([source, count]) => <div key={source} className="rounded-xl bg-navy-50 p-5"><span className="text-xs text-navy-400">{source}</span><b className="block text-2xl mt-1">{count}</b><span className="text-xs text-navy-400">{periodBookings.length ? Math.round(count / periodBookings.length * 100) : 0}% of bookings</span></div>)}</div></div></div>}
      {active === 'payments' && <div className="grid lg:grid-cols-2 gap-6"><div className="card p-6"><h3 className="font-semibold mb-4">Payment methods</h3><div className="space-y-4">{(['Paystack', 'Cash', 'POS'] as const).map(method => <div key={method} className="flex items-center justify-between"><div><b className="text-sm">{method}</b><p className="text-xs text-navy-400">{successfulPayments.filter(p => String(p.method).toLowerCase() === method.toLowerCase()).length} successful transactions</p></div><b>{naira(methodTotals[method] || 0)}</b></div>)}</div></div><div className="card p-6"><h3 className="font-semibold mb-4">Payment status</h3><div className="space-y-3">{Object.entries(periodPayments.reduce<Record<string, number>>((m, p) => { const k = String(p.status); m[k] = (m[k] || 0) + 1; return m }, {})).map(([status, count]) => <div key={status} className="flex justify-between text-sm border-b border-black/5 pb-3"><span className="capitalize">{status}</span><b>{count}</b></div>)}</div></div></div>}
      {active === 'housekeeping' && <div className="grid sm:grid-cols-3 gap-4"><StatCard label="Tasks" value={String(housekeepingTasks.length)} icon={<Sparkles size={17} />} /><StatCard label="Completed" value={String(housekeepingTasks.filter(t => ['completed', 'cleaned'].includes(String(t.status).toLowerCase())).length)} tint="green" /><StatCard label="Rooms needing attention" value={String(rooms.filter(r => r.status === 'cleaning_required').length)} deltaTone="down" /></div>}
      {active === 'maintenance' && <div className="grid sm:grid-cols-3 gap-4"><StatCard label="Open issues" value={String(openMaintenance)} icon={<Wrench size={17} />} deltaTone={openMaintenance ? 'down' : undefined} /><StatCard label="Reported in period" value={String(maintenanceTickets.filter(t => inRange(t.dateReported, start, end)).length)} /><StatCard label="Resolved/closed" value={String(maintenanceTickets.filter(t => ['resolved', 'closed', 'completed'].includes(String(t.status).toLowerCase())).length)} tint="green" /></div>}
      {active === 'operations' && <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"><StatCard label="Guests currently staying" value={String(bookings.filter(b => b.status === 'checked_in').length)} icon={<Users size={17} />} /><StatCard label="Customers" value={String(customers.length)} /><StatCard label="Open guest requests" value={String(openRequests)} /><StatCard label="Rooms" value={String(rooms.length)} /></div>}
      <div className="card p-5 mt-6"><div className="flex items-center gap-3"><Activity size={18} className="text-gold-600" /><div><h3 className="font-semibold text-sm">Owner's reading</h3><p className="text-xs text-navy-400 mt-1">For {start} to {end}: {periodBookings.length} bookings, {successfulPayments.length} successful payments, {checkIns} check-ins, {checkOuts} check-outs, {naira(periodExpenseTotal)} in expenses and {naira(periodNet)} net income.</p></div></div></div>
    </>}
  </div>
}
