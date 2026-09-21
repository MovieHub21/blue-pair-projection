import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Room-service payment', robots: { index: false, follow: false } }

const MESSAGES: Record<string, { title: string; description: string }> = {
  payment_cancelled: { title: 'Payment was cancelled', description: 'The payment was cancelled, so your room-service order was not sent to the restaurant. You have not been charged.' },
  payment_failed: { title: 'Payment failed', description: 'Paystack could not complete the payment, so your room-service order was not sent to the restaurant.' },
  payment_pending: { title: 'Payment is still pending', description: 'Paystack has not confirmed this payment yet. Your order will reach the restaurant as soon as it is confirmed. Please check your orders again in a moment.' },
  verification_failed: { title: 'Payment could not be verified', description: 'We could not confirm this payment with Paystack. If money left your account, please contact reception with your order reference.' },
  amount_mismatch: { title: 'Payment amount could not be verified', description: 'The amount received did not match your order, so it was not sent to the restaurant. Please contact reception.' },
  order_not_found: { title: 'Order not found', description: 'We could not find a room-service order for this payment. If money left your account, please contact reception with your payment reference.' },
  payment_not_found: { title: 'Payment not found', description: 'We could not find this room-service payment. If money left your account, please contact reception.' },
  payment_not_configured: { title: 'Payment is temporarily unavailable', description: 'Online payment is not available right now. Please try again later or ask reception for help.' },
  missing_reference: { title: 'Payment reference missing', description: 'This page needs a payment reference. Please start your room-service order again.' },
  update_failed: { title: 'We could not finish your order', description: 'Your payment was verified but the order could not be completed. Please contact reception with your payment reference.' },
}

export default function RoomServicePaymentError({ searchParams }: { searchParams: { reason?: string; reference?: string } }) {
  const message = MESSAGES[String(searchParams.reason || '')] || { title: 'Something went wrong', description: 'We could not complete your room-service payment. Please try again or contact reception.' }
  const reference = String(searchParams.reference || '').trim()

  return (
    <div className="mx-auto max-w-xl">
      <div className="card p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600"><AlertTriangle size={26} /></div>
        <p className="eyebrow mt-5">Room service</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-navy-950">{message.title}</h1>
        <p className="mt-3 text-sm leading-6 text-navy-500">{message.description}</p>
        {reference && <p className="mt-4 text-xs text-navy-400">Payment reference: <b className="text-navy-700">{reference}</b></p>}
        <Link href="/account/requests" className="btn-primary mt-7 inline-flex">Back to requests</Link>
      </div>
    </div>
  )
}
