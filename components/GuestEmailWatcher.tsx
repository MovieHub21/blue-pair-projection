'use client'

import { useEffect } from 'react'
import { useStore } from '../store/useStore'

type EventName =
  | 'payment_successful' | 'payment_failed' | 'booking_cancelled' | 'booking_modified'
  | 'pre_arrival' | 'checkin_reminder' | 'checkin_welcome' | 'checkout_reminder'
  | 'checkout_thank_you' | 'review_request' | 'service_request_received' | 'service_request_status'

export async function sendGuestTransactionalEmail(event: EventName, input: { bookingId?: string; requestId?: string; reason?: string; changes?: string; paymentReference?: string; reviewUrl?: string }) {
  try {
    const response = await fetch('/api/email/guest-transactional', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, ...input }),
    })
    if (!response.ok) console.error(`[guest-email] ${event} failed`, await response.text())
    return response.ok
  } catch (error) {
    console.error(`[guest-email] ${event} request failed`, error)
    return false
  }
}

export default function GuestEmailWatcher() {
  useEffect(() => {
    return useStore.subscribe((state, previous) => {
      const previousBookings = new Map(previous.bookings.map(b => [b.id, b]))

      for (const booking of state.bookings) {
        const old = previousBookings.get(booking.id)
        if (!old) continue

        if (old.paymentStatus !== 'paid' && booking.paymentStatus === 'paid') {
          void sendGuestTransactionalEmail('payment_successful', { bookingId: booking.id })
        } else if (old.status !== 'cancelled' && booking.status === 'cancelled') {
          void sendGuestTransactionalEmail('booking_cancelled', { bookingId: booking.id })
        } else if (old.status !== 'checked_in' && booking.status === 'checked_in') {
          void sendGuestTransactionalEmail('checkin_welcome', { bookingId: booking.id })
        } else if (old.status !== 'checked_out' && booking.status === 'checked_out') {
          void sendGuestTransactionalEmail('checkout_thank_you', { bookingId: booking.id })
        } else {
          const changed = old.checkIn !== booking.checkIn || old.checkOut !== booking.checkOut || old.roomTypeId !== booking.roomTypeId || old.roomId !== booking.roomId || old.adults !== booking.adults || old.children !== booking.children || old.amount !== booking.amount || old.specialRequests !== booking.specialRequests
          if (changed) void sendGuestTransactionalEmail('booking_modified', { bookingId: booking.id })
        }
      }

      const previousRequests = new Map(previous.guestRequests.map(r => [r.id, r]))
      for (const request of state.guestRequests) {
        const old = previousRequests.get(request.id)
        if (!old) {
          void sendGuestTransactionalEmail('service_request_received', { requestId: request.id })
        } else if (old.status !== request.status) {
          void sendGuestTransactionalEmail('service_request_status', { requestId: request.id })
        }
      }
    })
  }, [])

  return null
}
