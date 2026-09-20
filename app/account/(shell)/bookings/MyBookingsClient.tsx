'use client'
import { useEffect, useState } from 'react'
import { Loader2, Wallet, Clock3, LockKeyhole } from 'lucide-react'
import { naira, formatDate } from '../../../../lib/format'
import StatusBadge from '../../../../components/ui/StatusBadge'
import Modal from '../../../../components/ui/Modal'
import CancelBookingButton from '../CancelBookingButton'
import type { RoomType, Booking } from '../../../../data/mock'

type BookingWithRoom = Booking & { room: RoomType | null; shortLet?: any; shortLetId?: string; roomNumber?: string | null; checkedInAt?: string; checkedOutAt?: string }
type PaymentReadiness = { ready: boolean; checking: boolean; locked: boolean; lockedByMe: boolean; lockExpiresAt: string | null }

function HoldCountdown({ expiresAt }: { expiresAt?: string | null }) {
  const [remaining, setRemaining] = useState(() => expiresAt ? Math.max(0, new Date(expiresAt).getTime() - Date.now()) : 0)
  useEffect(() => {
    if (!expiresAt) return
    const tick = () => setRemaining(Math.max(0, new Date(expiresAt).getTime() - Date.now()))
    tick(); const interval = window.setInterval(tick, 1000)
    return () => window.clearInterval(interval)
  }, [expiresAt])
  if (!expiresAt) return null
  const totalSeconds = Math.floor(remaining / 1000)
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${remaining > 0 ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-red-50 border border-red-200 text-red-700'}`}><Clock3 size={11}/>{remaining > 0 ? `Payment hold ${minutes}:${seconds}` : 'Payment hold expired'}</span>
}

function actualDateTime(value?: string) {
  if (!value) return 'Not checked yet'
  return new Date(value).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function MyBookingsClient({ bookings }: { bookings: BookingWithRoom[] }) {
  const [active, setActive] = useState<BookingWithRoom | null>(null)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [readiness, setReadiness] = useState<Record<string, PaymentReadiness>>({})
  const [blockedUntil, setBlockedUntil] = useState<Record<string, string | null>>({})
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    let cancelled = false
    const pending = bookings.filter(b => b.paymentStatus !== 'paid' && b.status !== 'cancelled' && ((b.room?.id && b.roomId) || b.shortLetId))
    if (!pending.length) return
    const checkReadiness = async () => {
      const initial = Object.fromEntries(pending.map(b => [b.id, { ready: false, checking: true, locked: false, lockedByMe: false, lockExpiresAt: null }]))
      if (!cancelled) setReadiness(prev => ({ ...initial, ...prev }))
      const results = await Promise.all(pending.map(async b => {
        try {
          if (b.shortLetId) return [b.id, { ready: true, checking: false, locked: false, lockedByMe: true, lockExpiresAt: (b as any).reservationExpiresAt ?? null }] as const
          const response = await fetch(`/api/public/availability?checkin=${encodeURIComponent(b.checkIn)}&checkout=${encodeURIComponent(b.checkOut)}&roomTypeId=${encodeURIComponent(b.room!.id)}&_=${Date.now()}`, { cache: 'no-store' })
          const data = response.ok ? await response.json() : null
          const room = data?.rooms?.find((r: any) => r.id === b.roomId)
          const holdExpiresAt = room?.reservation_id === b.id && room?.reservation_expires_at && new Date(room.reservation_expires_at).getTime() > Date.now() ? room.reservation_expires_at : null
          return [b.id, { ready: Boolean(room?.payment_ready || holdExpiresAt), checking: false, locked: Boolean(room?.payment_locked), lockedByMe: Boolean(room?.payment_locked_by_me), lockExpiresAt: room?.payment_lock_expires_at ?? null }] as const
        } catch { return [b.id, { ready: false, checking: false, locked: false, lockedByMe: false, lockExpiresAt: null }] as const }
      }))
      if (!cancelled) setReadiness(Object.fromEntries(results))
    }
    void checkReadiness()
    const refresh = () => void checkReadiness()
    window.addEventListener('bluepair:database-change', refresh)
    return () => { cancelled = true; window.removeEventListener('bluepair:database-change', refresh) }
  }, [bookings])

  async function payForBooking(booking: BookingWithRoom) {
    const expiresAt = (booking as any).reservationExpiresAt as string | null | undefined
    const payment = readiness[booking.id]
    if (booking.paymentStatus === 'paid' || booking.status === 'cancelled' || (expiresAt && new Date(expiresAt).getTime() <= now)) return
    if (payment?.locked && !payment.lockedByMe && payment.lockExpiresAt && new Date(payment.lockExpiresAt).getTime() > now) {
      setPaymentError('Another guest is currently securing this property. You can try again when their payment window ends.')
      setBlockedUntil(prev => ({ ...prev, [booking.id]: payment.lockExpiresAt }))
      return
    }
    if (!booking.shortLetId && booking.roomId && !payment?.ready && !payment?.lockedByMe) return
    setPayingId(booking.id); setPaymentError(null)
    try {
      const response = await fetch('/api/paystack/initialize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId: booking.id }) })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.authorizationUrl) {
        if (data.code === 'PAYMENT_IN_PROGRESS') { setBlockedUntil(prev => ({ ...prev, [booking.id]: data.expiresAt || null })); setPaymentError('Another guest is currently completing payment for this room. Your booking is still active. Please try again in a few minutes.') }
        else if (data.code === 'ROOM_SOLD') setPaymentError('This property has just been secured by another guest. Your booking can no longer be paid for this property.')
        else throw new Error(data.error || 'Unable to open Paystack checkout.')
        return
      }
      window.location.assign(data.authorizationUrl)
    } catch (error: any) { setPaymentError(error?.message || 'Unable to start payment.') }
    finally { setPayingId(null) }
  }

  if (bookings.length === 0) return <div className="card p-8 text-center text-sm text-navy-500">You don't have any bookings yet.</div>

  return <div>
    <div className="grid gap-4">
      {bookings.map(b => {
        const payment = readiness[b.id]; const expiresAt = (b as any).reservationExpiresAt as string | null | undefined; const blocked = blockedUntil[b.id]; const blockedActive = Boolean(blocked && new Date(blocked).getTime() > now); const holdActive = !expiresAt || new Date(expiresAt).getTime() > now; const canPay = b.paymentStatus !== 'paid' && b.status !== 'cancelled' && holdActive && (!b.roomId || payment?.ready) && !blockedActive && (!payment?.locked || payment.lockedByMe)
        return <div key={b.id} className="card p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
          {(b.shortLet?.image || b.room?.images?.[0]) && <img loading="lazy" decoding="async" src={b.shortLet?.image || b.room?.images?.[0]} alt={b.shortLet?.name || b.room?.name || 'Booking'} className="w-full sm:w-28 h-28 rounded-xl object-cover" />}
          <div className="flex-1">
            <div className="flex justify-between items-start gap-2 flex-wrap"><div><b className="block">{b.shortLet ? `${b.shortLet.name} · Short-let` : `${b.room?.name ?? 'Room'}${b.roomNumber ? ` · Room ${b.roomNumber}` : ''}`}</b><span className="text-xs text-navy-400">{b.reference} · Reservation: {formatDate(b.checkIn)} → {formatDate(b.checkOut)}</span></div><div className="text-right"><b className="font-display block">{naira(b.amount)}</b><StatusBadge status={b.paymentStatus} /></div></div>
            <div className="flex items-center gap-2 mt-3 flex-wrap"><StatusBadge status={b.status} />{b.status === 'pending' && b.paymentStatus !== 'paid' && <HoldCountdown expiresAt={expiresAt} />}{blockedActive && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-[10px] font-semibold text-navy-600"><LockKeyhole size={11}/>Another guest is paying</span>}{b.paymentStatus !== 'paid' && b.status !== 'cancelled' && b.roomId && !payment?.ready && !expiresAt && !blockedActive && <span className="inline-flex items-center gap-1 rounded-full bg-gold-50 border border-gold-200 px-2.5 py-1 text-[10px] font-semibold text-gold-700"><Clock3 size={11}/>Waiting for room availability</span>}<button onClick={() => { setPaymentError(null); setActive(b) }} className="btn-outline btn-sm ml-auto">View details</button>{['pending', 'confirmed'].includes(b.status) && <CancelBookingButton bookingId={b.id} />}</div>
          </div>
        </div>
      })}
    </div>

    <Modal open={!!active} onClose={() => { setActive(null); setPaymentError(null) }} title="Booking details" subtitle={active?.reference}>
      {active && (() => {
        const payment = readiness[active.id]; const expiresAt = (active as any).reservationExpiresAt as string | null | undefined; const blocked = blockedUntil[active.id]; const blockedActive = Boolean(blocked && new Date(blocked).getTime() > now); const holdActive = !expiresAt || new Date(expiresAt).getTime() > now; const canPay = active.paymentStatus !== 'paid' && active.status !== 'cancelled' && holdActive && (!active.roomId || payment?.ready) && !blockedActive && (!payment?.locked || payment.lockedByMe)
        return <div className="flex flex-col gap-0.5">
          {[['Property', active.shortLet ? `${active.shortLet.name} · Short-let` : `${active.room?.name ?? 'Room'}${active.roomNumber ? ` · Room ${active.roomNumber}` : ''}`],['Reservation', `${formatDate(active.checkIn)} → ${formatDate(active.checkOut)}`],['Check-in', actualDateTime(active.checkedInAt)],['Check-out', active.checkedOutAt ? actualDateTime(active.checkedOutAt) : 'Not checked out yet'],['Guests', `${active.adults} adults, ${active.children} children`],['Amount', naira(active.amount)],['Payment status', active.paymentStatus],['Booking status', active.status],['Special requests', active.specialRequests || 'None']].map(([l,v]) => <div key={l} className="flex justify-between text-sm py-2.5 border-b border-dashed border-black/10 last:border-none gap-4"><span className="text-navy-400 shrink-0">{l}</span><span className="font-medium capitalize text-right break-words">{v}</span></div>)}
          {active.status === 'pending' && active.paymentStatus !== 'paid' && <div className="mt-4"><HoldCountdown expiresAt={expiresAt} /></div>}
          {active.paymentStatus !== 'paid' && active.status !== 'cancelled' && (canPay ? <div className="mt-4 rounded-xl border border-gold-400/40 bg-gold-50/50 p-4"><div className="flex items-start gap-3"><div className="w-9 h-9 rounded-full bg-navy-950 text-white flex items-center justify-center shrink-0"><Wallet size={16}/></div><div><b className="text-sm text-navy-900">Complete your payment</b><p className="text-xs text-navy-500 mt-1 leading-5">Your reservation is still active. Complete payment before the countdown reaches zero to secure this booking for your selected dates.</p></div></div>{paymentError&&<div className="mt-3 text-xs font-medium text-red-600 bg-red-50 rounded-lg px-3 py-2.5">{paymentError}</div>}<button onClick={() => void payForBooking(active)} disabled={payingId===active.id} className="btn-gold w-full justify-center mt-3">{payingId===active.id?<><Loader2 size={15} className="animate-spin"/>Opening Paystack…</>:<>Pay now — {naira(active.amount)}</>}</button></div> : blockedActive ? <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-start gap-3"><LockKeyhole size={18} className="text-navy-600 shrink-0 mt-0.5"/><div><b className="text-sm text-navy-900">This room is being secured</b><p className="text-xs text-navy-500 mt-1 leading-5">Another guest is completing payment. Their temporary payment window will expire in:</p><div className="mt-2"><HoldCountdown expiresAt={blocked} /></div></div></div><button onClick={() => { setBlockedUntil(prev => ({ ...prev, [active.id]: null })); setPaymentError(null) }} className="btn-outline btn-sm w-full justify-center mt-3">Check availability again</button></div> : <div className="mt-4 rounded-xl border border-gold-200 bg-gold-50 p-4"><div className="flex items-start gap-3"><Clock3 size={18} className="text-gold-700 shrink-0 mt-0.5"/><div><b className="text-sm text-gold-900">{expiresAt ? 'Payment hold active' : 'Waiting for room availability'}</b><p className="text-xs text-gold-800/80 mt-1 leading-5">{expiresAt ? 'Complete payment before the countdown reaches zero. The first successful payment secures the room.' : 'No payment is available yet. We’ll email you when this reserved room becomes available, then you can pay to secure it.'}</p></div></div></div>)}
          {paymentError && !canPay && !blockedActive && <div className="mt-3 text-xs font-medium text-red-600 bg-red-50 rounded-lg px-3 py-2.5">{paymentError}</div>}{active.paymentStatus === 'paid' && <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">Payment verified. Your reservation is confirmed.</div>}
        </div>
      })()}
    </Modal>
  </div>
}
