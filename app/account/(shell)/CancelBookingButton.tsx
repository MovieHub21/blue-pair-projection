'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function CancelBookingButton({ bookingId, className }: { bookingId: string; className?: string }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [isPending, startTransition] = useTransition()
  const loading = submitting || isPending

  async function cancel() {
    if (!confirm('Cancel this booking?')) return
    setSubmitting(true)
    try {
      const response = await fetch(`/api/account/bookings/${encodeURIComponent(bookingId)}/cancel`, { method: 'POST' })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Could not cancel booking.')
      startTransition(() => router.refresh())
    } catch (error: any) {
      alert(error?.message || 'Could not cancel booking.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <button onClick={cancel} disabled={loading} className={(className ?? 'btn-outline btn-sm text-red-600 border-red-100') + ' flex items-center gap-1.5 disabled:opacity-60'}>
      {loading && <Loader2 size={13} className="animate-spin" />}
      {loading ? 'Cancelling…' : 'Cancel booking'}
    </button>
  )
}
