'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase/client'

const WATCHED_TABLES = new Set([
  'user_roles','profiles','room_types','rooms','customers','bookings','staff',
  'menu_items','drinks','short_lets','events','maintenance_tickets','housekeeping_tasks',
  'billboards','parking_zones','payments','offers','guest_requests','gallery_images',
  'amenities','role_permissions','site_content','email_logs','activity_logs','blog_posts',
  'event_reservations','contact_conversations','contact_messages','guest_reviews',
  'guest_notifications','financial_transactions','financial_expenses','site_settings',
  'room_service_orders','payment_holds','room_daily_statuses',
])

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
        const relevant = !!table && WATCHED_TABLES.has(table)

        console.info('[BP-DIAG][realtime][event]', {
          table,
          operation,
          roomId,
          status,
          rawPayload: payload,
          receivedAt: new Date().toISOString(),
          relevant,
          source: 'broadcast',
        })

        // The database broadcast is the shared source-of-truth invalidation signal. Each
        // consumer decides whether the changed table affects its own data.
        if (!relevant) return

        window.dispatchEvent(new CustomEvent('bluepair:database-change', {
          detail: { table, operation, roomId, status },
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
