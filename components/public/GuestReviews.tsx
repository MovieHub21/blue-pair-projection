import Link from 'next/link'
import { Star, Quote } from 'lucide-react'
import type { GuestReview } from '../../lib/reviews'

export default function GuestReviews({ reviews }: { reviews: GuestReview[] }) {
  if (!reviews.length) return null
  const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
  return <section className="section bg-cream-100">
    <div className="container-w">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-10">
        <div><span className="eyebrow">Guest experiences</span><h2 className="text-3xl md:text-4xl font-semibold mt-3">What guests say about Blue Pair</h2><p className="text-navy-500 text-sm mt-3 max-w-xl">Real feedback from guests who have stayed with us in Uromi — covering rooms, service, dining, facilities and the experience of staying at Blue Pair Hotel.</p></div>
        <div className="flex items-center gap-3 shrink-0"><div className="text-3xl font-display">{average.toFixed(1)}</div><div><div className="flex text-gold-500">{[1,2,3,4,5].map(i => <Star key={i} size={15} fill="currentColor" />)}</div><span className="text-xs text-navy-400">Verified guest reviews</span></div></div>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reviews.slice(0, 6).map(review => <article key={review.id} className="card p-6 flex flex-col h-full">
          <Quote size={22} className="text-gold-500/70 mb-4" />
          <div className="flex text-gold-500 mb-3">{[1,2,3,4,5].map(i => <Star key={i} size={14} fill={i <= review.rating ? 'currentColor' : 'none'} />)}</div>
          {review.title && <h3 className="font-semibold text-base mb-2">{review.title}</h3>}
          <p className="text-sm text-navy-600 leading-7 flex-1">“{review.review}”</p>
          {review.keywords.length > 0 && <div className="flex flex-wrap gap-1.5 mt-5">{review.keywords.slice(0, 4).map(keyword => <span key={keyword} className="tag text-[10px]">{keyword}</span>)}</div>}
          <div className="mt-5 pt-4 border-t border-black/5 text-[11px] text-navy-400">Verified Blue Pair guest · {new Date(review.created_at).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })}</div>
        </article>)}
      </div>
      <div className="text-center mt-8"><Link href="/booking" className="btn-outline">Plan your stay</Link></div>
    </div>
  </section>
}
