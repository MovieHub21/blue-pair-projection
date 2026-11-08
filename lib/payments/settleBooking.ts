import type { SupabaseClient } from '@supabase/supabase-js'
import { enqueueBackgroundEmail } from '../backgroundJobs'
import { paymentSuccessfulEmail } from '../email/templates'
import { isRoomServiceReference } from '../roomServicePayments'
import { notifyBookingPaid } from '../staffEvents'

/**
 * One server-side place that turns a Paystack transaction into a paid booking.
 * The Paystack callback (guest redirect), the webhook and any reconciliation job all call
 * settleBookingPayment(), so it does not matter which one arrives first or whether both arrive.
 *
 * Rules:
 *  - Nothing is trusted from the browser or the webhook body: the transaction is always verified
 *    with Paystack's server-side verify API (status, exact amount in kobo, currency, booking).
 *  - A payment is never marked failed because of a timeout, an HTTP error, an "abandoned" status
 *    or a redirect that never arrived. Only a verified success changes state.
 *  - The booking "unpaid -> paid" update is the single gate. Only the caller that wins it runs the
 *    one-time side effects (hold cleanup, staff/guest notification, email), so repeats do nothing.
 */

const EXPECTED_CURRENCY = 'NGN'
const PAYSTACK_TIMEOUT_MS = 8000

export type PaystackVerification =
  | { kind: 'success'; transaction: any }
  | { kind: 'not_success'; status: string; transaction: any }
  | { kind: 'unavailable'; detail: string }

export type SettleBookingResult =
  | { ok: true; state: 'settled' | 'already_paid'; booking: any }
  | {
      ok: false
      reason:
        | 'payment_not_found'
        | 'room_service'
        | 'booking_not_found'
        | 'booking_mismatch'
        | 'amount_mismatch'
        | 'currency_mismatch'
        | 'invalid_booking_state'
        | 'duplicate_payment'
        | 'not_success'
        | 'unavailable'
        | 'refunded'
        | 'refund_failed'
        | 'error'
      /** True when retrying later can succeed (Paystack unreachable, database hiccup, refund failed). */
      transient: boolean
      status?: string
      detail?: string
    }

const fail = (reason: Extract<SettleBookingResult, { ok: false }>['reason'], transient: boolean, extra?: { status?: string; detail?: string }): SettleBookingResult => ({ ok: false, reason, transient, ...extra })

const lagosToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })

/** Ask Paystack for the real state of a transaction. Any HTTP/network problem is "unavailable", never "failed". */
export async function verifyPaystackTransaction(secret: string, reference: string): Promise<PaystackVerification> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PAYSTACK_TIMEOUT_MS)
  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: 'no-store',
      signal: controller.signal,
    })
    const result = await response.json().catch(() => null)
    if (!response.ok || !result?.status || !result?.data) return { kind: 'unavailable', detail: `HTTP ${response.status}: ${result?.message || 'no body'}` }
    const status = String(result.data.status || '').toLowerCase()
    if (status === 'success') return { kind: 'success', transaction: result.data }
    return { kind: 'not_success', status: status || 'unknown', transaction: result.data }
  } catch (error: any) {
    return { kind: 'unavailable', detail: error?.name === 'AbortError' ? 'Paystack verify timed out' : String(error?.message || error) }
  } finally {
    clearTimeout(timer)
  }
}

async function refundPaystackTransaction(secret: string, transactionId: unknown) {
  if (!transactionId) return false
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PAYSTACK_TIMEOUT_MS)
  try {
    const response = await fetch('https://api.paystack.co/refund', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction: transactionId }),
      cache: 'no-store',
      signal: controller.signal,
    })
    const result = await response.json().catch(() => null)
    if (!response.ok || !result?.status) { console.error('[settle-booking] refund failed', result?.message || response.status); return false }
    return true
  } catch (error) {
    console.error('[settle-booking] refund request failed', error)
    return false
  } finally {
    clearTimeout(timer)
  }
}

