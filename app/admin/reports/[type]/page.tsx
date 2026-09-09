'use client'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, CartesianGrid } from 'recharts'
import StatCard from '../../../../components/ui/StatCard'
import { naira } from '../../../../lib/format'
import { Wallet, TrendingUp, CalendarCheck, UtensilsCrossed, Building2, CreditCard, Sparkles, Wrench, PartyPopper } from 'lucide-react'

const REPORTS = [
  { key: 'revenue', label: 'Revenue' },
  { key: 'occupancy', label: 'Occupancy' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'restaurant-bar', label: 'Restaurant & Bar' },
  { key: 'shortlet', label: 'Short-let' },
  { key: 'payments', label: 'Payments' },
  { key: 'housekeeping', label: 'Housekeeping' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'events-billboard', label: 'Events & Billboard' },
]

const monthly = [
  { m: 'Mar', v: 62 }, { m: 'Apr', v: 71 }, { m: 'May', v: 68 }, { m: 'Jun', v: 79 }, { m: 'Jul', v: 84 }, { m: 'Aug', v: 76 },
]
const weeklyRevenue = [
  { d: 'W1', v: 14200000 }, { d: 'W2', v: 16800000 }, { d: 'W3', v: 15100000 }, { d: 'W4', v: 18900000 },
]
const occPie = [
  { name: 'Occupied', value: 40, color: '#22346E' }, { name: 'Available', value: 33, color: '#4E5D45' },
  { name: 'Cleaning', value: 13, color: '#C79A3E' }, { name: 'Maintenance', value: 7, color: '#9C4A3B' },
]

