'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Bell, CheckCheck, ChevronRight, ConciergeBell, CreditCard, CalendarCheck, MessageSquare, Sparkles, Wine, Wrench } from 'lucide-react'
import { supabase } from '../../lib/supabase/client'

type Notification = {
  id: string
  type: string
  title: string
  body: string
  href: string | null
  metadata: Record<string, unknown>
  read_at: string | null
  created_at: string
}

const iconMap: Record<string, typeof Bell> = {
  booking: CalendarCheck,
  payment: CreditCard,
  event_reservation: CalendarCheck,
  message: MessageSquare,
  request: Wrench,
  stay: Sparkles,
  // Staff notifications
  room_service: ConciergeBell,
  bar_order: Wine,
  housekeeping: Sparkles,
  maintenance: Wrench,
  guest_request: MessageSquare,
}

function timeAgo(value: string) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000))
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

/**
 * scope "guest": the guest's own updates (guest portal).
 * scope "staff": work notifications for the signed-in staff member's department (admin, reception,
 * housekeeping and maintenance portals). The two lists are separate, so someone who is both a guest and a
 * staff member sees guest updates in the guest portal and staff updates in the staff portals.
 */
export default function NotificationBell({ scope = 'guest', viewAllHref = '/account/notifications' }: { scope?: 'guest' | 'staff'; viewAllHref?: string }) {
  const staff = scope === 'staff'
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      const response = await fetch(`/api/notifications?limit=8&scope=${scope}`, { cache: 'no-store' })
      const data = await response.json()
      if (response.ok) {
        setItems(data.notifications ?? [])
        setUnread(data.unreadCount ?? 0)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null
    let mounted = true

    const setupRealtime = async () => {
      const { data } = await supabase.auth.getUser()
      if (!mounted || !data.user) return

      // Give each mounted bell its own topic. This prevents a second mounted
      // instance or a React/Next development remount from reusing a channel
      // that has already been subscribed.
      const topic = `${staff ? 'staff' : 'guest'}-notifications-${data.user.id}-${crypto.randomUUID()}`

      channel = supabase
        .channel(topic)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: staff ? 'staff_notifications' : 'guest_notifications',
            filter: `user_id=eq.${data.user.id}`,
          },
          () => {
            if (mounted) void load()
          },
        )

      try {
        const status = await channel.subscribe((status, error) => {
          if (status === 'SUBSCRIBED') {
            console.debug('[guest-notifications][subscription]', { status, topic })
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('[guest-notifications][subscription]', {
              status,
              topic,
              error: error?.message ?? error ?? null,
            })
          }
        })

        if (status !== 'SUBSCRIBED' && mounted) {
          console.warn('[guest-notifications][subscription-not-ready]', { status, topic })
        }
      } catch (error) {
        if (mounted) {
          console.error('[guest-notifications][subscription-failed]', {
            topic,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      }
    }

    void load()
    void setupRealtime()

    const onFocus = () => void load()
    window.addEventListener('focus', onFocus)
    // Backup for the live channel: the site's realtime bridge announces every change to the notification table.
    const onDbChange = (event: Event) => { if ((event as CustomEvent).detail?.table === (staff ? 'staff_notifications' : 'guest_notifications')) void load() }
    window.addEventListener('bluepair:database-change', onDbChange)

    return () => {
      mounted = false
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('bluepair:database-change', onDbChange)
      if (channel) void supabase.removeChannel(channel)
    }
  }, [scope])

  async function markRead(id: string) {
    setItems(current => current.map(item => item.id === id ? { ...item, read_at: new Date().toISOString() } : item))
    setUnread(current => Math.max(0, current - 1))
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'read', id, scope }) })
  }

  async function markAllRead() {
    setItems(current => current.map(item => ({ ...item, read_at: item.read_at || new Date().toISOString() })))
    setUnread(0)
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'all_read', scope }) })
  }

  const visibleUnread = useMemo(() => items.filter(item => !item.read_at).length, [items])

  return (
    <div className="relative">
      <button onClick={() => setOpen(value => !value)} aria-label={unread ? `${unread} unread notifications` : 'Notifications'} aria-expanded={open} className="relative w-9 h-9 rounded-full flex items-center justify-center text-navy-600 hover:bg-cream-100 transition-colors">
        <Bell size={18} />
        {unread > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-gold-500 text-[9px] font-bold text-navy-950 flex items-center justify-center ring-2 ring-white">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <>
          <button aria-label="Close notifications" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
          <div className="fixed left-3 right-3 top-[60px] md:absolute md:left-auto md:right-0 md:top-full md:mt-2 md:w-[380px] z-50 bg-white rounded-2xl shadow-pop border border-black/5 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-black/5 flex items-center justify-between gap-3">
              <div className="min-w-0"><div className="font-display font-semibold text-navy-950">{staff ? 'Staff notifications' : 'Your notifications'}</div><div className="text-[11px] text-navy-400 mt-0.5">{staff ? 'Work updates for your department' : 'Updates about your stay and requests'}</div></div>
              {visibleUnread > 0 && <button onClick={markAllRead} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-navy-500 hover:text-navy-900 shrink-0"><CheckCheck size={13} /> Mark all read</button>}
            </div>
            <div className="max-h-[430px] overflow-y-auto">
              {loading ? <div className="p-8 text-center text-sm text-navy-400">Loading…</div> : items.length === 0 ? <div className="p-8 text-center"><div className="mx-auto w-11 h-11 rounded-full bg-cream-100 flex items-center justify-center text-navy-400"><Bell size={19} /></div><div className="mt-3 text-sm font-semibold text-navy-800">You’re all caught up</div><div className="mt-1 text-xs text-navy-400">{staff ? 'New work for your department will appear here.' : 'We’ll let you know when something needs your attention.'}</div></div> : items.map(item => {
                const Icon = iconMap[item.type] || Bell
                const content = <div className={`flex gap-3 px-4 py-3.5 hover:bg-cream-100/70 transition-colors ${!item.read_at ? 'bg-blue-50/40' : ''}`}><div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${!item.read_at ? 'bg-navy-950 text-gold-400' : 'bg-cream-100 text-navy-500'}`}><Icon size={16} /></div><div className="min-w-0 flex-1"><div className="flex items-start gap-2"><div className="text-[13px] font-semibold text-navy-900 leading-5 flex-1 break-words">{item.title}</div>{!item.read_at && <span className="mt-1.5 w-2 h-2 rounded-full bg-gold-500 shrink-0" />}</div><div className="text-xs text-navy-500 leading-5 mt-0.5 break-words">{item.body}</div><div className="text-[10px] text-navy-400 mt-1.5">{timeAgo(item.created_at)}</div></div>{item.href && <ChevronRight size={15} className="shrink-0 mt-2 text-navy-300" />}</div>
                return item.href ? <Link key={item.id} href={item.href} onClick={() => { void markRead(item.id); setOpen(false) }}>{content}</Link> : <button key={item.id} className="w-full text-left" onClick={() => void markRead(item.id)}>{content}</button>
              })}
            </div>
            <div className="border-t border-black/5 p-2"><Link href={viewAllHref} onClick={() => setOpen(false)} className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-navy-600 hover:bg-cream-100">See all notifications <ChevronRight size={13} /></Link></div>
          </div>
        </>
      )}
    </div>
  )
}
