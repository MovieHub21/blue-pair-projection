'use client'
import { useStore } from '../../../store/useStore'
import { naira, formatDate } from '../../../lib/format'
import StatusBadge from '../../../components/ui/StatusBadge'
import StatCard from '../../../components/ui/StatCard'
import { Wallet, RefreshCcw, Clock } from 'lucide-react'

export default function PaymentManagement() {
  const { payments } = useStore()
  const total = payments.filter(p=>p.status==='success').reduce((s,p)=>s+p.amount,0)
  const refunded = payments.filter(p=>p.status==='refunded').reduce((s,p)=>s+p.amount,0)
  const pending = payments.filter(p=>p.status==='pending').length

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Payment Management</h1>
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total received" value={naira(total)} icon={<Wallet size={17}/>} tint="green" />
        <StatCard label="Refunded" value={naira(refunded)} icon={<RefreshCcw size={17}/>} />
        <StatCard label="Pending transactions" value={String(pending)} icon={<Clock size={17}/>} />
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead><tr className="text-left text-xs text-navy-400 border-b border-black/5">
            <th className="p-4">Reference</th><th className="p-4">Booking</th><th className="p-4">Customer</th><th className="p-4">Method</th><th className="p-4">Date</th><th className="p-4">Amount</th><th className="p-4">Status</th>
          </tr></thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id} className="border-b border-black/5 last:border-none">
                <td className="p-4 font-medium">{p.reference}</td>
                <td className="p-4 text-navy-500">{p.bookingRef}</td>
                <td className="p-4 text-navy-500">{p.customer}</td>
                <td className="p-4 text-navy-500">{p.method}</td>
                <td className="p-4 text-navy-500">{formatDate(p.date)}</td>
                <td className="p-4 font-display">{naira(p.amount)}</td>
                <td className="p-4"><StatusBadge status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
