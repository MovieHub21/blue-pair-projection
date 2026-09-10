'use client'
import { useState, useEffect } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useStore } from '../../../store/useStore'
import { useAuth, ensureCustomer } from '../../../lib/useAuth'
import { naira, nightsBetween, formatDate } from '../../../lib/format'
import { Check, Calendar, Users, CreditCard, Landmark, Wallet, Download } from 'lucide-react'

const STEPS = ['Room', 'Dates & Guests', 'Guest Info', 'Summary', 'Payment', 'Confirmation']

export default function BookingFlowClient() {
  const params = useSearchParams()
  const pathname = usePathname()
  const auth = useAuth()
  const { roomTypes, createBooking } = useStore()
  const [step, setStep] = useState(0)
  const [roomId, setRoomId] = useState(roomTypes.find(r => r.slug === params.get('room'))?.id ?? roomTypes[0].id)
  const [checkIn, setCheckIn] = useState(params.get('checkin') || '2026-08-14')
  const [checkOut, setCheckOut] = useState(params.get('checkout') || '2026-08-16')
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [guest, setGuest] = useState({ name: '', email: '', phone: '', requests: '' })
  const [payMethod, setPayMethod] = useState<'card'|'transfer'|'paystack'>('paystack')
  const [booking, setBooking] = useState<ReturnType<typeof createBooking> | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

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

  const room = roomTypes.find(r => r.id === roomId)!
  const nights = nightsBetween(checkIn, checkOut)
  const subtotal = room.price * nights
  const tax = Math.round(subtotal * 0.075)
  const total = subtotal + tax

  function next() { setStep(s => Math.min(s + 1, STEPS.length - 1)) }
  function back() { setStep(s => Math.max(s - 1, 0)) }

  async function pay() {
    if (!auth.userId) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const customerId = await ensureCustomer(auth.userId, guest.name, guest.email, guest.phone)
      const b = createBooking({
        customerId, roomTypeId: room.id, checkIn, checkOut, adults, children,
        amount: total, specialRequests: guest.requests || undefined,
      })
      setBooking(b)
      setStep(5)
    } catch (e: any) {
      setSubmitError(e?.message || 'Something went wrong creating your booking.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!auth.loading && !auth.userId) {
    const redirect = `${pathname}?${params.toString()}`
    return (
      <div className="container-w px-6 md:px-10 py-16 max-w-md mx-auto text-center">
        <h2 className="text-2xl font-semibold mb-3">Sign in to book</h2>
        <p className="text-sm text-navy-500 mb-8">Create a free account or sign in so we can attach this booking to you and keep it in "My Bookings".</p>
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
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1.5 shrink-0">
            <div className={'flex items-center gap-2 px-1'}>
              <div className={'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ' +
                (i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-navy-950 text-white' : 'border border-black/15 text-navy-400')}>
                {i < step ? <Check size={13} /> : i + 1}
              </div>
              <span className={'text-xs font-semibold whitespace-nowrap ' + (i <= step ? 'text-navy-900' : 'text-navy-300')}>{s}</span>
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
              <button key={r.id} onClick={() => setRoomId(r.id)}
                className={'card p-4 flex gap-4 text-left items-center border-2 ' + (roomId === r.id ? 'border-gold-500' : 'border-transparent')}>
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
            <div><label className="field-label flex items-center gap-1.5"><Users size={13} />Adults</label>
              <select value={adults} onChange={e => setAdults(Number(e.target.value))} className="field-input">
                {Array.from({length: room.guests}, (_,i)=>i+1).map(n=><option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div><label className="field-label">Children</label>
              <select value={children} onChange={e => setChildren(Number(e.target.value))} className="field-input">
                {[0,1,2].map(n=><option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <p className="text-xs text-navy-400 mt-3">{nights} night{nights>1?'s':''} at {room.name}</p>
          <div className="flex gap-3 mt-8"><button onClick={back} className="btn-outline">Back</button><button onClick={next} className="btn-primary">Continue</button></div>
        </div>
      )}

      {step === 2 && (
        <div className="max-w-md">
          <h2 className="text-2xl font-semibold mb-6">Guest information</h2>
          <label className="field-label">Full name</label>
          <input value={guest.name} onChange={e => setGuest({...guest, name: e.target.value})} className="field-input mb-4" placeholder="Efosa Aigbe" />
          <label className="field-label">Email</label>
          <input value={guest.email} onChange={e => setGuest({...guest, email: e.target.value})} className="field-input mb-4" placeholder="you@email.com" />
          <label className="field-label">Phone</label>
          <input value={guest.phone} onChange={e => setGuest({...guest, phone: e.target.value})} className="field-input mb-4" placeholder="+234 800 000 0000" />
          <label className="field-label">Special requests (optional)</label>
          <input value={guest.requests} onChange={e => setGuest({...guest, requests: e.target.value})} className="field-input" placeholder="Late check-in, high floor, etc." />
          <div className="flex gap-3 mt-8"><button onClick={back} className="btn-outline">Back</button><button onClick={next} className="btn-primary">Continue</button></div>
        </div>
      )}

      {step === 3 && (
        <div className="max-w-md">
          <h2 className="text-2xl font-semibold mb-6">Booking summary</h2>
          <div className="card p-5 flex gap-4 mb-5">
            <img src={room.images[0]} alt={room.name} className="w-16 h-16 rounded-lg object-cover" />
            <div><b className="block text-sm">{room.name}</b><span className="text-xs text-navy-400">{formatDate(checkIn)} → {formatDate(checkOut)} · {adults} adults{children?`, ${children} children`:''}</span></div>
          </div>
          <div className="card p-5 flex flex-col gap-1">
            <div className="flex justify-between text-sm py-1.5"><span className="text-navy-500">Guest</span><span>{guest.name || 'Efosa Aigbe'}</span></div>
            <div className="flex justify-between text-sm py-1.5"><span className="text-navy-500">{naira(room.price)} × {nights} nights</span><span>{naira(subtotal)}</span></div>
            <div className="flex justify-between text-sm py-1.5"><span className="text-navy-500">Taxes &amp; VAT</span><span>{naira(tax)}</span></div>
            <div className="flex justify-between text-base font-semibold pt-3 mt-2 border-t border-black/10"><span>Total</span><b className="font-display text-lg">{naira(total)}</b></div>
          </div>
          <div className="flex gap-3 mt-8"><button onClick={back} className="btn-outline">Back</button><button onClick={next} className="btn-primary">Continue to payment</button></div>
        </div>
      )}

      {step === 4 && (
        <div className="max-w-md">
          <h2 className="text-2xl font-semibold mb-6">Payment</h2>
          <div className="flex gap-2.5 mb-5">
            {[{k:'paystack',l:'Paystack',i:Wallet},{k:'card',l:'Card',i:CreditCard},{k:'transfer',l:'Bank transfer',i:Landmark}].map(m => (
              <button key={m.k} onClick={() => setPayMethod(m.k as any)} className={'flex-1 flex flex-col items-center gap-1.5 py-4 rounded-lg border-2 text-xs font-semibold ' + (payMethod===m.k ? 'border-navy-950 bg-cream-100' : 'border-black/10')}>
                <m.i size={17} />{m.l}
              </button>
            ))}
          </div>
          {payMethod === 'card' && (<>
            <label className="field-label">Card number</label><input className="field-input mb-4" placeholder="5060 6666 6666 6666" />
            <div className="grid grid-cols-2 gap-4"><div><label className="field-label">Expiry</label><input className="field-input" placeholder="09/28" /></div><div><label className="field-label">CVV</label><input className="field-input" placeholder="123" /></div></div>
          </>)}
          {payMethod === 'transfer' && <div className="card p-5 text-sm text-navy-600">Transfer {naira(total)} to <b>Blue Pair Hotel Ltd</b> — GTBank, 0123456789, then bring your reference to the front desk. Your booking is held as <b>pending</b> until payment is confirmed by our team.</div>}
          {payMethod === 'paystack' && <div className="card p-5 text-sm text-navy-600">Online card/Paystack payment isn't live yet — we'll hold your room and mark this booking as <b>pending payment</b>. Our team will follow up to collect payment of <b>{naira(total)}</b>.</div>}
          {submitError && <div className="mt-4 text-xs font-medium text-red-600 bg-red-50 rounded-lg px-3.5 py-2.5">{submitError}</div>}
          <div className="flex justify-between items-center mt-6 text-sm"><span className="text-navy-500">Amount due</span><b className="font-display text-lg">{naira(total)}</b></div>
          <div className="flex gap-3 mt-6"><button onClick={back} className="btn-outline">Back</button><button onClick={pay} disabled={submitting} className="btn-gold flex-1 justify-center disabled:opacity-60">{submitting ? 'Booking…' : `Reserve — ${naira(total)} due`}</button></div>
        </div>
      )}

      {step === 5 && booking && (
        <div className="max-w-lg mx-auto text-center py-8">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-5 text-3xl">✓</div>
          <span className="eyebrow">Booking received</span>
          <h2 className="text-2xl font-semibold mt-2 mb-2">You're booked, {guest.name || 'guest'}</h2>
          <p className="text-sm text-navy-500">A confirmation has been sent to {guest.email || 'your email'}. Payment is <b>pending</b> — our front desk will reach out to confirm it. We look forward to hosting you at Blue Pair, Uromi.</p>
          <div className="card text-left mt-8 p-6 flex flex-col gap-0.5">
            {[
              ['Booking reference', booking.reference],
              ['Guest name', guest.name || 'Guest'],
              ['Room', room.name],
              ['Dates', `${formatDate(checkIn)} → ${formatDate(checkOut)}`],
              ['Amount', naira(total)],
              ['Payment status', 'Pending'],
              ['Hotel', 'Blue Pair Hotel, Auchi Road, Uromi, Edo State'],
            ].map(([l,v]) => (
              <div key={l} className="flex justify-between text-sm py-2.5 border-b border-dashed border-black/10 last:border-none"><span className="text-navy-400">{l}</span><span className="font-medium">{v}</span></div>
            ))}
          </div>
          <div className="flex gap-3 justify-center mt-7">
            <button className="btn-outline flex items-center gap-2"><Download size={15}/>Download confirmation</button>
            <Link href="/account/dashboard" className="btn-primary">View my booking</Link>
          </div>
        </div>
      )}
    </div>
  )
}