const BOOKING_COLUMNS = 'id,reference,customer_id,room_id,room_type_id,short_let_id,check_in,check_out,amount,status,payment_status,reservation_expires_at'

/** Idempotent: make sure the payment row says success. Never touches a refunded payment. */
async function ensurePaymentSuccess(admin: SupabaseClient, paymentId: string) {
  const { error } = await admin.from('payments').update({ status: 'success', method: 'Paystack', date: lagosToday() }).eq('id', paymentId).in('status', ['pending', 'failed'])
  return error
}

/** Only called by the single caller that flipped the booking from unpaid to paid. */
async function runPaidSideEffects(admin: SupabaseClient, booking: any, paymentCustomerId: string | null, reference: string) {
  if (booking.room_id) {
    try {
      const { error: holdError } = await admin.from('payment_holds').delete().eq('booking_id', booking.id)
      if (holdError) console.error('[settle-booking] hold cleanup failed', holdError.message)
      const { data: competitors, error: competitorError } = await admin.from('bookings').select('id')
        .eq('room_id', booking.room_id).eq('status', 'pending').neq('payment_status', 'paid').neq('id', booking.id)
        .lt('check_in', booking.check_out).gt('check_out', booking.check_in)
      if (competitorError) console.error('[settle-booking] competitor lookup failed', competitorError.message)
      const losers = (competitors ?? []).map((item: any) => item.id)
      if (losers.length) await admin.from('bookings').update({ status: 'cancelled', reservation_expires_at: null }).in('id', losers)
    } catch (error) { console.error('[settle-booking] room cleanup failed', error) }
  }

  await notifyBookingPaid(admin, booking, reference)

  try {
    const { data: customer } = await admin.from('customers').select('id,user_id,name,email').eq('id', paymentCustomerId || booking.customer_id).maybeSingle()
    if (!customer?.user_id) return
    const { data: existingNotification } = await admin.from('guest_notifications').select('id').eq('user_id', customer.user_id).eq('type', 'payment').contains('metadata', { payment_reference: reference }).limit(1).maybeSingle()
    if (existingNotification) return
    const [{ data: roomType }, { data: shortLet }] = await Promise.all([
      booking.room_type_id ? admin.from('room_types').select('name').eq('id', booking.room_type_id).maybeSingle() : Promise.resolve({ data: null }),
      booking.short_let_id ? admin.from('short_lets').select('name').eq('id', booking.short_let_id).maybeSingle() : Promise.resolve({ data: null }),
    ])
    if (customer.email) {
      try {
        const email = paymentSuccessfulEmail({ guestName: customer.name || 'Guest', reference: booking.reference, roomName: (shortLet as any)?.name || (roomType as any)?.name || 'Short-let', checkIn: booking.check_in, checkOut: booking.check_out, total: Number(booking.amount), paymentReference: reference })
        await enqueueBackgroundEmail({ to: customer.email, subject: email.subject, html: email.html, text: email.text, include_account_cta: false, queueKey: `booking-payment-confirmation:${booking.id}` })
      } catch (emailError) { console.error('[settle-booking] confirmation email failed', emailError) }
    }
    await admin.from('guest_notifications').insert({ user_id: customer.user_id, type: 'payment', title: 'Booking confirmed', body: `Payment for ${booking.reference} was verified. Your reservation is now confirmed.`, href: '/account/bookings', metadata: { booking_id: booking.id, reference: booking.reference, payment_reference: reference, status: 'confirmed' } })
  } catch (error) { console.error('[settle-booking] guest notification failed', error) }
}

