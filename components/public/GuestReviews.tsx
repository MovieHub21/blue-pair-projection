'use client'

import Link from 'next/link'
import { Star, Quote, ArrowRight } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { GuestReview } from '../../lib/reviews'

export default function GuestReviews({ reviews }: { reviews: GuestReview[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const positionRef = useRef(0)
  const animationRef = useRef<number | null>(null)

  const average =
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length

  const rating = Math.round(average * 2) / 2

  const renderRatingStars = (value: number, size = 15) => {
    return (
      <div className="flex text-gold-500">
        {[1, 2, 3, 4, 5].map(i => {
          const fillPercentage = Math.max(
            0,
            Math.min(1, value - (i - 1))
          )

          return (
            <span
              key={i}
              className="relative inline-flex shrink-0"
              style={{
                width: size,
                height: size,
              }}
            >
              <Star
                size={size}
                className="absolute inset-0"
                strokeWidth={1.8}
              />

              {fillPercentage > 0 && (
                <span
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={{
                    width: `${fillPercentage * 100}%`,
                  }}
                >
                  <Star
                    size={size}
                    fill="currentColor"
                    strokeWidth={1.8}
                  />
                </span>
              )}
            </span>
          )
        })}
      </div>
    )
  }

  useEffect(() => {
    const track = trackRef.current

    if (!track || reviews.length === 0) return

    let lastTime = performance.now()

    const speed = 35

    const animate = (currentTime: number) => {
      const elapsed = currentTime - lastTime
      lastTime = currentTime

      positionRef.current -= (speed * elapsed) / 1000

      const firstGroup = track.children[0] as HTMLElement

      if (firstGroup) {
        const firstGroupWidth = firstGroup.offsetWidth + 20

        if (Math.abs(positionRef.current) >= firstGroupWidth) {
          positionRef.current += firstGroupWidth
        }
      }

      track.style.transform = `translate3d(${positionRef.current}px, 0, 0)`

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [reviews.length])

  if (!reviews.length) return null

  const reviewGroups = [
    reviews,
    reviews,
    reviews,
    reviews,
  ]

  return (
    <section className="section bg-cream-100 overflow-hidden">
      <div className="container-w">
        <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-10 lg:gap-14 items-stretch">

          {/* IMAGE */}
          <div className="relative min-h-[380px] lg:min-h-[520px] rounded-2xl overflow-hidden">
            <img
              src="https://bluepairsignature.com/blue-pair-image.jpeg"
              alt="Guest experience at Blue Pair Hotel"
              className="absolute inset-0 w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

            <div className="absolute left-6 right-6 bottom-6 text-white">
              <span className="text-[11px] uppercase tracking-[0.2em] text-white/70">
                Guest experiences
              </span>

              <h2 className="text-3xl md:text-4xl font-display mt-2 leading-tight">
                What guests say about Blue Pair
              </h2>

              <p className="text-sm text-white/75 mt-3 max-w-md leading-6">
                Real feedback from guests who have stayed with us in Uromi,
                covering rooms, service, dining, facilities and their overall
                experience.
              </p>
            </div>
          </div>

          {/* REVIEWS */}
          <div className="min-w-0 flex flex-col justify-center">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-7">
              <div>
                <span className="eyebrow">
                  Guest experiences
                </span>

                <p className="text-navy-500 text-sm mt-3 max-w-xl">
                  Hear directly from our guests about their stay at Blue Pair
                  Hotel.
                </p>
              </div>

              {/* TOTAL RATING */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-3xl font-display">
                  {average.toFixed(1)}
                </div>

                <div>
                  {renderRatingStars(rating, 15)}

                  <span className="text-xs text-navy-400">
                    Verified guest reviews
                  </span>
                </div>
              </div>
            </div>

            {/* AUTO SCROLL */}
            <div className="relative overflow-hidden">
              <div
                ref={trackRef}
                className="flex w-max gap-5"
                style={{
                  willChange: 'transform',
                }}
              >
                {reviewGroups.map((group, groupIndex) => (
                  <div
                    key={groupIndex}
                    className="flex gap-5 shrink-0"
                  >
                    {group.map((review, reviewIndex) => (
                      <article
                        key={`${groupIndex}-${review.id}-${reviewIndex}`}
                        className="
                           p-6 flex flex-col shrink-0
                          w-[88vw] sm:w-[360px] md:w-[390px]
                          min-h-[330px]
                        "
                      >
                        <Quote
                          size={22}
                          className="text-gold-500/70 mb-4"
                        />

                        {/* REVIEW RATING */}
                        <div className="flex text-gold-500 mb-3">
                          {renderRatingStars(review.rating, 14)}
                        </div>

                        {review.title && (
                          <h3 className="font-semibold text-base mb-2">
                            {review.title}
                          </h3>
                        )}

                        <p className="text-sm text-navy-600 leading-7 flex-1">
                          “{review.review}”
                        </p>

                        {/* REVIEW DATE */}
                        <div className="mt-5 pt-4 border-t border-black/5 text-[11px] text-navy-400">
                          Verified Blue Pair guest ·{' '}
                          {new Date(
                            review.created_at
                          ).toLocaleDateString('en-NG', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </div>
                      </article>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* BOTTOM */}
            <div className="flex items-center justify-end mt-7">
              <Link
                href="/booking"
                className="btn-outline inline-flex items-center gap-2"
              >
                Plan your stay
                <ArrowRight size={15} />
              </Link>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
