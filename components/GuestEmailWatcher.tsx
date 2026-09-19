'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase/client'

export type EventName =
  | 'booking_confirmation' | 'payment_successful' | 'payment_failed' | 'booking_cancelled' | 'booking_modified'
  | 'pre_arrival' | 'checkin_reminder' | 'checkin_welcome' | 'checkout_reminder'
  | 'checkout_thank_you' | 'review_request' | 'service_request_received' | 'service_request_status'
  | 'support_acknowledged' | 'support_status'

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
    const channel = supabase
      .channel('bluepair:guest-email-watcher')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, (payload) => {
        const old = payload.old as Record<string, any>
        const current = payload.new as Record<string, any>
        if (!old || !current) return

        if (old.payment_status !== 'paid' && current.payment_status === 'paid') {
          void sendGuestTransactionalEmail('payment_successful', { bookingId: current.id })
        } else if (String(old.payment_status) !== 'failed' && String(current.payment_status) === 'failed') {
          void sendGuestTransactionalEmail('payment_failed', { bookingId: current.id })
        } else if (old.status !== 'cancelled' && current.status === 'cancelled') {
          void sendGuestTransactionalEmail('booking_cancelled', { bookingId: current.id })
        } else if (old.status !== 'checked_in' && current.status === 'checked_in') {
          void sendGuestTransactionalEmail('checkin_welcome', { bookingId: current.id })
        } else if (old.status !== 'checked_out' && current.status === 'checked_out') {
          void sendGuestTransactionalEmail('checkout_thank_you', { bookingId: current.id })
        } else {
          const changed =
            old.check_in !== current.check_in ||
            old.check_out !== current.check_out ||
            old.room_type_id !== current.room_type_id ||
            old.room_id !== current.room_id ||
            old.adults !== current.adults ||
            old.children !== current.children ||
            old.amount !== current.amount ||
            old.special_requests !== current.special_requests
          if (changed) void sendGuestTransactionalEmail('booking_modified', { bookingId: current.id })
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guest_requests' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const request = payload.new as Record<string, any>
          if (!request) return
          const isSupport = String(request.type || '').toLowerCase().includes('complaint') || String(request.type || '').toLowerCase().includes('support')
          void sendGuestTransactionalEmail(isSupport ? 'support_acknowledged' : 'service_request_received', { requestId: request.id })
        } else if (payload.eventType === 'UPDATE') {
          const old = payload.old as Record<string, any>
          const current = payload.new as Record<string, any>
          if (!old || !current) return
          if (old.status && current.status && old.status !== current.status) {
            const isSupport = String(current.type || '').toLowerCase().includes('complaint') || String(current.type || '').toLowerCase().includes('support')
            void sendGuestTransactionalEmail(isSupport ? 'support_status' : 'service_request_status', { requestId: current.id })
          }
        }
      })
      .subscribe((status) => {
        console.info('[guest-email-watcher]', status)
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  return null
}
