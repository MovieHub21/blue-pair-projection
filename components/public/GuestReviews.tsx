'use client'

import Link from 'next/link'
import { ArrowRight, ExternalLink, Star } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { GoogleReviewsData } from '../../lib/googleReviews'

function Stars({ rating }: { rating: number }) {
  return <span className="inline-flex gap-0.5 text-gold-500" aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map(star => <Star key={star} size={15} fill={star <= Math.round(rating) ? 'currentColor' : 'none'} strokeWidth={1.8} />)}
  </span>
}

export default function GuestReviews({ mapsProfileUrl }: { mapsProfileUrl: string }) {
  const [data, setData] = useState<GoogleReviewsData | null>(null)
  const [loaded, setLoaded] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)

  useEffect(() => {
    let active = true
    fetch('/api/google-reviews').then(response => response.ok ? response.json() : null)
      .then(result => { if (active) setData(result?.data ?? null) })
      .catch(() => { if (active) setData(null) })
      .finally(() => { if (active) setLoaded(true) })
    return () => { active = false }
  }, [])

  const mapsUrl = data?.googleMapsUri || mapsProfileUrl
  const reviews = data?.reviews ?? []

  useEffect(() => {
    const track = trackRef.current
    const firstGroup = track?.firstElementChild as HTMLElement | null
    if (!track || !firstGroup || reviews.length === 0) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let position = 0
    let lastTime = performance.now()
    let frame = 0
    let cycleDistance = firstGroup.offsetWidth + 16

    const animate = (now: number) => {
      const elapsed = now - lastTime
      lastTime = now
      if (!pausedRef.current) {
        position -= (28 * elapsed) / 1000
        if (Math.abs(position) >= cycleDistance) position += cycleDistance
        track.style.transform = `translate3d(${position}px, 0, 0)`
      }
      frame = requestAnimationFrame(animate)
    }

    const resizeObserver = new ResizeObserver(() => {
      cycleDistance = firstGroup.offsetWidth + 16
    })
    resizeObserver.observe(firstGroup)
    frame = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      track.style.transform = ''
    }
  }, [reviews.length])

  const reviewGroups = [reviews, reviews]

  return (
    <section className="section bg-cream-100">
      <div className="container-w">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="eyebrow">Guest experiences on Google</span>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">What guests say about Blue Pair Signature</h2>
            <p className="mt-3 text-sm leading-6 text-navy-500">Read guest feedback published on Google, or share your own experience directly on our Business Profile.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {data?.rating !== null && data?.rating !== undefined && <div className="flex items-center gap-2 rounded-xl border border-black/5 bg-white px-4 py-2.5">
              <span className="font-display text-2xl">{data.rating.toFixed(1)}</span><span className="flex flex-col"><Stars rating={data.rating} /><span className="text-[10px] text-navy-400">Overall rating · {data.reviewCount ?? 0} Google reviews</span></span>
            </div>}
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-navy-900/15 bg-white px-3.5 py-2 text-xs font-semibold text-navy-800 transition-colors hover:border-gold-500 hover:text-navy-950">See all reviews on Google <ExternalLink size={12} /></a>
          </div>
        </div>

        {reviews.length > 0 ? <>
          <div className="relative mt-8 overflow-hidden" onPointerEnter={() => { pausedRef.current = true }} onPointerLeave={() => { pausedRef.current = false }} onFocusCapture={() => { pausedRef.current = true }} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) pausedRef.current = false }}>
            <div ref={trackRef} className="flex w-max gap-4 will-change-transform" aria-label="Google guest reviews" aria-live="off">
              {reviewGroups.map((group, groupIndex) => <div key={groupIndex} aria-hidden={groupIndex === 1} className="flex shrink-0 gap-4">
                {group.map(review => <article key={`${groupIndex}-${review.id}`} className="flex min-h-[230px] w-[min(82vw,370px)] flex-col rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:w-[370px]">
                  <div className="flex items-center justify-between gap-3"><Stars rating={review.rating} /><span className="text-[11px] text-navy-400">{review.published}</span></div>
                  <p className="mt-4 flex-1 whitespace-pre-line text-sm leading-7 text-navy-700">“{review.text}”</p>
                  <div className="mt-5 flex items-center justify-between gap-2 border-t border-black/5 pt-4 text-xs">
                    {review.authorUrl ? <a href={review.authorUrl} target="_blank" rel="noopener noreferrer" tabIndex={groupIndex === 1 ? -1 : undefined} className="font-semibold text-navy-800 hover:underline">{review.author}</a> : <span className="font-semibold text-navy-800">{review.author}</span>}
                    <a href={review.googleMapsUri} target="_blank" rel="noopener noreferrer" tabIndex={groupIndex === 1 ? -1 : undefined} className="inline-flex shrink-0 items-center gap-1 text-navy-500 hover:text-navy-900">View on Google <ExternalLink size={12} /></a>
                  </div>
                </article>)}
              </div>)}
            </div>
          </div>
          <p className="mt-4 text-[11px] text-navy-400">Google reviews shown here are ordered by relevance. Google checks reviews for policy violations; reviews are not individually verified by Google.</p>
        </> : <div className="mt-8 rounded-2xl border border-black/5 bg-white p-6 text-sm text-navy-500">
          {loaded ? data ? 'There are no Google review excerpts available to display right now.' : 'See the latest rating and guest reviews on our Google Business Profile.' : 'Loading Google reviews…'}
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="ml-1 inline-flex items-center gap-1 font-semibold text-navy-900 underline underline-offset-4">Open Google Maps <ExternalLink size={12} /></a>
        </div>}

        <div className="mt-6 flex justify-end"><Link href="/booking" className="btn-outline inline-flex items-center gap-2">Plan your stay <ArrowRight size={15} /></Link></div>
        <div className="mt-3 text-right text-[11px] font-medium text-navy-400">Google Maps</div>
      </div>
    </section>
  )
}
