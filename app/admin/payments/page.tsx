'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { fetchPaymentTotals } from '../../../lib/adminQueries'
import { mapPayment } from '../../../lib/mappers'
import type { Payment } from '../../../data/mock'
import { naira, formatDate } from '../../../lib/format'
import StatusBadge from '../../../components/ui/StatusBadge'
import StatCard from '../../../components/ui/StatCard'
import { Wallet, RefreshCcw, Clock } from 'lucide-react'

const PAGE_SIZE = 50

export default function PaymentManagement() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [totals, setTotals] = useState({ total: 0, refunded: 0, pending: 0 })
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [hasMore, setHasMore] = useState(false)

  // The table shows the newest payments a page at a time; the three totals are still for all payments
  // but are read from the database without downloading whole payment rows.
  const loadPayments = useCallback(async () => {
    const { data, error } = await supabase.from('payments').select('*').order('date', { ascending: false }).order('id').limit(visibleCount + 1)
    if (error || !data) return
    setHasMore(data.length > visibleCount)
    setPayments(data.slice(0, visibleCount).map(mapPayment))
  }, [visibleCount])

  const loadTotals = useCallback(async () => {
    const result = await fetchPaymentTotals(supabase)
    if (result) setTotals(result)
  }, [])

  useEffect(() => { void loadPayments() }, [loadPayments])
  useEffect(() => { void loadTotals() }, [loadTotals])

  useEffect(() => {
    const handleDbChange = (e: CustomEvent<{ table?: string }>) => {
      if (!e.detail?.table || e.detail.table === 'payments') { void loadPayments(); void loadTotals() }
    }
    window.addEventListener('bluepair:database-change', handleDbChange as EventListener)
    return () => window.removeEventListener('bluepair:database-change', handleDbChange as EventListener)
  }, [loadPayments, loadTotals])

  const { total, refunded, pending } = totals

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
        {hasMore && <div className="p-4 text-center border-t border-black/5"><button onClick={() => setVisibleCount(count => count + PAGE_SIZE)} className="text-sm font-semibold text-navy-900 underline underline-offset-4">Show more payments</button></div>}
      </div>
    </div>
  )
}
