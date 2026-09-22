'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  images: string[]
  alt: string
  className?: string
  imageClassName?: string
  autoPlay?: boolean
  interval?: number
  showArrows?: boolean
  showDots?: boolean
  showCounter?: boolean
  /** 'slide' (default) pans horizontally; 'fade' softly cross-dissolves — the subtler, hands-off feel for hero and room galleries. */
  transition?: 'slide' | 'fade'
}

export default function ImageCarousel({
  images,
  alt,
  className = '',
  imageClassName = '',
  autoPlay = false,
  interval = 5000,
  showArrows = true,
  showDots = true,
  showCounter = false,
  transition = 'slide',
}: Props) {
  const slides = useMemo(() => images.filter(Boolean), [images])
  const safeSlides = slides.length ? slides : ['']
  const [index, setIndex] = useState(0)
  const startX = useRef<number | null>(null)
  const dragging = useRef(false)

  useEffect(() => {
    if (!autoPlay || safeSlides.length < 2) return
    const timer = window.setInterval(() => setIndex(current => (current + 1) % safeSlides.length), interval)
    return () => window.clearInterval(timer)
  }, [autoPlay, interval, safeSlides.length])

  useEffect(() => {
    if (index >= safeSlides.length) setIndex(0)
  }, [index, safeSlides.length])

  const previous = () => setIndex(current => (current - 1 + safeSlides.length) % safeSlides.length)
  const next = () => setIndex(current => (current + 1) % safeSlides.length)

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (safeSlides.length < 2) return
    startX.current = event.clientX
    dragging.current = true
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current || startX.current === null) return
    const distance = event.clientX - startX.current
    if (Math.abs(distance) >= 45) distance < 0 ? next() : previous()
    startX.current = null
    dragging.current = false
  }

  const handlePointerCancel = () => {
    startX.current = null
    dragging.current = false
  }

  return (
    <div className={`relative overflow-hidden touch-pan-y select-none ${className}`} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={handlePointerCancel} onPointerLeave={handlePointerCancel}>
      {transition === 'fade' ? (
        <div className="relative h-full w-full">
          {safeSlides.map((src, i) => (
            src && <img key={`${src}-${i}`} src={src} alt={`${alt}${safeSlides.length > 1 ? ` — image ${i + 1} of ${safeSlides.length}` : ''}`} draggable={false}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ease-in-out ${i === index ? 'opacity-100' : 'opacity-0'} ${imageClassName}`} />
          ))}
        </div>
      ) : (
        <div className="flex h-full transition-transform duration-500 ease-out" style={{ transform: `translate3d(-${index * 100}%,0,0)` }}>
          {safeSlides.map((src, i) => (
            <div key={`${src}-${i}`} className="relative h-full w-full shrink-0">
              {src && <img src={src} alt={`${alt}${safeSlides.length > 1 ? ` — image ${i + 1} of ${safeSlides.length}` : ''}`} className={`h-full w-full object-cover ${imageClassName}`} draggable={false} />}
            </div>
          ))}
        </div>
      )}

      {safeSlides.length > 1 && showArrows && <><button type="button" onClick={previous} aria-label="Previous image" className="absolute left-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-navy-950/55 text-white backdrop-blur-md shadow-lg transition hover:bg-navy-950/75 active:scale-95"><ChevronLeft size={18} /></button><button type="button" onClick={next} aria-label="Next image" className="absolute right-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-navy-950/55 text-white backdrop-blur-md shadow-lg transition hover:bg-navy-950/75 active:scale-95"><ChevronRight size={18} /></button></>}

      {safeSlides.length > 1 && showCounter && <span className="absolute right-3 top-3 rounded-full border border-white/15 bg-navy-950/60 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-md">{index + 1} / {safeSlides.length}</span>}

      {safeSlides.length > 1 && showDots && <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5" aria-label="Room images">{safeSlides.map((_, i) => <button key={i} type="button" onClick={() => setIndex(i)} aria-label={`View image ${i + 1}`} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/55'}`} />)}</div>}
    </div>
  )
}
