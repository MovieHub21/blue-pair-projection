'use client'
import { useStore } from '../../../store/useStore'
import { naira } from '../../../lib/format'
import StatCard from '../../../components/ui/StatCard'
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts'
import { Wallet, BedDouble, LogIn, LogOut, ClipboardList, UtensilsCrossed, Martini, Building2 } from 'lucide-react'
import LiveDateTime from '../../../components/ui/LiveDateTime'
import { todayISO } from '../../../lib/format'

const revenueData = [
  { day: 'Mon', value: 2100000 }, { day: 'Tue', value: 2600000 }, { day: 'Wed', value: 1950000 },
  { day: 'Thu', value: 2800000 }, { day: 'Fri', value: 3400000 }, { day: 'Sat', value: 4100000 }, { day: 'Sun', value: 3650000 },
]
const bookingSourceData = [
  { name: 'Direct', value: 44, color: '#C79A3E' }, { name: 'Booking.com', value: 28, color: '#22346E' }, { name: 'Walk-in', value: 18, color: '#4E5D45' }, { name: 'Corporate', value: 10, color: '#D6D0BC' },
]

export default function AdminDashboardPage() {
  const { rooms, bookings } = useStore()
  const occupied = rooms.filter(r => r.status === 'occupied').length
  const available = rooms.filter(r => r.status === 'available').length
  const cleaningReq = rooms.filter(r => r.status === 'cleaning_required').length
  const today = todayISO()
  const todayCheckins = bookings.filter(b => b.checkIn === today).length
  const todayCheckouts = bookings.filter(b => b.checkOut === today).length
  const pending = bookings.filter(b => b.status === 'pending').length

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
       <div>
      <span className="eyebrow">
         <LiveDateTime /> 
      </span>

      <h1 className="text-2xl font-semibold mt-1">
        Front desk overview
      </h1>
    </div>
  
        <button className="btn-primary btn-sm">+ New booking</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Today's revenue" value={naira(3650000)} icon={<Wallet size={17} />} delta="12.4% vs yesterday" />
        <StatCard label="Occupancy rate" value={`${Math.round((occupied/rooms.length)*100)}%`} icon={<BedDouble size={17} />} delta={`${available} rooms available`} tint="green" />
        <StatCard label="Check-ins today" value={String(todayCheckins || 4)} icon={<LogIn size={17} />} delta="2 already arrived" tint="navy" />
        <StatCard label="Check-outs today" value={String(todayCheckouts || 3)} icon={<LogOut size={17} />} delta="1 pending, past 11am" deltaTone="down" tint="navy" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Available rooms" value={String(available)} tint="green" />
        <StatCard label="Occupied rooms" value={String(occupied)} tint="navy" />
        <StatCard label="Cleaning required" value={String(cleaningReq)} deltaTone="down" />
        <StatCard label="Pending bookings" value={String(pending)} icon={<ClipboardList size={17} />} />
      </div>

      <div className="grid lg:grid-cols-[1.6fr,1fr] gap-6 mb-6">
        <div className="card p-6">
          <div className="flex justify-between items-center mb-2"><h3 className="font-semibold">Revenue, last 7 days</h3><span className="pill-gold">₦20.6M total</span></div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData}>
              <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} stroke="#8b8a80" />
              <Tooltip formatter={(v: number) => naira(v)} cursor={{ fill: '#F5F1E6' }} />
              <Bar dataKey="value" fill="#C79A3E" radius={[6,6,2,2]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Booking sources</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={140} height={140}>
              <PieChart><Pie data={bookingSourceData} dataKey="value" innerRadius={40} outerRadius={64} paddingAngle={2}>
                {bookingSourceData.map((d,i) => <Cell key={i} fill={d.color} />)}
              </Pie></PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 text-xs">
              {bookingSourceData.map(d => <span key={d.name} className="flex items-center gap-2"><i className="w-2.5 h-2.5 rounded-sm" style={{background:d.color}} />{d.name} — {d.value}%</span>)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4"><div className="w-11 h-11 rounded-lg bg-gold-50 text-gold-600 flex items-center justify-center"><UtensilsCrossed size={18}/></div><div><span className="text-xs text-navy-400 block">Restaurant sales today</span><b className="font-display text-lg">{naira(842000)}</b></div></div>
        <div className="card p-5 flex items-center gap-4"><div className="w-11 h-11 rounded-lg bg-gold-50 text-gold-600 flex items-center justify-center"><Martini size={18}/></div><div><span className="text-xs text-navy-400 block">Bar sales today</span><b className="font-display text-lg">{naira(516000)}</b></div></div>
        <div className="card p-5 flex items-center gap-4"><div className="w-11 h-11 rounded-lg bg-gold-50 text-gold-600 flex items-center justify-center"><Building2 size={18}/></div><div><span className="text-xs text-navy-400 block">Short-let bookings</span><b className="font-display text-lg">2 active</b></div></div>
      </div>
    </div>
  )
}
