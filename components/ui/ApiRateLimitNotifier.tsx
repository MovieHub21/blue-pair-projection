'use client'

import { useEffect } from 'react'
import { useStore } from '../../store/useStore'

export default function ApiRateLimitNotifier() {
  const pushToast = useStore(s => s.pushToast)

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
  }, [pushToast])

  return null
}
