'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertCircle, X } from 'lucide-react'
import { supabase } from '../../lib/supabase/client'

type JobNotification = { id: string; type: string; title: string; message: string; created_at: string }

export default function BackgroundJobNotifications({ userId: initialUserId }: { userId: string | null }) {
  const [toast, setToast] = useState<JobNotification | null>(null)
  const seenIds = useRef(new Set<string>())

  useEffect(() => {
    let mounted = true
    let channel: ReturnType<typeof supabase.channel> | null = null
    let userId: string | null = null
    let toastTimer = 0

    const updateUser = (nextUserId: string | null) => {
      if (!mounted || nextUserId === userId) return
      userId = nextUserId
      seenIds.current.clear()
      setToast(null)
      if (channel) void supabase.removeChannel(channel)
      channel = null
      if (!nextUserId) return

      channel = supabase.channel(`background-job-toast-${nextUserId}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${nextUserId}`,
        }, payload => {
          const item = payload.new as JobNotification
          if (!mounted || item.type !== 'background_job_failed' || seenIds.current.has(item.id)) return
          seenIds.current.add(item.id)
          setToast(item)
          window.dispatchEvent(new CustomEvent('bluepair:background-job-notification'))
          window.clearTimeout(toastTimer)
          toastTimer = window.setTimeout(() => setToast(current => current?.id === item.id ? null : current), 5000)
        })
        .subscribe()
    }

    updateUser(initialUserId)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => updateUser(session?.user.id ?? null))
    return () => {
      mounted = false
      window.clearTimeout(toastTimer)
      listener.subscription.unsubscribe()
      if (channel) void supabase.removeChannel(channel)
    }
  }, [initialUserId])

  if (!toast) return null
  return <div role="status" className="fixed bottom-5 right-4 z-[190] max-w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-navy-950/95 px-4 py-3 text-sm text-white shadow-pop backdrop-blur-xl">
    <div className="flex items-start gap-2"><AlertCircle size={16} className="mt-0.5 shrink-0 text-red-300" /><div className="min-w-0"><p className="font-semibold">{toast.title}</p><p className="mt-0.5 text-xs leading-5 text-white/75">{toast.message}</p></div><button type="button" aria-label="Dismiss notification" onClick={() => setToast(null)} className="ml-1 text-white/60 hover:text-white"><X size={14} /></button></div>
  </div>
}
