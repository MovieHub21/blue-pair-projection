'use client'

import { useEffect, useState } from 'react'
import { Loader2, Star, Pencil, Trash2, X } from 'lucide-react'

export default function ReviewForm() {
  const [reviewId, setReviewId] = useState<string | null>(null)
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [review, setReview] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingReview, setLoadingReview] = useState(true)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/reviews')
      .then(async response => response.json())
      .then(data => {
        if (!active) return
        if (data.review) {
          setReviewId(data.review.id)
          setRating(data.review.rating)
          setTitle(data.review.title || '')
          setReview(data.review.review || '')
        }
      })
      .catch(() => {})
      .finally(() => active && setLoadingReview(false))
    return () => { active = false }
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setStatus(''); setLoading(true)
    try {
      const response = await fetch('/api/reviews', {
        method: reviewId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reviewId, rating, title, review }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to save review.')
      setReviewId(data.review.id)
      setRating(data.review.rating)
      setTitle(data.review.title || '')
      setReview(data.review.review || '')
      setEditing(false)
      setStatus(reviewId ? 'Your review has been updated.' : 'Thank you — your verified guest review is now live on Blue Pair Hotel.')
    } catch (error: any) {
      setStatus(error?.message || 'Unable to save review.')
    } finally { setLoading(false) }
  }

  async function deleteReview() {
    if (!reviewId || !window.confirm('Delete your review? This will remove it from the Blue Pair website.')) return
    setStatus(''); setLoading(true)
    try {
      const response = await fetch('/api/reviews', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: reviewId }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to delete review.')
      setReviewId(null); setRating(5); setTitle(''); setReview(''); setEditing(false)
      setStatus('Your review has been deleted.')
    } catch (error: any) {
      setStatus(error?.message || 'Unable to delete review.')
    } finally { setLoading(false) }
  }

  if (loadingReview) return <div className="card p-6 text-sm text-navy-400">Loading your review…</div>

  if (reviewId && !editing) return <div className="card p-6">
    <span className="eyebrow">Your experience</span>
    <div className="flex items-start justify-between gap-4 mt-2">
      <div><h2 className="text-xl font-semibold">Your Blue Pair review</h2><p className="text-sm text-navy-500 mt-2">Your review is published and visible to future guests.</p></div>
      <div className="flex gap-2 shrink-0">
        <button type="button" onClick={() => { setStatus(''); setEditing(true) }} disabled={loading} className="btn-outline btn-sm"><Pencil size={14}/> Edit</button>
        <button type="button" onClick={deleteReview} disabled={loading} className="btn-outline btn-sm text-red-600"><Trash2 size={14}/> Delete</button>
      </div>
    </div>
    <div className="flex gap-1 mt-5">{[1,2,3,4,5].map(value => <Star key={value} size={19} fill={value <= rating ? 'currentColor' : 'none'} className={value <= rating ? 'text-gold-500' : 'text-navy-200'} />)}</div>
    {title && <h3 className="font-semibold mt-4">{title}</h3>}
    <p className="text-sm text-navy-600 leading-7 mt-2">“{review}”</p>
    {status && <div className="text-sm bg-cream-100 rounded-lg p-3 mt-4">{status}</div>}
  </div>

  return <form onSubmit={submit} className="card p-6">
    <div className="flex items-start justify-between gap-4">
      <div><span className="eyebrow">Your experience</span><h2 className="text-xl font-semibold mt-2">{reviewId ? 'Edit your Blue Pair review' : 'Share your Blue Pair stay'}</h2></div>
      {reviewId && <button type="button" onClick={() => setEditing(false)} className="p-2 rounded-lg hover:bg-black/5" aria-label="Cancel editing"><X size={18}/></button>}
    </div>
    <p className="text-sm text-navy-500 mt-2">Only guests who have checked in can leave a review. You can edit or delete your review whenever you want.</p>
    <div className="flex gap-1 mt-5" aria-label="Rating">
      {[1,2,3,4,5].map(value => <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} stars`} className="p-1"><Star size={25} fill={value <= rating ? 'currentColor' : 'none'} className={value <= rating ? 'text-gold-500' : 'text-navy-200'} /></button>)}
    </div>
    <input value={title} onChange={e=>setTitle(e.target.value)} className="field-input mt-4" maxLength={120} placeholder="Review title (optional)" />
    <textarea required minLength={10} maxLength={2000} rows={5} value={review} onChange={e=>setReview(e.target.value)} className="field-input !h-auto py-3 mt-3" placeholder="Tell us about your room, service, dining, facilities or overall stay…" />
    {status && <div className="text-sm bg-cream-100 rounded-lg p-3 mt-3">{status}</div>}
    <div className="flex gap-2 mt-4">
      <button disabled={loading} className="btn-primary">{loading ? <><Loader2 size={16} className="animate-spin"/> Saving…</> : reviewId ? 'Save changes' : 'Publish my review'}</button>
      {reviewId && <button type="button" disabled={loading} onClick={() => setEditing(false)} className="btn-outline">Cancel</button>}
    </div>
  </form>
}
