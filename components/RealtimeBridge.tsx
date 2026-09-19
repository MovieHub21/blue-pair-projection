'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase/client'

const WATCHED_TABLES = new Set(['rooms', 'room_daily_statuses', 'bookings'])

export default function RealtimeBridge() {
  useEffect(() => {
    const startedAt = Date.now()

    console.info('[BP-DIAG][realtime][init]', {
      channel: 'bluepair:database',
      mode: 'broadcast',
      startedAt: new Date(startedAt).toISOString(),
      watchedTables: [...WATCHED_TABLES],
    })

    const channel = supabase
      .channel('bluepair:database')
      .on('broadcast', { event: 'db_change' }, (message) => {
        const payload = (message?.payload ?? {}) as Record<string, unknown>
        const table = typeof payload.table === 'string' ? payload.table : null
        const operation = typeof payload.operation === 'string' ? payload.operation : null
        const roomId = typeof payload.roomId === 'string' ? payload.roomId : null
        const status = typeof payload.status === 'string' ? payload.status : null

        console.info('[BP-DIAG][realtime][event]', {
          table,
          operation,
          roomId,
          status,
          rawPayload: payload,
          receivedAt: new Date().toISOString(),
          relevant: table ? WATCHED_TABLES.has(table) : false,
          source: 'broadcast',
        })

        window.dispatchEvent(new CustomEvent('bluepair:database-change', {
          detail: {
            table,
            operation,
            roomId,
            status,
          },
        }))
      })
      .subscribe((status, err) => {
        console.info('[BP-DIAG][realtime][subscription]', {
          status,
          error: err?.message ?? null,
          errorCode: err?.code ?? null,
          elapsedMs: Date.now() - startedAt,
        })

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[BP-DIAG][realtime][subscription-failed]', {
            status,
            error: err,
          })
        }
      })

    return () => {
      console.info('[BP-DIAG][realtime][cleanup]')
      void supabase.removeChannel(channel)
    }
  }, [])

  return null
}
