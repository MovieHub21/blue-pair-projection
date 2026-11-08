import type { SupabaseClient } from '@supabase/supabase-js'
import { notifyStaff } from '../staffNotifications'
import { sendAnnexOrderStaffEmails, sendAnnexOrderStatusEmail } from '../email/annexOrders'
import { verifyPaystackTransaction } from './settleBooking'

export type AnnexSettlementResult =
  | { ok: true; state: 'settled' | 'already_settled'; orderId: string; orderReference: string }
  | { ok: false; reason: 'not_found' | 'not_success' | 'verify_unavailable' | 'currency_mismatch' | 'amount_mismatch' | 'reference_mismatch' | 'cancelled' | 'database_error'; transient: boolean }

function idPart() { return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}` }

/** Verify a checkout with Paystack, then atomically create its order/items and mark it paid. */
export async function settleAnnexCheckout(admin: SupabaseClient, secret: string, paymentReference: string): Promise<AnnexSettlementResult> {
  try {
    let { data: checkout, error } = await admin.from('bar_order_checkouts').select('*').eq('reference', paymentReference).maybeSingle()
    if (error) return { ok: false, reason: 'database_error', transient: true }
    if (!checkout) {
      const lookup = await admin.from('bar_order_checkouts').select('*').eq('payment_reference', paymentReference).maybeSingle()
      if (lookup.error) return { ok: false, reason: 'database_error', transient: true }
      checkout = lookup.data
    }
    if (!checkout) return { ok: false, reason: 'not_found', transient: false }

    if (checkout.status === 'cancelled') return { ok: false, reason: 'cancelled', transient: false }

    const verification = await verifyPaystackTransaction(secret, paymentReference)
    if (verification.kind === 'unavailable') return { ok: false, reason: 'verify_unavailable', transient: true }
    if (verification.kind !== 'success') return { ok: false, reason: 'not_success', transient: true }

    const transaction = verification.transaction
    const verifiedReference = String(transaction.reference || '')
    const allowedReferences = new Set([String(checkout.reference), String(checkout.payment_reference || '')])
    if (!allowedReferences.has(verifiedReference) || verifiedReference !== paymentReference) {
      return { ok: false, reason: 'reference_mismatch', transient: false }
    }
    if (String(transaction.currency || '').toUpperCase() !== 'NGN') return { ok: false, reason: 'currency_mismatch', transient: false }
    if (Number(transaction.amount) !== Math.round(Number(checkout.total) * 100)) return { ok: false, reason: 'amount_mismatch', transient: false }

    const payload: any = checkout.payload || {}
    const orderId = `annex_${idPart()}`
    const orderReference = `ANX-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
    const { data: settlement, error: settlementError } = await admin.rpc('settle_annex_order_checkout', {
      p_checkout_reference: checkout.reference,
      p_payment_reference: paymentReference,
      p_order_id: orderId,
      p_order_reference: orderReference,
    })
    if (settlementError || !settlement?.order_id || !settlement?.order_reference) {
      console.error('[annex-payment] atomic settlement failed', settlementError?.message || 'Missing order id', { paymentReference })
      return { ok: false, reason: 'database_error', transient: true }
    }

    const settledOrderId = String(settlement.order_id)
    if (settlement.created === true) {
      try {
        await sendAnnexOrderStatusEmail(admin, settledOrderId, 'pending')
        await sendAnnexOrderStaffEmails(admin, settledOrderId)
        const outlet = String(payload.outlet || 'bar')
        await notifyStaff(admin, {
          audiences: [
            { department: 'annex', href: '/admin/annex' },
            { department: 'restaurant', href: '/admin/annex' },
            { department: 'bar', href: '/admin/annex' },
          ],
          type: 'annex_order',
          title: `New Annex order — ${orderReference}`,
          body: `${payload.deliveryLabel || 'Annex'} · ₦${Number(checkout.total).toLocaleString('en-NG')} · paid`,
          metadata: { annex_order_id: settledOrderId, reference: orderReference, outlet },
          includeManagement: true,
          dedupeKey: `annex_order_paid:${orderReference}`,
        })
      } catch (sideEffectError) {
        // The transaction is safely settled. A notification failure must not undo it or make a retry duplicate the order.
        console.error('[annex-payment] post-settlement notification failed', sideEffectError)
      }
    }

    return { ok: true, state: settlement.created === true ? 'settled' : 'already_settled', orderId: settledOrderId, orderReference: String(settlement.order_reference) }
  } catch (error) {
    console.error('[annex-payment] unexpected settlement error', error)
    return { ok: false, reason: 'database_error', transient: true }
  }
}
