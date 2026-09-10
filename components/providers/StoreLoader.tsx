'use client'
import { useEffect } from 'react'
import { useStore } from '../../store/useStore'

/** Loads live data from the database into the app store once per session. */
export default function StoreLoader() {
  const loadAll = useStore(s => s.loadAll)
  useEffect(() => { void loadAll() }, [loadAll])
  return null
}
