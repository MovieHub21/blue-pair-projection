'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase/client'

const WATCHED_TABLES = new Set(['rooms', 'room_daily_statuses', 'bookings'])

export default function RealtimeBridge() {
  useEffect(() => {
    const startedAt = Date.now()

    console.info('[bluepair-realtime][init]', {
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

        console.info('[bluepair-realtime][event]', {
          table,
          operation,
          receivedAt: new Date().toISOString(),
          relevant: table ? WATCHED_TABLES.has(table) : false,
          source: 'broadcast',
        })

        window.dispatchEvent(new CustomEvent('bluepair:database-change', {
          detail: {
            table,
            operation,
          },
        }))
      })
      .subscribe((status, err) => {
        console.info('[bluepair-realtime][subscription]', {
          status,
          error: err?.message ?? null,
          errorCode: err?.code ?? null,
          elapsedMs: Date.now() - startedAt,
        })

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[bluepair-realtime][subscription-failed]', {
            status,
            error: err,
          })
        }
      })

    return () => {
      console.info('[bluepair-realtime][cleanup]')
      void supabase.removeChannel(channel)
    }
  }, [])

  return null
}
