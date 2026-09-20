'use client'

import { useEffect, useState } from 'react'
import { Calendar, Loader2, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth, ensureCustomer } from '../../../../../lib/useAuth'
import { naira, nightsBetween, todayISO, addDaysISO, formatDate } from '../../../../../lib/format'

export default function ShortLetBookingClient({ shortLet }: { shortLet: { id:string; name:string; price:number; bedrooms:number; available:boolean } }) {
  const router = useRouter()
  const auth = useAuth()
  const [checkIn, setCheckIn] = useState(todayISO())
  const [checkOut, setCheckOut] = useState(addDaysISO(2))
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const nights = Math.max(1, nightsBetween(checkIn, checkOut))
  const subtotal = shortLet.price * nights
  const tax = Math.round(subtotal * 0.075)
  const total = subtotal + tax

  useEffect(() => {
    const onDates = (event: Event) => {
      const d = (event as CustomEvent<{checkIn?:string;checkOut?:string}>).detail
      if (d?.checkIn) setCheckIn(d.checkIn)
      if (d?.checkOut) setCheckOut(d.checkOut)
    }
    window.addEventListener('bluepair:booking-dates-change', onDates)
    return () => window.removeEventListener('bluepair:booking-dates-change', onDates)
  }, [])

  async function book() {
    if (!auth.userId) {
      router.push(`/account/login?redirect=\${encodeURIComponent(window.location.pathname)}`)
      return
    }
    if (checkIn >= checkOut) { setError('Check-out must be after check-in.'); return }
    setSubmitting(true); setError(null)
    try {
      const customerId = await ensureCustomer(
        auth.userId,
        auth.customer?.name || auth.profile?.name || 'Guest',
        auth.customer?.email || auth.profile?.email || auth.email || '',
        auth.customer?.phone || auth.profile?.phone || '',
      )
      const response = await fetch('/api/shortlets/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shortLetId: shortLet.id, customerId, checkIn, checkOut, adults, children }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.bookingId) throw new Error(data.error || 'Unable to reserve this short-let.')
      const payment = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: data.bookingId }),
      })
      const paymentData = await payment.json().catch(() => ({}))
      if (!payment.ok || !paymentData.authorizationUrl) throw new Error(paymentData.error || 'Unable to open Paystack checkout.')
      window.location.assign(paymentData.authorizationUrl)
    } catch (e:any) {
      setError(e?.message || 'Unable to start booking.')
      setSubmitting(false)
    }
  }

  if (!shortLet.available) return <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">This property is currently unavailable.</div>

  return <div className="card p-6">
    <div className="font-display text-2xl">{naira(shortLet.price)}<span className="text-xs font-body text-navy-400"> /night</span></div>
    <div className="grid grid-cols-2 gap-3 mt-5">
      <div><label className="field-label flex items-center gap-1"><Calendar size={13}/>Check-in</label><input type="date" className="field-input" value={checkIn} onChange={e=>setCheckIn(e.target.value)}/></div>
      <div><label className="field-label flex items-center gap-1"><Calendar size={13}/>Check-out</label><input type="date" className="field-input" value={checkOut} onChange={e=>setCheckOut(e.target.value)}/></div>
    </div>
    <div className="grid grid-cols-2 gap-3 mt-3">
      <div><label className="field-label flex items-center gap-1"><Users size={13}/>Adults</label><select className="field-input" value={adults} onChange={e=>setAdults(Number(e.target.value))}>{[1,2,3,4,5,6].map(n=><option key={n}>{n}</option>)}</select></div>
      <div><label className="field-label">Children</label><select className="field-input" value={children} onChange={e=>setChildren(Number(e.target.value))}>{[0,1,2,3,4].map(n=><option key={n}>{n}</option>)}</select></div>
    </div>
    <div className="mt-5 space-y-1 text-sm"><div className="flex justify-between"><span>{naira(shortLet.price)} × {nights} nights</span><b>{naira(subtotal)}</b></div><div className="flex justify-between"><span>Taxes & VAT</span><b>{naira(tax)}</b></div><div className="flex justify-between border-t border-black/10 pt-3 mt-2 font-semibold"><span>Total</span><b className="font-display">{naira(total)}</b></div></div>
    {error && <div className="mt-4 rounded-lg bg-red-50 text-red-700 text-xs px-3 py-2.5">{error}</div>}
    <button onClick={()=>void book()} disabled={submitting} className="btn-gold w-full justify-center mt-5">{submitting?<><Loader2 size={15} className="animate-spin"/>Opening Paystack…</>:\`Book this property — \${naira(total)}\`}</button>
    <p className="text-[11px] text-navy-400 mt-3 text-center">Your reservation is held for the payment window. Paystack confirms the booking after successful payment.</p>
    <p className="text-[11px] text-navy-400 mt-1 text-center">{formatDate(checkIn)} → {formatDate(checkOut)}</p>
  </div>
}
