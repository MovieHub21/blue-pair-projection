'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabase/client'

export type LiveTableOptions<T> = {
  table: string
  orderBy?: string
  ascending?: boolean
  map?: (row: any) => T
}

export function useLiveTable<T = any>(options: LiveTableOptions<T>) {
  const { table, orderBy, ascending = true, map = (row => row as T) } = options
  const [rows, setRows] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    let query = supabase.from(table).select('*')
    if (orderBy) query = query.order(orderBy, { ascending })
    const { data, error } = await query
    if (error) {
      console.error('[BP-REALTIME][fetch]', table, error.message)
      return
    }
    setRows((data ?? []).map(map))
    setLoading(false)
  }, [table, orderBy, ascending, map])

  useEffect(() => {
    let timer: number | undefined
    const refresh = (event: Event) => {
      const detail = (event as CustomEvent).detail ?? {}
      if (detail.table !== table) return
      if (timer) window.clearTimeout(timer)
      timer = window.setTimeout(() => void load(), 80)
    }

    void load()
    window.addEventListener('bluepair:database-change', refresh)

    return () => {
      window.removeEventListener('bluepair:database-change', refresh)
      if (timer) window.clearTimeout(timer)
    }
  }, [table, load])

  return { rows, loading, refresh: load }
}
