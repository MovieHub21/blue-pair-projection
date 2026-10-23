import { ExternalLink, Star } from 'lucide-react'
import { getGoogleReviewUrl } from '../../../lib/googleReviews'

export default function ReviewForm() {
  const reviewUrl = getGoogleReviewUrl()

  return <section className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
    <div className="max-w-xl">
      <span className="eyebrow">Your experience</span>
      <h2 className="mt-2 text-xl font-semibold">How was your stay?</h2>
      <p className="mt-2 text-sm leading-6 text-navy-500">Share your rating and feedback directly on Google. Your review will be published on Google after their review process.</p>
    </div>
    <a href={reviewUrl} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex shrink-0 items-center justify-center gap-2"> <Star size={16} /> Rate Blue Pair on Google <ExternalLink size={14} /></a>
  </section>
}
