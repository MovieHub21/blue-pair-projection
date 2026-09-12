'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Check, Calendar, Users, Wallet, Loader2, ArrowLeft } from 'lucide-react'
import { useStore } from '../../../store/useStore'
import { useAuth, ensureCustomer } from '../../../lib/useAuth'
import { naira, nightsBetween, formatDate, todayISO, addDaysISO } from '../../../lib/format'
import type { RoomType } from '../../../data/mock'

const STEPS = ['Room', 'Dates & Guests', 'Guest Info', 'Summary']

type PaymentResult = 'success' | 'failed' | 'not-configured' | 'amount-mismatch' | 'error' | null

export default function BookingFlowPaystackClient({ roomTypes }: { roomTypes: RoomType[] }) {
  const params = useSearchParams()
  const pathname = usePathname()
  const auth = useAuth()
  const { createBooking } = useStore()
  const [step, setStep] = useState(0)
  const [roomId, setRoomId] = useState(roomTypes.find(r => r.slug === params.get('room'))?.id ?? roomTypes[0]?.id ?? '')
  const [checkIn, setCheckIn] = useState(params.get('checkin') || todayISO())
  const [checkOut, setCheckOut] = useState(params.get('checkout') || addDaysISO(2))
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [guest, setGuest] = useState({ name: '', email: '', phone: '', requests: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const paymentResult = (params.get('payment') || null) as PaymentResult
  const paymentReference = params.get('reference') || ''

  useEffect(() => {
    if (auth.customer || auth.profile) {
      setGuest(g => ({
        ...g,
        name: g.name || auth.customer?.name || auth.profile?.name || '',
        email: g.email || auth.customer?.email || auth.profile?.email || auth.email || '',
        phone: g.phone || auth.customer?.phone || auth.profile?.phone || '',
      }))
    }
  }, [auth.customer, auth.profile, auth.email])

  const room = roomTypes.find(r => r.id === roomId)
  const nights = nightsBetween(checkIn, checkOut)
  const subtotal = (room?.price ?? 0) * nights
  const tax = Math.round(subtotal * 0.075)
  const total = subtotal + tax

  function next() { setStep(s => Math.min(s + 1, STEPS.length - 1)) }
  function back() { setStep(s => Math.max(s - 1, 0)) }

  async function payWithPaystack() {
    if (!auth.userId || !room) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      const customerId = await ensureCustomer(auth.userId, guest.name, guest.email, guest.phone)
      const booking = createBooking({
        customerId,
        roomTypeId: room.id,
        checkIn,
        checkOut,
        adults,
        children,
        amount: total,
        specialRequests: guest.requests || undefined,
      })

      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      })
      const data = await response.json()
      if (!response.ok || !data.authorizationUrl) {
        throw new Error(data.error || 'Unable to open Paystack checkout.')
      }

      window.location.assign(data.authorizationUrl)
    } catch (error: any) {
      setSubmitError(error?.message || 'Something went wrong starting payment.')
      setSubmitting(false)
    }
  }

  if (roomTypes.length === 0 || !room) {
    return (
      <div className="container-w px-6 md:px-10 py-16 max-w-md mx-auto text-center">
        <h2 className="text-2xl font-semibold mb-3">No rooms available right now</h2>
        <p className="text-sm text-navy-500 mb-8">Please check back shortly, or get in touch and we'll help you book directly.</p>
        <Link href="/contact" className="btn-primary">Contact us</Link>
      </div>
    )
  }

  if (paymentResult) {
    const successful = paymentResult === 'success'
    return (
      <div className="container-w px-6 md:px-10 py-16 max-w-lg mx-auto text-center">
        <div className={'w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-5 ' + (successful ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600')}>
          {successful ? <Check size={30} /> : <span className="text-2xl font-bold">!</span>}
        </div>
        <h1 className="text-3xl font-semibold mb-3">{successful ? 'Booking confirmed' : 'Payment not completed'}</h1>
        <p className="text-sm text-navy-500 leading-6 mb-5">
          {successful
            ? 'Your Paystack payment was verified and your booking has been automatically confirmed.'
            : paymentResult === 'not-configured'
              ? 'Online payment is not configured yet. Please contact the hotel or try again later.'
              : paymentResult === 'amount-mismatch'
                ? 'The payment amount could not be verified against your booking. Please contact the hotel before trying again.'
                : 'We could not confirm this payment. Your booking has not been marked as paid.'}
        </p>
        {successful && paymentReference && <div className="card p-4 text-sm mb-6"><span className="text-navy-500">Paystack reference</span><b className="block mt-1 font-mono">{paymentReference}</b></div>}
        <div className="flex gap-3 justify-center">
          <Link href="/account/bookings" className="btn-primary">View my bookings</Link>
          <Link href="/" className="btn-outline">Back home</Link>
        </div>
      </div>
    )
  }

  if (!auth.loading && !auth.userId) {
    const redirect = `${pathname}?${params.toString()}`
    return (
      <div className="container-w px-6 md:px-10 py-16 max-w-md mx-auto text-center">
        <h2 className="text-2xl font-semibold mb-3">Sign in to book</h2>
        <p className="text-sm text-navy-500 mb-8">Create a free account or sign in so we can attach this booking to you and keep it in “My Bookings”.</p>
        <div className="flex gap-3 justify-center">
          <Link href={`/account/login?redirect=${encodeURIComponent(redirect)}`} className="btn-primary">Sign in</Link>
          <Link href={`/account/register?redirect=${encodeURIComponent(redirect)}`} className="btn-outline">Create account</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-w px-6 md:px-10 py-10 max-w-5xl mx-auto">
      <div className="flex items-center gap-1.5 mb-12 overflow-x-auto pb-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-2 px-1">
              <div className={'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ' + (i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-navy-950 text-white' : 'border border-black/15 text-navy-400')}>
                {i < step ? <Check size={13} /> : i + 1}
              </div>
              <span className={'text-xs font-semibold whitespace-nowrap ' + (i <= step ? 'text-navy-900' : 'text-navy-300')}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-black/10" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-6">Select a room</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {roomTypes.map(r => (
              <button key={r.id} onClick={() => setRoomId(r.id)} className={'card p-4 flex gap-4 text-left items-center border-2 ' + (roomId === r.id ? 'border-gold-500' : 'border-transparent')}>
                <img src={r.images[0]} alt={r.name} className="w-20 h-20 rounded-lg object-cover shrink-0" />
                <div className="flex-1">
                  <b className="block text-sm">{r.name}</b>
                  <span className="text-xs text-navy-400">{r.guests} guests · {r.bedType}</span>
                  <div className="font-display text-sm mt-1">{naira(r.price)}<span className="text-[11px] font-body text-navy-400"> /night</span></div>
                </div>
                {roomId === r.id && <Check size={18} className="text-gold-500 shrink-0" />}
              </button>
            ))}
          </div>
          <button onClick={next} className="btn-primary mt-8">Continue</button>
        </div>
      )}

      {step === 1 && (
        <div className="max-w-md">
          <h2 className="text-2xl font-semibold mb-6">Dates &amp; guests</h2>
          <label className="field-label flex items-center gap-1.5"><Calendar size={13} />Check-in</label>
          <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="field-input mb-4" />
          <label className="field-label flex items-center gap-1.5"><Calendar size={13} />Check-out</label>
          <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="field-input mb-4" />
          <div className="grid grid-cols-2 gap-4">
            <div><label className="field-label flex items-center gap-1.5"><Users size={13} />Adults</label><select value={adults} onChange={e => setAdults(Number(e.target.value))} className="field-input">{Array.from({ length: room.guests }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}</select></div>
            <div><label className="field-label">Children</label><select value={children} onChange={e => setChildren(Number(e.target.value))} className="field-input">{[0, 1, 2].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
          </div>
          <p className="text-xs text-navy-400 mt-3">{nights} night{nights > 1 ? 's' : ''} at {room.name}</p>
          <div className="flex gap-3 mt-8"><button onClick={back} className="btn-outline"><ArrowLeft size={14} />Back</button><button onClick={next} className="btn-primary">Continue</button></div>
        </div>
      )}

      {step === 2 && (
        <div className="max-w-md">
          <h2 className="text-2xl font-semibold mb-6">Guest information</h2>
          <label className="field-label">Full name</label><input value={guest.name} onChange={e => setGuest({ ...guest, name: e.target.value })} className="field-input mb-4" placeholder="Efosa Aigbe" />
          <label className="field-label">Email</label><input value={guest.email} onChange={e => setGuest({ ...guest, email: e.target.value })} className="field-input mb-4" placeholder="you@email.com" />
          <label className="field-label">Phone</label><input value={guest.phone} onChange={e => setGuest({ ...guest, phone: e.target.value })} className="field-input mb-4" placeholder="+234 800 000 0000" />
          <label className="field-label">Special requests (optional)</label><input value={guest.requests} onChange={e => setGuest({ ...guest, requests: e.target.value })} className="field-input" placeholder="Late check-in, high floor, etc." />
          <div className="flex gap-3 mt-8"><button onClick={back} className="btn-outline"><ArrowLeft size={14} />Back</button><button onClick={next} className="btn-primary">Continue</button></div>
        </div>
      )}

      {step === 3 && (
        <div className="max-w-md">
          <h2 className="text-2xl font-semibold mb-6">Booking summary</h2>
          <div className="card p-5 flex gap-4 mb-5">
            <img src={room.images[0]} alt={room.name} className="w-16 h-16 rounded-lg object-cover" />
            <div><b className="block text-sm">{room.name}</b><span className="text-xs text-navy-400">{formatDate(checkIn)} → {formatDate(checkOut)} · {adults} adults{children ? `, ${children} children` : ''}</span></div>
          </div>
          <div className="card p-5 flex flex-col gap-1">
            <div className="flex justify-between text-sm py-1.5"><span className="text-navy-500">Guest</span><span>{guest.name}</span></div>
            <div className="flex justify-between text-sm py-1.5"><span className="text-navy-500">{naira(room.price)} × {nights} nights</span><span>{naira(subtotal)}</span></div>
            <div className="flex justify-between text-sm py-1.5"><span className="text-navy-500">Taxes &amp; VAT</span><span>{naira(tax)}</span></div>
            <div className="flex justify-between text-base font-semibold pt-3 mt-2 border-t border-black/10"><span>Total</span><b className="font-display text-lg">{naira(total)}</b></div>
          </div>
          <div className="card mt-5 p-4 border border-gold-400/40 bg-gold-50/50">
            <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-navy-950 text-white flex items-center justify-center"><Wallet size={17} /></div><div><b className="text-sm">Pay securely with Paystack</b><p className="text-xs text-navy-500 mt-0.5">You’ll choose your preferred Paystack payment method on the secure checkout.</p></div></div>
          </div>
          {submitError && <div className="mt-4 text-xs font-medium text-red-600 bg-red-50 rounded-lg px-3.5 py-2.5">{submitError}</div>}
          <div className="flex gap-3 mt-8"><button onClick={back} className="btn-outline" disabled={submitting}><ArrowLeft size={14} />Back</button><button onClick={payWithPaystack} disabled={submitting} className="btn-gold flex-1 justify-center disabled:opacity-60 flex items-center gap-2">{submitting && <Loader2 size={15} className="animate-spin" />}{submitting ? 'Opening Paystack…' : `Pay now — ${naira(total)}`}</button></div>
        </div>
      )}
    </div>
  )
}
