'use client'

import { useEffect } from 'react'

/**
 * Lightweight scroll-reveal enhancement for the public hotel website.
 * It uses IntersectionObserver instead of a large animation dependency so
 * SEO, page structure, and runtime performance remain unchanged.
 */
export default function PublicMotion() {
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return

    const root = document.querySelector('main') || document.body

    const candidates = root.querySelectorAll<HTMLElement>(
      'section, article, [data-reveal], .card, .glass-card'
    )

    candidates.forEach((element) => {
      if (element.dataset.motionReady === 'true') return
      element.dataset.motionReady = 'true'
      element.classList.add('scroll-reveal')
    })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -7% 0px' }
    )

    root.querySelectorAll<HTMLElement>('.scroll-reveal').forEach((element) => observer.observe(element))

    return () => observer.disconnect()
  }, [])

  return null
}
