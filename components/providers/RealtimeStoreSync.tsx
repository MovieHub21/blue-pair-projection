'use client'

import { useEffect } from 'react'
import { useStore } from '../../store/useStore'

export default function RealtimeStoreSync() {
  useEffect(() => {
    let refreshTimer: number | null = null

    const refresh = (event: Event) => {
      const detail = (event as CustomEvent).detail || {}
      console.info('[BP-DIAG][store-sync][event]', {
        table: detail.table ?? null,
        operation: detail.operation ?? null,
        roomId: detail.roomId ?? null,
        status: detail.status ?? null,
        receivedAt: new Date().toISOString(),
      })

      if (refreshTimer !== null) window.clearTimeout(refreshTimer)
      refreshTimer = window.setTimeout(async () => {
        const startedAt = Date.now()
        console.info('[BP-DIAG][store-sync][load-start]', { startedAt: new Date(startedAt).toISOString() })
        await useStore.getState().loadAll()
        const rooms = useStore.getState().rooms
        console.info('[BP-DIAG][store-sync][load-complete]', {
          elapsedMs: Date.now() - startedAt,
          targetRoom: detail.roomId
            ? rooms.find((room) => room.id === detail.roomId)
              ? { id: detail.roomId, roomNumber: rooms.find((room) => room.id === detail.roomId)?.roomNumber, status: rooms.find((room) => room.id === detail.roomId)?.status }
              : null
            : null,
          roomStatuses: rooms.map((room) => ({ roomNumber: room.roomNumber, status: room.status })),
        })
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
