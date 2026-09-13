'use client'
import { useState } from 'react'
import { Loader2, Wallet } from 'lucide-react'
import { naira, formatDate } from '../../../../lib/format'
import StatusBadge from '../../../../components/ui/StatusBadge'
import Modal from '../../../../components/ui/Modal'
import CancelBookingButton from '../CancelBookingButton'
import type { RoomType, Booking } from '../../../../data/mock'

type BookingWithRoom = Booking & { room: RoomType | null }

export default function MyBookingsClient({ bookings }: { bookings: BookingWithRoom[] }) {
  const [active, setActive] = useState<BookingWithRoom | null>(null)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  async function payForBooking(booking: BookingWithRoom) {
    if (booking.paymentStatus === 'paid' || booking.status === 'cancelled') return
    setPayingId(booking.id)
    setPaymentError(null)
    try {
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.authorizationUrl) throw new Error(data.error || 'Unable to open Paystack checkout.')
      window.location.assign(data.authorizationUrl)
    } catch (error: any) {
      setPaymentError(error?.message || 'Unable to start payment.')
      setPayingId(null)
    }
  }

  if (bookings.length === 0) {
    return <div className="card p-8 text-center text-sm text-navy-500">You don't have any bookings yet.</div>
  }

  return (
    <div>
      <div className="grid gap-4">
        {bookings.map(b => (
          <div key={b.id} className="card p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
            {b.room?.images?.[0] && <img src={b.room.images[0]} alt={b.room.name} className="w-full sm:w-28 h-28 rounded-xl object-cover" />}
            <div className="flex-1">
              <div className="flex justify-between items-start gap-2 flex-wrap">
                <div>
                  <b className="block">{b.room?.name ?? 'Room'}</b>
                  <span className="text-xs text-navy-400">{b.reference} · {formatDate(b.checkIn)} → {formatDate(b.checkOut)}</span>
                </div>
                <div className="text-right"><b className="font-display block">{naira(b.amount)}</b><StatusBadge status={b.paymentStatus} /></div>
              </div>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <StatusBadge status={b.status} />
                <button onClick={() => { setPaymentError(null); setActive(b) }} className="btn-outline btn-sm ml-auto">View details</button>
                {['pending', 'confirmed'].includes(b.status) && <CancelBookingButton bookingId={b.id} />}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!active} onClose={() => { setActive(null); setPaymentError(null) }} title="Booking details" subtitle={active?.reference}>
        {active && (
          <div className="flex flex-col gap-0.5">
            {[
              ['Room', active.room?.name ?? 'Room'],
              ['Check-in', formatDate(active.checkIn)],
              ['Check-out', formatDate(active.checkOut)],
              ['Guests', `${active.adults} adults, ${active.children} children`],
              ['Amount', naira(active.amount)],
              ['Payment status', active.paymentStatus],
              ['Booking status', active.status],
              ['Special requests', active.specialRequests || 'None'],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between text-sm py-2.5 border-b border-dashed border-black/10 last:border-none gap-4"><span className="text-navy-400 shrink-0">{l}</span><span className="font-medium capitalize text-right break-words">{v}</span></div>
            ))}
            {active.paymentStatus !== 'paid' && active.status !== 'cancelled' && (
              <div className="mt-4 rounded-xl border border-gold-400/40 bg-gold-50/50 p-4">
                <div className="flex items-start gap-3"><div className="w-9 h-9 rounded-full bg-navy-950 text-white flex items-center justify-center shrink-0"><Wallet size={16} /></div><div><b className="text-sm text-navy-900">Payment required</b><p className="text-xs text-navy-500 mt-1 leading-5">This booking is not confirmed until payment is successfully verified.</p></div></div>
                {paymentError && <div className="mt-3 text-xs font-medium text-red-600 bg-red-50 rounded-lg px-3 py-2.5">{paymentError}</div>}
                <button onClick={() => void payForBooking(active)} disabled={payingId === active.id} className="btn-gold w-full justify-center mt-3 disabled:opacity-60">
                  {payingId === active.id ? <><Loader2 size={15} className="animate-spin" />Opening Paystack…</> : <>Pay now — {naira(active.amount)}</>}
                </button>
              </div>
            )}
            {active.paymentStatus === 'paid' && <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">Payment verified. Your reservation is confirmed.</div>}
          </div>
        )}
      </Modal>
    </div>
  )
}