export default function ReportsPage({ params }: { params: { type: string } }) {
  const router = useRouter()
  const active = params.type ?? 'revenue'

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Reports &amp; Analytics</h1>
      <div className="flex gap-2 mb-8 flex-wrap">
        {REPORTS.map(r => (
          <button key={r.key} onClick={() => router.push(`/admin/reports/${r.key}`)}
            className={'px-3.5 py-2 rounded-full text-xs font-semibold border ' + (active === r.key ? 'bg-navy-950 text-white border-navy-950' : 'border-black/15')}>
            {r.label}
          </button>
        ))}
      </div>

      {active === 'revenue' && (
        <div>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <StatCard label="This month" value={naira(65000000)} icon={<Wallet size={17}/>} delta="9.2% vs last month" tint="green" />
            <StatCard label="This week" value={naira(18900000)} icon={<TrendingUp size={17}/>} delta="new high" tint="green" />
            <StatCard label="Avg. daily rate" value={naira(148000)} tint="navy" />
          </div>
          <div className="card p-6"><h3 className="font-semibold mb-4">Weekly revenue (this month)</h3>
            <ResponsiveContainer width="100%" height={260}><BarChart data={weeklyRevenue}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" /><XAxis dataKey="d" fontSize={12} axisLine={false} tickLine={false} /><Tooltip formatter={(v:number)=>naira(v)} /><Bar dataKey="v" fill="#C79A3E" radius={[6,6,2,2]} /></BarChart></ResponsiveContainer>
          </div>
        </div>
      )}

      {active === 'occupancy' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-6"><h3 className="font-semibold mb-4">Room status split</h3>
            <div className="flex items-center gap-8">
              <ResponsiveContainer width={160} height={160}><PieChart><Pie data={occPie} dataKey="value" innerRadius={45} outerRadius={72}>{occPie.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie></PieChart></ResponsiveContainer>
              <div className="flex flex-col gap-2 text-xs">{occPie.map(d=><span key={d.name} className="flex items-center gap-2"><i className="w-2.5 h-2.5 rounded-sm" style={{background:d.color}}/>{d.name} — {d.value}%</span>)}</div>
            </div>
          </div>
          <div className="card p-6"><h3 className="font-semibold mb-4">Occupancy trend (%)</h3>
            <ResponsiveContainer width="100%" height={220}><LineChart data={monthly}><XAxis dataKey="m" fontSize={12} axisLine={false} tickLine={false}/><YAxis fontSize={11} axisLine={false} tickLine={false}/><Tooltip /><Line type="monotone" dataKey="v" stroke="#22346E" strokeWidth={2.5} dot={{r:3}}/></LineChart></ResponsiveContainer>
          </div>
        </div>
      )}

      {active === 'bookings' && (
        <div>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <StatCard label="Bookings this month" value="212" icon={<CalendarCheck size={17}/>} delta="18 vs last month" tint="green" />
            <StatCard label="Cancellation rate" value="4.1%" deltaTone="down" />
            <StatCard label="Avg. length of stay" value="2.6 nights" tint="navy" />
          </div>
          <div className="card p-6"><h3 className="font-semibold mb-4">Bookings by month</h3>
            <ResponsiveContainer width="100%" height={240}><BarChart data={monthly}><XAxis dataKey="m" fontSize={12} axisLine={false} tickLine={false}/><Tooltip /><Bar dataKey="v" fill="#22346E" radius={[6,6,2,2]} /></BarChart></ResponsiveContainer>
          </div>
        </div>
      )}

      {active === 'restaurant-bar' && (
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="card p-6 flex items-center gap-4"><div className="w-12 h-12 rounded-lg bg-gold-50 text-gold-600 flex items-center justify-center"><UtensilsCrossed size={20}/></div><div><span className="text-xs text-navy-400 block">Restaurant sales, this month</span><b className="font-display text-xl">{naira(19400000)}</b></div></div>
          <div className="card p-6 flex items-center gap-4"><div className="w-12 h-12 rounded-lg bg-gold-50 text-gold-600 flex items-center justify-center"><UtensilsCrossed size={20}/></div><div><span className="text-xs text-navy-400 block">Bar sales, this month</span><b className="font-display text-xl">{naira(11200000)}</b></div></div>
        </div>
      )}

      {active === 'shortlet' && (
        <div className="grid sm:grid-cols-3 gap-4">
          <StatCard label="Short-let bookings" value="14" icon={<Building2 size={17}/>} tint="navy" />
          <StatCard label="Short-let revenue" value={naira(4600000)} tint="green" />
          <StatCard label="Occupancy" value="67%" />
        </div>
      )}

      {active === 'payments' && (
        <div className="grid sm:grid-cols-3 gap-4">
          <StatCard label="Transactions this month" value="342" icon={<CreditCard size={17}/>} tint="navy" />
          <StatCard label="Success rate" value="97.2%" tint="green" />
          <StatCard label="Refunded" value={naira(350000)} deltaTone="down" />
        </div>
      )}

      {active === 'housekeeping' && (
        <div className="grid sm:grid-cols-3 gap-4">
          <StatCard label="Rooms cleaned this week" value="86" icon={<Sparkles size={17}/>} tint="green" />
          <StatCard label="Avg. cleaning time" value="24 min" tint="navy" />
          <StatCard label="Tasks completed" value="94%" />
        </div>
      )}

      {active === 'maintenance' && (
        <div className="grid sm:grid-cols-3 gap-4">
          <StatCard label="Open issues" value="2" icon={<Wrench size={17}/>} deltaTone="down" />
          <StatCard label="Resolved this month" value="17" tint="green" />
          <StatCard label="Avg. resolution time" value="6.2 hrs" tint="navy" />
        </div>
      )}

      {active === 'events-billboard' && (
        <div className="grid sm:grid-cols-3 gap-4">
          <StatCard label="Event revenue" value={naira(3200000)} icon={<PartyPopper size={17}/>} tint="green" />
          <StatCard label="Billboard bookings" value="2 active" tint="navy" />
          <StatCard label="Advertising revenue" value={naira(730000)} tint="green" />
        </div>
      )}
    </div>
  )
}
