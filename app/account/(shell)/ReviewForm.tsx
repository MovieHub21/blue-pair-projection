'use client'

import { useState } from 'react'
import { Loader2, Star } from 'lucide-react'

export default function ReviewForm() {
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [review, setReview] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setStatus(''); setLoading(true)
    try {
      const response = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rating, title, review }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to submit review.')
      setStatus('Thank you — your verified guest review is now live on Blue Pair Hotel.')
      setTitle(''); setReview('');
    } catch (error: any) { setStatus(error?.message || 'Unable to submit review.') } finally { setLoading(false) }
  }

  return <form onSubmit={submit} className="card p-6">
    <span className="eyebrow">Your experience</span>
    <h2 className="text-xl font-semibold mt-2">Share your Blue Pair stay</h2>
    <p className="text-sm text-navy-500 mt-2">Only guests who have checked in can leave a review. Your feedback helps future guests and helps us understand what matters most.</p>
    <div className="flex gap-1 mt-5" aria-label="Rating">
      {[1,2,3,4,5].map(value => <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} stars`} className="p-1"><Star size={25} fill={value <= rating ? 'currentColor' : 'none'} className={value <= rating ? 'text-gold-500' : 'text-navy-200'} /></button>)}
    </div>
    <input value={title} onChange={e=>setTitle(e.target.value)} className="field-input mt-4" maxLength={120} placeholder="Review title (optional)" />
    <textarea required minLength={10} maxLength={2000} rows={5} value={review} onChange={e=>setReview(e.target.value)} className="field-input !h-auto py-3 mt-3" placeholder="Tell us about your room, service, dining, facilities or overall stay…" />
    {status && <div className="text-sm bg-cream-100 rounded-lg p-3 mt-3">{status}</div>}
    <button disabled={loading} className="btn-primary mt-4">{loading ? <><Loader2 size={16} className="animate-spin"/> Publishing…</> : 'Publish my review'}</button>
  </form>
}
