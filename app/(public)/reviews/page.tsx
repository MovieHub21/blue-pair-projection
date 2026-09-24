import type { Metadata } from 'next'
import { Star } from 'lucide-react'
import { getPublishedGuestReviews } from '../../lib/reviews'
import { SITE_NAME, SITE_URL } from '../../lib/siteConfig'

export const metadata: Metadata = {
  title: 'Guest Reviews | Blue Pair Hotel Uromi',
  description: 'Read verified guest reviews about stays, rooms, service, dining and facilities at Blue Pair Signature Crown Hotel & Suites in Uromi, Edo State.',
  alternates: {
    canonical: `${SITE_URL}/reviews`,
  },
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ReviewsPage() {
  const reviews = await getPublishedGuestReviews(100)

  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0

  return (
    <main className="bg-cream-50 text-navy-950">
      <section className="section pt-32 md:pt-40">
        <div className="container-w">
          <div className="max-w-3xl">
            <span className="eyebrow">Guest experiences</span>
            <h1 className="mt-3 font-display text-4xl font-medium md:text-6xl">
              Guest Reviews
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-navy-600 md:text-base">
              Read feedback from guests who have stayed at {SITE_NAME} in Uromi,
              covering rooms, service, dining, facilities and their overall stay.
            </p>

            {reviews.length > 0 && (
              <div className="mt-7 flex items-center gap-3">
                <span className="font-display text-3xl">{average.toFixed(1)}</span>
                <div>
                  <div className="flex gap-0.5 text-gold-500">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        size={16}
                        fill={star <= Math.round(average) ? 'currentColor' : 'none'}
                        strokeWidth={1.8}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-navy-400">
                    {reviews.length} verified guest review{reviews.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {reviews.length > 0 ? (
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {reviews.map(review => (
                <article
                  key={review.id}
                  className="flex min-h-[300px] flex-col rounded-2xl border border-navy-900/10 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex gap-0.5 text-gold-500">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          size={15}
                          fill={star <= review.rating ? 'currentColor' : 'none'}
                          strokeWidth={1.8}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-navy-400">
                      Verified guest
                    </span>
                  </div>

                  {review.title && (
                    <h2 className="mt-5 text-base font-semibold">
                      {review.title}
                    </h2>
                  )}

                  <p className="mt-3 flex-1 text-sm leading-7 text-navy-600">
                    “{review.review}”
                  </p>

                  <time
                    dateTime={review.created_at}
                    className="mt-6 border-t border-black/5 pt-4 text-[11px] text-navy-400"
                  >
                    {new Date(review.created_at).toLocaleDateString('en-NG', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </time>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-12 text-sm text-navy-500">
              Guest reviews will appear here as they are published.
            </p>
          )}
        </div>
      </section>
    </main>
  )
}
