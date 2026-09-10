'use client'
import { createBrowserClient } from '@supabase/ssr'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config'

let client: ReturnType<typeof createBrowserClient> | null = null

export function getSupabase() {
  if (!client) client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  return client
}

export const supabase = getSupabase()
