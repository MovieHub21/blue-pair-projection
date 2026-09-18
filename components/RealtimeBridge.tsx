'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase/client'

export default function RealtimeBridge() {
  useEffect(() => {
    const channel = supabase
      .channel('bluepair:database')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        window.dispatchEvent(new CustomEvent('bluepair:database-change', {
          detail: {
            table: payload.table,
            operation: payload.eventType,
          },
        }))
      })
      .subscribe((status) => {
        console.info('[bluepair-realtime]', status)
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  return null
}
