export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { sendResendEmail } from '../../../../lib/email/resend'
import { preArrivalEmail, checkInReminderEmail, checkoutReminderEmail, reviewRequestEmail } from '../../../../lib/email/templates'

function dateOnly(value: string) { return new Date(`${value}T00:00:00Z`) }
function diffDays(from: string, to: string) { return Math.round((dateOnly(to).getTime() - dateOnly(from).getTime()) / 86400000) }

const automation = {
  pre_arrival: { title: 'Your Blue Pair stay is getting closer', body: 'Your stay is coming up. Review your booking, prepare any requests and get ready to arrive.', href: '/account/bookings' },
  checkin_reminder: { title: 'Your stay starts tomorrow', body: 'Everything is almost ready. Check your booking details and let us know if you need anything before arrival.', href: '/account/bookings' },
  checkout_reminder: { title: 'A gentle checkout reminder', body: 'Your Blue Pair stay ends tomorrow. Please check your checkout details and settle any outstanding requests.', href: '/account/bookings' },
  review_request: { title: 'How was your stay?', body: 'We would love to hear about your Blue Pair experience. Your feedback helps us make every stay better.', href: '/account' },
} as const

export async function GET(request: Request) {
  try {
    const auth = request.headers.get('authorization')
    const expected = process.env.CRON_SECRET
    if (!expected || auth !== `Bearer ${expected}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createSupabaseAdminClient()
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })
    const { data: bookings, error } = await supabase.from('bookings').select('*').in('status', ['confirmed', 'checked_in', 'checked_out'])
    if (error) throw error

    let sent = 0
    let skipped = 0
    let notifications = 0

    for (const booking of bookings ?? []) {
      let event: keyof typeof automation | null = null
      if (booking.status === 'confirmed' && diffDays(today, booking.check_in) === 3) event = 'pre_arrival'
      else if (booking.status === 'confirmed' && diffDays(today, booking.check_in) === 1) event = 'checkin_reminder'
      else if (booking.status === 'checked_in' && diffDays(today, booking.check_out) === 1) event = 'checkout_reminder'
      else if (booking.status === 'checked_out' && diffDays(booking.check_out, today) === 1) event = 'review_request'
      if (!event) continue

      const dedupeKey = `${event}:${booking.id}`
      const { data: existing } = await supabase.from('email_logs').select('id').eq('dedupe_key', dedupeKey).maybeSingle()
      if (existing) { skipped++; continue }

      const customer = (await supabase.from('customers').select('name,email,user_id').eq('id', booking.customer_id).maybeSingle()).data
      const roomType = (await supabase.from('room_types').select('name').eq('id', booking.room_type_id).maybeSingle()).data
      const recipient = String(customer?.email || '').trim().toLowerCase()
      if (!recipient) continue

      const base = { guestName: customer?.name || 'Guest', reference: booking.reference, roomName: roomType?.name || 'Your reserved room', checkIn: booking.check_in, checkOut: booking.check_out, total: Number(booking.amount || 0) }
      const email = event === 'pre_arrival'
        ? preArrivalEmail(base)
        : event === 'checkin_reminder'
          ? checkInReminderEmail(base)
          : event === 'checkout_reminder'
            ? checkoutReminderEmail({ guestName: base.guestName, reference: base.reference, roomName: base.roomName, checkOut: base.checkOut })
            : reviewRequestEmail({ guestName: base.guestName, reference: base.reference })

      const result = await sendResendEmail({ to: recipient, subject: email.subject, html: email.html, text: email.text })
      const { error: logError } = await supabase.from('email_logs').insert({ dedupe_key: dedupeKey, event, booking_id: booking.id, recipient, subject: email.subject, resend_id: result.id ?? null })
      if (logError) { console.error('[guest-email-cron] log failed', logError.message); continue }
      sent++

      if (customer?.user_id) {
        const message = automation[event]
        const { error: notificationError } = await supabase.from('guest_notifications').insert({
          user_id: customer.user_id,
          type: event,
          title: message.title,
          body: message.body,
          href: message.href,
          metadata: { booking_id: booking.id, booking_reference: booking.reference, automation: true },
        })
        if (notificationError) console.error('[guest-email-cron] notification failed', notificationError.message)
        else notifications++
      }
    }

    // Reservations are deliberately not blocking availability until they are paid.
    // Once their assigned room is actually available and the requested stay has arrived,
    // notify the guest that payment can now secure it. First successful payment wins.
    const { data: pendingReservations, error: pendingError } = await supabase
      .from('bookings')
      .select('id,reference,customer_id,room_id,room_type_id,check_in,check_out,amount,status,payment_status')
      .eq('status','pending')
      .eq('payment_status','pending')
      .lte('check_in',today)
      .not('room_id','is',null)
    if (pendingError) throw pendingError

    for (const booking of pendingReservations ?? []) {
      const dedupeKey = `reservation_ready:${booking.id}`
      const { data: existing } = await supabase.from('email_logs').select('id').eq('dedupe_key',dedupeKey).maybeSingle()
      if (existing) continue
      const room = (await supabase.from('rooms').select('id,room_number,status').eq('id',booking.room_id).maybeSingle()).data
      if (!room || room.status !== 'available') continue
      const customer = (await supabase.from('customers').select('name,email,user_id').eq('id',booking.customer_id).maybeSingle()).data
      const roomType = (await supabase.from('room_types').select('name,slug').eq('id',booking.room_type_id).maybeSingle()).data
      const recipient = String(customer?.email || '').trim().toLowerCase()
      if (!recipient) continue
      const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bluepairhotel.com'
      const paymentUrl = `${site}/account/bookings`
      const subject = 'Your Blue Pair room is available — payment can now secure it'
      const html = `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#0a1229"><h2 style="margin-bottom:8px">Your room is ready to secure</h2><p>Hello ${customer?.name || 'Guest'},</p><p>The room you reserved at Blue Pair Hotel is now showing as <strong>available</strong> for your stay from <strong>${booking.check_in}</strong> to <strong>${booking.check_out}</strong>.</p><p>Your reservation is still unpaid, so it does not hold the room exclusively. <strong>The first successful payment secures the room.</strong></p><p><a href="${paymentUrl}" style="display:inline-block;background:#c79a3e;color:#0a1229;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">Open my booking &amp; pay</a></p><p style="font-size:13px;color:#667085">Reservation reference: ${booking.reference} · Room ${room.room_number}</p></div>`
      const text = `Hello ${customer?.name || 'Guest'}, your reserved Blue Pair room is now available for ${booking.check_in} to ${booking.check_out}. Your reservation is unpaid and does not exclusively hold the room. The first successful payment secures it. Open ${paymentUrl} to pay. Reference: ${booking.reference}.`
      const result = await sendResendEmail({to:recipient,subject,html,text})
      const { error: logError } = await supabase.from('email_logs').insert({dedupe_key:dedupeKey,event:'reservation_ready',booking_id:booking.id,recipient,subject,resend_id:result.id??null})
      if (logError) { console.error('[guest-email-cron] reservation-ready log failed',logError.message); continue }
      sent++
      if (customer?.user_id) {
        const { error: notificationError } = await supabase.from('guest_notifications').insert({user_id:customer.user_id,type:'reservation_ready',title:'Your reserved room is available',body:`Room ${room.room_number} is now available. Pay to secure your reservation before another guest does.`,href:'/account/bookings',metadata:{booking_id:booking.id,booking_reference:booking.reference,automation:true}})
        if (!notificationError) notifications++
      }
    }

    return NextResponse.json({ ok: true, date: today, sent, skipped, notifications })
  } catch (error) {
    console.error('[guest-email-cron] failed', error)
    return NextResponse.json({ error: 'Guest email job failed' }, { status: 500 })
  }
}
