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
import { X, UserRound, Building2, Utensils, ReceiptText, Loader2 } from 'lucide-react'

const PAGE_SIZE = 50

export default function PaymentManagement() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [totals, setTotals] = useState({ total: 0, refunded: 0, pending: 0 })
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [hasMore, setHasMore] = useState(false)
  const [detail, setDetail] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  const showPaymentDetails = async (id: string) => {
    setDetail(null)
    setDetailError('')
    setDetailLoading(true)
    try {
      const response = await fetch(`/api/admin/payments/${encodeURIComponent(id)}`, { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Unable to load payment details.')
      setDetail(payload)
    } catch (error: any) {
      setDetailError(error.message || 'Unable to load payment details.')
    } finally {
      setDetailLoading(false)
    }
  }

  const serviceName = (value: any) => value.roomService ? 'Room service order' : value.barOrder ? `${String(value.barOrder.outlet || 'food and drinks').replace(/_/g, ' ')} order` : value.booking ? 'Hotel room stay' : 'Other service'

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
            <th className="p-4">Reference</th><th className="p-4">Service</th><th className="p-4">Customer</th><th className="p-4">Method</th><th className="p-4">Date</th><th className="p-4">Amount</th><th className="p-4">Status</th>
          </tr></thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id} className="border-b border-black/5 last:border-none">
                <td className="p-4 font-medium">{p.reference}</td>
                <td className="p-4"><button onClick={() => void showPaymentDetails(p.id)} className="rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-navy-800 hover:bg-navy-50">View service details</button></td>
                <td className="p-4"><button onClick={() => void showPaymentDetails(p.id)} className="rounded-lg px-2.5 py-1.5 text-left text-sm font-medium text-gold-700 hover:bg-gold-50">{p.customer || 'View customer'}</button></td>
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
      {(detailLoading || detailError || detail) && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-navy-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-5" onClick={() => { setDetail(null); setDetailError('') }}><div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7" onClick={event => event.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-3"><div><p className="eyebrow">Payment details</p><h2 className="mt-1 text-xl font-semibold">{detail ? serviceName(detail) : 'Loading payment…'}</h2></div><button onClick={() => { setDetail(null); setDetailError('') }} aria-label="Close" className="rounded-full bg-black/5 p-2 hover:bg-black/10"><X size={18} /></button></div>
        {detailLoading && <div className="flex items-center justify-center gap-2 py-12 text-sm text-navy-400"><Loader2 className="animate-spin" size={17} />Loading full payment details…</div>}
        {detailError && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{detailError}</div>}
        {detail && <div className="space-y-5">
          <section className="grid gap-3 sm:grid-cols-2"><Info label="Amount paid" value={naira(Number(detail.payment.amount))} /><Info label="Payment status" value={String(detail.payment.status).replace(/_/g, ' ')} /><Info label="Payment date" value={formatDate(detail.payment.date)} /><Info label="Method" value={detail.payment.method || '—'} /><Info label="Payment reference" value={detail.payment.reference || '—'} /><Info label="Order / booking reference" value={detail.roomService?.reference || detail.barOrder?.reference || detail.booking?.reference || detail.payment.booking_ref || '—'} /></section>
          {detail.booking && <section className="rounded-2xl border border-black/5 p-5"><h3 className="mb-3 flex items-center gap-2 font-semibold"><Building2 size={16} />Full room stay</h3><div className="grid gap-3 sm:grid-cols-2"><Info label="Room type" value={detail.roomType?.name || 'Hotel room'} /><Info label="Assigned room" value={detail.room?.room_number ? `Room ${detail.room.room_number}` : 'Not assigned'} /><Info label="Check-in" value={formatDate(detail.booking.check_in)} /><Info label="Check-out" value={formatDate(detail.booking.check_out)} /><Info label="Guests" value={`${detail.booking.adults ?? 1} adults · ${detail.booking.children ?? 0} children`} /><Info label="Booking status" value={String(detail.booking.status).replace(/_/g, ' ')} /></div>{detail.booking.special_requests && <p className="mt-3 rounded-xl bg-navy-50 p-3 text-sm">Request: {detail.booking.special_requests}</p>}</section>}
          {detail.roomService && <section className="rounded-2xl border border-black/5 p-5"><h3 className="mb-3 flex items-center gap-2 font-semibold"><Utensils size={16} />Full room service order</h3><p className="mb-3 text-sm text-navy-500">Room {detail.roomService.room} · {detail.roomService.reference}</p><OrderItems items={detail.roomService.items} /><p className="mt-3 text-right font-semibold">Order total: {naira(Number(detail.roomService.total))}</p>{detail.roomService.notes && <p className="mt-3 text-sm text-navy-500">Note: {detail.roomService.notes}</p>}</section>}
          {detail.barOrder && <section className="rounded-2xl border border-black/5 p-5"><h3 className="mb-3 flex items-center gap-2 font-semibold"><Utensils size={16} />Full food and drinks order</h3><p className="mb-3 text-sm text-navy-500">{detail.barOrder.delivery_label} · {detail.barOrder.reference}</p><OrderItems items={detail.barItems.map((item: any) => ({ name: item.drink_name, quantity: item.quantity, lineTotal: item.line_total }))} /><p className="mt-3 text-right font-semibold">Order total: {naira(Number(detail.barOrder.total))}</p>{detail.barOrder.notes && <p className="mt-3 text-sm text-navy-500">Note: {detail.barOrder.notes}</p>}</section>}
          {detail.customer && <section className="rounded-2xl border border-gold-200 bg-gold-50/40 p-5"><h3 className="mb-3 flex items-center gap-2 font-semibold"><UserRound size={16} />Customer details</h3><div className="grid gap-3 sm:grid-cols-2"><Info label="Full name" value={detail.customer.name || '—'} /><Info label="Email" value={detail.customer.email || '—'} /><Info label="Phone" value={detail.customer.phone || '—'} /><Info label="Customer status" value={detail.customer.status || '—'} /></div></section>}
        </div>}
      </div></div>}
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-navy-50/70 p-3"><div className="text-[11px] text-navy-400">{label}</div><div className="mt-1 break-words text-sm font-medium capitalize text-navy-800">{value}</div></div> }
function OrderItems({ items }: { items: any }) { const rows = Array.isArray(items) ? items : []; return rows.length ? <div className="divide-y divide-black/5">{rows.map((item: any, index: number) => <div key={`${item.id || item.name || 'item'}-${index}`} className="flex items-center justify-between gap-3 py-2 text-sm"><span>{item.quantity || 1} × {item.name || item.drink_name || 'Item'}</span><b>{naira(Number(item.lineTotal ?? item.line_total ?? item.price ?? 0))}</b></div>)}</div> : <p className="text-sm text-navy-400">Order item details are unavailable.</p> }
