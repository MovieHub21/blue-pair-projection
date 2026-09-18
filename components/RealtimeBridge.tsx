'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase/client'

const WATCHED_TABLES = new Set(['rooms', 'room_daily_statuses', 'bookings'])

export default function RealtimeBridge() {
  useEffect(() => {
    const startedAt = Date.now()

    console.info('[bluepair-realtime][init]', {
      channel: 'bluepair:database',
      startedAt: new Date(startedAt).toISOString(),
      watchedTables: [...WATCHED_TABLES],
    })

    const channel = supabase
      .channel('bluepair:database')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        const changed = payload.new as Record<string, unknown> | null
        const old = payload.old as Record<string, unknown> | null

        console.info('[bluepair-realtime][event]', {
          table: payload.table,
          operation: payload.eventType,
          receivedAt: new Date().toISOString(),
          relevant: WATCHED_TABLES.has(payload.table),
          id: changed?.id ?? old?.id ?? null,
          roomId: changed?.room_id ?? old?.room_id ?? null,
          status: changed?.status ?? old?.status ?? null,
          statusDate: changed?.status_date ?? old?.status_date ?? null,
          bookingReference: changed?.reference ?? old?.reference ?? null,
        })

        window.dispatchEvent(new CustomEvent('bluepair:database-change', {
          detail: {
            table: payload.table,
            operation: payload.eventType,
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
