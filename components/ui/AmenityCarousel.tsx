'use client'

import { useEffect, useState } from 'react'

type Props = {
  images: string[]
  name: string
}

export default function AmenityCarousel({ images, name }: Props) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return

    const timer = window.setInterval(() => {
      setActive(current => (current + 1) % images.length)
    }, 5000)

    return () => window.clearInterval(timer)
  }, [images.length])

  if (!images.length) return null

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl aspect-[4/3]">
        <div
          className="flex h-full transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            transform: `translateX(-${active * 100}%)`,
          }}
        >
          {images.map((image, index) => (
            <div
              key={`${image}-${index}`}
              className="relative w-full h-full shrink-0"
            >
              <img
                src={image}
                alt={`${name} at Blue Pair Hotel, Uromi`}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <div className="flex justify-center items-center gap-2 mt-5">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => setActive(index)}
              className="p-1"
            >
              <span
                className={`
                  block rounded-full transition-all duration-500
                  ${
                    index === active
                      ? 'w-6 h-2 bg-gold-500'
                      : 'w-2 h-2 bg-navy-200'
                  }
                `}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}