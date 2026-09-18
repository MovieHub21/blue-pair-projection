'use client'

import { useEffect } from 'react'
import { useStore } from '../../store/useStore'

export default function RealtimeStoreSync() {
  useEffect(() => {
    let refreshTimer: number | null = null

    const refresh = () => {
      if (refreshTimer !== null) window.clearTimeout(refreshTimer)
      refreshTimer = window.setTimeout(() => {
        void useStore.getState().loadAll()
      }, 120)
    }

    window.addEventListener('bluepair:database-change', refresh)
    return () => {
      window.removeEventListener('bluepair:database-change', refresh)
      if (refreshTimer !== null) window.clearTimeout(refreshTimer)
    }
  }, [])

  return null
}
