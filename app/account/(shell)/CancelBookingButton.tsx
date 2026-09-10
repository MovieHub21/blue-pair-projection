'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { supabase } from '../../../lib/supabase/client'

export default function CancelBookingButton({ bookingId, className }: { bookingId: string; className?: string }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [isPending, startTransition] = useTransition()
  const loading = submitting || isPending

  async function cancel() {
    if (!confirm('Cancel this booking?')) return
    setSubmitting(true)
    const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId)
    setSubmitting(false)
    if (error) { alert('Could not cancel booking: ' + error.message); return }
    startTransition(() => router.refresh())
  }

  return (
    <button onClick={cancel} disabled={loading} className={(className ?? 'btn-outline btn-sm text-red-600 border-red-100') + ' flex items-center gap-1.5 disabled:opacity-60'}>
      {loading && <Loader2 size={13} className="animate-spin" />}
      {loading ? 'Cancelling…' : 'Cancel booking'}
    </button>
  )
}
