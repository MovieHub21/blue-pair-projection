'use client'

import { useEffect } from 'react'
import { pushToast } from './Toast'

export default function ApiRateLimitNotifier() {
  useEffect(() => {
    const originalFetch = window.fetch
    let lastShown = 0

    window.fetch = async (...args) => {
      const response = await originalFetch(...args)

      if (response.status === 429) {
        const now = Date.now()
        if (now - lastShown > 3500) {
          lastShown = now
          const retryAfter = Number(response.headers.get('Retry-After') || 60)
          const seconds = Number.isFinite(retryAfter) ? Math.max(1, retryAfter) : 60
          pushToast(`Too many attempts. Please wait about ${seconds} seconds before trying again.`, 'error')
        }
      }

      return response
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  return null
}
