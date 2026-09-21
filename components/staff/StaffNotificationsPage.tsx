'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, CalendarCheck, CheckCheck, ConciergeBell, CreditCard, MessageSquare, Sparkles, Wine, Wrench } from 'lucide-react'

type Notification = { id: string; type: string; title: string; body: string; href: string | null; department: string; read_at: string | null; created_at: string }

const icons: Record<string, any> = { booking: CalendarCheck, payment: CreditCard, event_reservation: CalendarCheck, message: MessageSquare, guest_request: MessageSquare, room_service: ConciergeBell, bar_order: Wine, housekeeping: Sparkles, maintenance: Wrench }
const DEPARTMENT_LABELS: Record<string, string> = { reception: 'Reception', housekeeping: 'Housekeeping', maintenance: 'Maintenance', restaurant: 'Restaurant', bar: 'Bar', management: 'Management' }

function when(value: string) {
  return new Date(value).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

/** The staff notification list: work updates for the signed-in person's department (same routing as the department emails). */
export default function StaffNotificationsPage() {
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadOnly, setUnreadOnly] = useState(false)

  async function load() {
    try {
      const response = await fetch('/api/notifications?limit=100&scope=staff', { cache: 'no-store' })
      const data = await response.json()
      if (response.ok) setItems(data.notifications ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    const refresh = (event: Event) => { if ((event as CustomEvent).detail?.table === 'staff_notifications') void load() }
    window.addEventListener('bluepair:database-change', refresh)
    window.addEventListener('focus', () => void load())
    return () => window.removeEventListener('bluepair:database-change', refresh)
  }, [])

  async function markAll() {
    setItems(current => current.map(item => ({ ...item, read_at: item.read_at || new Date().toISOString() })))
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'all_read', scope: 'staff' }) })
  }

  async function markOne(id: string) {
    setItems(current => current.map(item => item.id === id ? { ...item, read_at: new Date().toISOString() } : item))
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'read', id, scope: 'staff' }) })
  }

  const unread = items.filter(item => !item.read_at).length
  const visible = unreadOnly ? items.filter(item => !item.read_at) : items

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-950 md:text-3xl">Notifications</h1>
          <p className="mt-1 text-sm text-navy-500">Work updates for your department. You only see what is meant for your team.</p>
        </div>
        {unread > 0 && <button onClick={markAll} className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy-950 px-4 py-2.5 text-xs font-semibold text-white hover:bg-navy-900"><CheckCheck size={14} /> Mark all as read</button>}
      </div>

      <div className="mb-4 flex gap-2" role="group" aria-label="Filter notifications">
        {[{ label: 'All', value: false }, { label: `Unread${unread ? ` (${unread})` : ''}`, value: true }].map(option => (
          <button key={option.label} type="button" aria-pressed={unreadOnly === option.value} onClick={() => setUnreadOnly(option.value)}
            className={'rounded-full px-4 py-1.5 text-xs font-semibold transition ' + (unreadOnly === option.value ? 'bg-navy-950 text-white' : 'border border-black/10 bg-white text-navy-600 hover:border-gold-500')}>
            {option.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        {loading ? <div className="p-12 text-center text-sm text-navy-400">Loading notifications…</div> : visible.length === 0 ? (
          <div className="p-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cream-100 text-navy-400"><Bell size={22} /></div>
            <h2 className="mt-4 text-base font-semibold text-navy-900">{unreadOnly ? 'Nothing unread' : 'Nothing new yet'}</h2>
            <p className="mt-1 text-sm text-navy-400">New work for your department will appear here as it happens.</p>
          </div>
        ) : (
          <div className="divide-y divide-black/5">
            {visible.map(item => {
              const Icon = icons[item.type] || Bell
              const row = (
                <div className={'flex gap-4 p-4 sm:p-5 ' + (!item.read_at ? 'bg-gold-500/[0.07]' : '')}>
                  <div className={'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ' + (!item.read_at ? 'bg-navy-950 text-gold-400' : 'bg-cream-100 text-navy-400')}><Icon size={17} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className={'text-sm text-navy-950 ' + (!item.read_at ? 'font-bold' : 'font-semibold')}>{item.title}</span>
                      <span className="rounded-full bg-cream-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-navy-500">{DEPARTMENT_LABELS[item.department] || item.department}</span>
                    </div>
                    {item.body && <p className="mt-1 text-sm leading-6 text-navy-500">{item.body}</p>}
                    <p className="mt-1.5 text-[11px] text-navy-400">{when(item.created_at)}</p>
                  </div>
                </div>
              )
              return item.href
                ? <Link key={item.id} href={item.href} onClick={() => void markOne(item.id)} className="block transition-colors hover:bg-cream-100/60">{row}</Link>
                : <button key={item.id} type="button" onClick={() => void markOne(item.id)} className="block w-full text-left transition-colors hover:bg-cream-100/60">{row}</button>
            })}
          </div>
        )}
      </div>
    </div>
  )
}
