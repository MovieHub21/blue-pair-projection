'use client'
import { useEffect } from 'react'
import { useStore } from '../../store/useStore'

/** Loads live data from the database into the app store once per session. */
export default function StoreLoader() {
  const loadAll = useStore(s => s.loadAll)
  const loaded = useStore(s => s.loaded)
  // Keep already-loaded portal data during client navigation instead of
  // refetching every operational table whenever a portal layout remounts.
  useEffect(() => { if (!loaded) void loadAll() }, [loaded, loadAll])
  return null
}
