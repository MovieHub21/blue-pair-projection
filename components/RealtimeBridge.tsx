'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase/client'

const WATCHED_TABLES = new Set([
  'user_roles','profiles','room_types','rooms','customers','bookings','staff',
  'menu_items','drinks','short_lets','events','maintenance_tickets','housekeeping_tasks',
  'billboards','parking_zones','payments','offers','guest_requests','gallery_images',
  'amenities','role_permissions','site_content','email_logs','activity_logs','blog_posts',
  'event_reservations','contact_conversations','contact_messages','guest_reviews',
  'guest_notifications','staff_notifications','financial_transactions','financial_expenses','site_settings',
  'room_service_orders','bar_orders','bar_order_items','payment_holds','room_daily_statuses',
])

type ChangeDetail = { table: string; operation: string | null; roomId: string | null; status: string | null }


const COALESCE_MS = 150

export default function RealtimeBridge() {
  useEffect(() => {
    const startedAt = Date.now()
    const lastEmitted = new Map<string, number>()
    const pending = new Map<string, { timer: number; detail: ChangeDetail }>()

    const emit = (detail: ChangeDetail) => {
      lastEmitted.set(detail.table, Date.now())
      window.dispatchEvent(new CustomEvent('bluepair:database-change', { detail }))
    }

    const dispatchCoalesced = (detail: ChangeDetail) => {
      const queued = pending.get(detail.table)
      if (queued) {
        queued.detail = detail
        return
      }
      const wait = COALESCE_MS - (Date.now() - (lastEmitted.get(detail.table) ?? 0))
      if (wait <= 0) {
        emit(detail)
        return
      }
      const entry = {
        detail,
        timer: window.setTimeout(() => {
          pending.delete(detail.table)
          emit(entry.detail)
        }, wait),
      }
      pending.set(detail.table, entry)
    }

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

       
        if (!relevant) return

        dispatchCoalesced({ table, operation, roomId, status })
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
      pending.forEach(entry => window.clearTimeout(entry.timer))
      pending.clear()
      void supabase.removeChannel(channel)
    }
  }, [])

  return null
}
