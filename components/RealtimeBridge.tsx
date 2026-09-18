'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase/client'

export default function RealtimeBridge() {
  useEffect(() => {
    const channel = supabase
      .channel('bluepair:database')
      .on('broadcast', { event: 'db_change' }, (message) => {
        window.dispatchEvent(new CustomEvent('bluepair:database-change', { detail: message.payload }))
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          window.dispatchEvent(new CustomEvent('bluepair:realtime-ready'))
        }
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  return null
}
