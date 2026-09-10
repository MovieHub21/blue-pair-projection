'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase/client'

export default function CancelBookingButton({ bookingId, className }: { bookingId: string; className?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function cancel() {
    if (!confirm('Cancel this booking?')) return
    setLoading(true)
    const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId)
    setLoading(false)
    if (error) { alert('Could not cancel booking: ' + error.message); return }
    router.refresh()
  }

  return (
    <button onClick={cancel} disabled={loading} className={className ?? 'btn-outline btn-sm text-red-600 border-red-100'}>
      {loading ? 'Cancelling…' : 'Cancel booking'}
    </button>
  )
}
