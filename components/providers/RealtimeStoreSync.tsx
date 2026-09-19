'use client'

import { useEffect } from 'react'
import { useStore } from '../../store/useStore'

const STORE_REFRESH_TABLES = new Set([
  'rooms',
  'room_daily_statuses',
  'bookings',
  'payment_holds',
])

export default function RealtimeStoreSync() {
  useEffect(() => {
    let refreshTimer: number | null = null
    let loading = false
    let refreshQueued = false
    let latestDetail: Record<string, unknown> = {}

    const runLoad = async () => {
      if (loading) {
        refreshQueued = true
        return
      }

      loading = true
      const startedAt = Date.now()

      try {
        console.info('[BP-DIAG][store-sync][load-start]', {
          startedAt: new Date(startedAt).toISOString(),
        })

        await useStore.getState().loadAll()

        const rooms = useStore.getState().rooms
        const roomId = typeof latestDetail.roomId === 'string' ? latestDetail.roomId : null

        console.info('[BP-DIAG][store-sync][load-complete]', {
          elapsedMs: Date.now() - startedAt,
          targetRoom: roomId
            ? (() => {
                const room = rooms.find((item) => item.id === roomId)
                return room ? { id: room.id, roomNumber: room.roomNumber, status: room.status } : null
              })()
            : null,
          roomStatuses: rooms.map((room) => ({
            roomNumber: room.roomNumber,
            status: room.status,
          })),
        })
      } finally {
        loading = false

        if (refreshQueued) {
          refreshQueued = false
          void runLoad()
        }
      }
    }

    const refresh = (event: Event) => {
      const detail = (event as CustomEvent).detail || {}
      const table = typeof detail.table === 'string' ? detail.table : null
      if (!table || !STORE_REFRESH_TABLES.has(table)) return

      latestDetail = detail

      console.info('[BP-DIAG][store-sync][event]', {
        table,
        operation: detail.operation ?? null,
        roomId: detail.roomId ?? null,
        status: detail.status ?? null,
        receivedAt: new Date().toISOString(),
      })

      if (refreshTimer !== null) window.clearTimeout(refreshTimer)
      refreshTimer = window.setTimeout(() => {
        refreshTimer = null
        void runLoad()
      }, 180)
    }

    window.addEventListener('bluepair:database-change', refresh)

    return () => {
      window.removeEventListener('bluepair:database-change', refresh)
      if (refreshTimer !== null) window.clearTimeout(refreshTimer)
    }
  }, [])

  return null
}