/** Paid, but the room/short-let can no longer be given to this guest: money goes back, booking stays cancelled. */
async function refundUnfulfillable(admin: SupabaseClient, secret: string, payment: any, booking: any, transaction: any, why: string): Promise<SettleBookingResult> {
  console.warn('[settle-booking] verified payment cannot be fulfilled; refunding', { reference: payment.reference, bookingId: booking.id, why })
  const refunded = await refundPaystackTransaction(secret, transaction?.id)
  if (!refunded) return fail('refund_failed', true, { detail: why })
  await admin.from('payments').update({ status: 'failed' }).eq('id', payment.id).in('status', ['pending', 'failed'])
  await admin.from('bookings').update({ status: 'cancelled', reservation_expires_at: null }).eq('id', booking.id).eq('status', 'pending').neq('payment_status', 'paid')
  await admin.from('payment_holds').delete().eq('booking_id', booking.id)
  return fail('refunded', false, { detail: why })
}

/**
 * Verify a Paystack transaction and, if (and only if) it is a real, exactly-matching success, make the booking paid.
 * Safe to call any number of times, from any number of concurrent requests.
 */
export async function settleBookingPayment(admin: SupabaseClient, secret: string, reference: string): Promise<SettleBookingResult> {
  try {
    let { data: payment, error: paymentError } = await admin.from('payments').select('id,reference,booking_ref,amount,customer_id,status').eq('reference', reference).maybeSingle()
    if (paymentError) return fail('error', true, { detail: paymentError.message })
    // Room-service payments are settled by their own (already atomic) logic.
    if (payment && isRoomServiceReference(payment.booking_ref)) return fail('room_service', false)

    const verification = await verifyPaystackTransaction(secret, reference)
    if (verification.kind === 'unavailable') return fail('unavailable', true, { detail: verification.detail })
    if (verification.kind === 'not_success') return fail('not_success', false, { status: verification.status })
    const transaction = verification.transaction

    // A guest who started payment twice has only the newest reference on the payment row.
    // Paystack metadata (written by our server at initialization) tells us which booking this payment is for.
    const metadataBookingRef = String(transaction?.metadata?.booking_reference || '').trim()
    if (!payment) {
      if (!metadataBookingRef) return fail('payment_not_found', false)
      const { data: byBooking, error: byBookingError } = await admin.from('payments').select('id,reference,booking_ref,amount,customer_id,status').eq('booking_ref', metadataBookingRef).limit(1).maybeSingle()
      if (byBookingError) return fail('error', true, { detail: byBookingError.message })
      if (!byBooking) return fail('payment_not_found', false)
      if (byBooking.status === 'success') return fail('duplicate_payment', false, { detail: `booking ${metadataBookingRef} is already paid under ${byBooking.reference}` })
      const { error: rebindError } = await admin.from('payments').update({ reference }).eq('id', byBooking.id).in('status', ['pending', 'failed'])
      if (rebindError) return fail('error', true, { detail: rebindError.message })
      payment = { ...byBooking, reference }
    }
    if (!payment) return fail('payment_not_found', false)

    if (metadataBookingRef && metadataBookingRef !== payment.booking_ref) return fail('booking_mismatch', false)
    if (Number(transaction.amount) !== Math.round(Number(payment.amount) * 100)) return fail('amount_mismatch', false, { detail: `paid ${transaction.amount}, expected ${Math.round(Number(payment.amount) * 100)}` })
    if (String(transaction.currency || '').toUpperCase() !== EXPECTED_CURRENCY) return fail('currency_mismatch', false, { detail: String(transaction.currency || '') })

    const { data: booking, error: bookingError } = await admin.from('bookings').select(BOOKING_COLUMNS).eq('reference', payment.booking_ref).maybeSingle()
    if (bookingError) return fail('error', true, { detail: bookingError.message })
    if (!booking) return fail('booking_not_found', false)

    // Already processed (by the webhook, the callback, an admin, or an earlier retry): only
    // mark this attempt successful if it is the payment that actually settled the booking.
    if (booking.payment_status === 'paid') {
      const { data: settledPayment, error: settledPaymentError } = await admin.from('payments')
        .select('id,reference').eq('booking_ref', booking.reference).eq('status', 'success').neq('id', payment.id).limit(1).maybeSingle()
      if (settledPaymentError) return fail('error', true, { detail: settledPaymentError.message })
      if (settledPayment) return refundUnfulfillable(admin, secret, payment, booking, transaction, `booking already settled by ${settledPayment.reference}`)
      const error = await ensurePaymentSuccess(admin, payment.id)
      if (error) return fail('error', true, { detail: error.message })
      return { ok: true, state: 'already_paid', booking }
    }

    if (!booking.room_id && !booking.short_let_id) return refundUnfulfillable(admin, secret, payment, booking, transaction, 'booking has no room or short-let')
    if (!['pending', 'cancelled', 'confirmed'].includes(String(booking.status))) return fail('invalid_booking_state', false, { detail: String(booking.status) })

    // Is the reservation window still held for this guest?
    let holdActive = false
    if (booking.status === 'pending') {
      if (booking.short_let_id) {
        holdActive = !!booking.reservation_expires_at && new Date(booking.reservation_expires_at).getTime() > Date.now()
      } else {
        const { data: hold, error: holdError } = await admin.from('payment_holds').select('room_id,expires_at').eq('booking_id', booking.id).maybeSingle()
        if (holdError) return fail('error', true, { detail: holdError.message })
        holdActive = hold?.room_id === booking.room_id && !!hold?.expires_at && new Date(hold.expires_at).getTime() > Date.now()
      }
    }

    // Late payment (hold expired, or booking was released): a verified payment still confirms the booking
    // if nobody else has taken the room/short-let for these dates; otherwise the guest is refunded.
    if (!holdActive) {
      const resourceColumn = booking.short_let_id ? 'short_let_id' : 'room_id'
      const resourceId = booking.short_let_id || booking.room_id
      const { data: clash, error: clashError } = await admin.from('bookings').select('id').eq(resourceColumn, resourceId).neq('id', booking.id)
        .eq('payment_status', 'paid').in('status', ['confirmed', 'checked_in']).lt('check_in', booking.check_out).gt('check_out', booking.check_in).limit(1)
      if (clashError) return fail('error', true, { detail: clashError.message })
      if (clash?.length) return refundUnfulfillable(admin, secret, payment, booking, transaction, 'dates already taken by another paid booking')
      if (booking.room_id) {
        const { data: otherHold, error: otherHoldError } = await admin.from('payment_holds').select('id').eq('room_id', booking.room_id).neq('booking_id', booking.id)
          .gt('expires_at', new Date().toISOString()).lt('check_in', booking.check_out).gt('check_out', booking.check_in).limit(1)
        if (otherHoldError) return fail('error', true, { detail: otherHoldError.message })
        if (otherHold?.length) return refundUnfulfillable(admin, secret, payment, booking, transaction, 'room is being held by another guest')
      }
    }

    // The single gate: only one concurrent caller can move this booking from unpaid to paid.
    const { data: flipped, error: flipError } = await admin.from('bookings')
      .update({ payment_status: 'paid', status: 'confirmed', reservation_expires_at: null })
      .eq('id', booking.id).neq('payment_status', 'paid').in('status', ['pending', 'cancelled', 'confirmed'])
      .select(BOOKING_COLUMNS).maybeSingle()
    if (flipError) {
      // 23P01 = the database's own overlap protection refused the confirmation: someone else owns those dates.
      if ((flipError as any).code === '23P01') return refundUnfulfillable(admin, secret, payment, booking, transaction, 'database overlap protection')
      return fail('error', true, { detail: flipError.message })
    }

    const paymentUpdateError = await ensurePaymentSuccess(admin, payment.id)
    if (paymentUpdateError) return fail('error', true, { detail: paymentUpdateError.message })

    if (!flipped) return { ok: true, state: 'already_paid', booking } // another request won the gate a moment ago
    await runPaidSideEffects(admin, flipped, payment.customer_id ?? null, reference)
    return { ok: true, state: 'settled', booking: flipped }
  } catch (error: any) {
    console.error('[settle-booking] unexpected error', error)
    return fail('error', true, { detail: String(error?.message || error) })
  }
}
