import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { sendResendEmail } from '../../../../lib/email/resend'
import { preArrivalEmail, checkInReminderEmail, checkoutReminderEmail, reviewRequestEmail } from '../../../../lib/email/templates'

function dateOnly(value: string) { return new Date(`${value}T00:00:00Z`) }
function diffDays(from: string, to: string) { return Math.round((dateOnly(to).getTime() - dateOnly(from).getTime()) / 86400000) }

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

    for (const booking of bookings ?? []) {
      let event: 'pre_arrival' | 'checkin_reminder' | 'checkout_reminder' | 'review_request' | null = null
      if (booking.status === 'confirmed' && diffDays(today, booking.check_in) === 3) event = 'pre_arrival'
      else if (booking.status === 'confirmed' && diffDays(today, booking.check_in) === 1) event = 'checkin_reminder'
      else if (booking.status === 'checked_in' && diffDays(today, booking.check_out) === 1) event = 'checkout_reminder'
      else if (booking.status === 'checked_out' && diffDays(booking.check_out, today) === 1) event = 'review_request'
      if (!event) continue

      const dedupeKey = `${event}:${booking.id}`
      const { data: existing } = await supabase.from('email_logs').select('id').eq('dedupe_key', dedupeKey).maybeSingle()
      if (existing) { skipped++; continue }

      const customer = (await supabase.from('customers').select('name,email').eq('id', booking.customer_id).maybeSingle()).data
      const roomType = (await supabase.from('room_types').select('name').eq('id', booking.room_type_id).maybeSingle()).data
      const recipient = String(customer?.email || '').trim().toLowerCase()
      if (!recipient) continue

      const base = {
        guestName: customer?.name || 'Guest', reference: booking.reference, roomName: roomType?.name || 'Your reserved room',
        checkIn: booking.check_in, checkOut: booking.check_out, total: Number(booking.amount || 0),
      }
      const email = event === 'pre_arrival'
        ? preArrivalEmail(base)
        : event === 'checkin_reminder'
          ? checkInReminderEmail(base)
          : event === 'checkout_reminder'
            ? checkoutReminderEmail({ guestName: base.guestName, reference: base.reference, roomName: base.roomName, checkOut: base.checkOut })
            : reviewRequestEmail({ guestName: base.guestName, reference: base.reference })

      const result = await sendResendEmail({ to: recipient, subject: email.subject, html: email.html, text: email.text })
      const { error: logError } = await supabase.from('email_logs').insert({
        dedupe_key: dedupeKey, event, booking_id: booking.id, recipient,
        subject: email.subject, resend_id: result.id ?? null,
      })
      if (logError) console.error('[guest-email-cron] log failed', logError.message)
      else sent++
    }

    return NextResponse.json({ ok: true, date: today, sent, skipped })
  } catch (error) {
    console.error('[guest-email-cron] failed', error)
    return NextResponse.json({ error: 'Guest email job failed' }, { status: 500 })
  }
}
