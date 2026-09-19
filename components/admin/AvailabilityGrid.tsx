'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, Loader2 } from 'lucide-react'
import { addDaysISO, todayISO } from '../../lib/format'
import { useStore } from '../../store/useStore'

const COLORS: Record<string, string> = {
  available: 'bg-emerald-500',
  cleaning_required: 'bg-amber-300 text-navy-950',
  checking: 'bg-slate-300 text-slate-700',
  cleaning: 'bg-amber-400 text-navy-950',
  maintenance: 'bg-orange-500',
  taken: 'bg-red-600',
  held: 'bg-amber-400 text-navy-950',
  availableSoon: 'bg-gold-500 text-navy-950',
  available_soon: 'bg-gold-500 text-navy-950',
}

const LABELS: Record<string, string> = {
  available: 'Available',
  checking: 'Checking…',
  cleaning_required: 'Cleaning Required',
  cleaning: 'Cleaning',
  maintenance: 'Maintenance',
  taken: 'Taken',
  held: 'Payment Hold',
  availableSoon: 'Available Soon',
  available_soon: 'Available Soon',
}

const REFRESH_TABLES = new Set(['rooms', 'room_daily_statuses', 'bookings', 'payment_holds'])

export default function AvailabilityGrid({
  onSelect,
  onDateChange,
}: {
  onSelect?: (roomId: string) => void
  onDateChange?: (date: string) => void
}) {
  const { rooms } = useStore()
  const [date, setDate] = useState(todayISO())
  const [live, setLive] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    onDateChange?.(date)
  }, [date, onDateChange])

  useEffect(() => {
    if (!date) {
      setLive({})
      return
    }

    let cancelled = false
    let requestVersion = 0
    let refreshTimer: number | null = null

    setLoading(true)
    setLive({})

    const checkOut = addDaysISO(1, date)
    const url = `/api/public/availability?checkin=${encodeURIComponent(date)}&checkout=${encodeURIComponent(checkOut)}`

    const loadAvailability = async () => {
      const version = ++requestVersion
      const startedAt = Date.now()

      console.info('[BP-DIAG][admin-grid][fetch-start]', {
        date,
        url,
        version,
        startedAt: new Date(startedAt).toISOString(),
      })

      try {
        const response = await fetch(url, {
          cache: 'no-store',
        })
        const data = await response.json().catch(() => null)

        if (cancelled || version !== requestVersion) return

        console.info('[BP-DIAG][admin-grid][response]', {
          ok: response.ok,
          status: response.status,
          date,
          version,
          roomCount: data?.rooms?.length ?? 0,
          error: data?.error ?? null,
          elapsedMs: Date.now() - startedAt,
        })

        if (!response.ok) return

        const next: Record<string, string> = {}
        for (const room of data?.rooms || []) {
          next[room.id] = room.admin_status || room.guest_status
        }

        console.info('[BP-DIAG][admin-grid][mapped]', {
          date,
          version,
          states: Object.values(next).reduce(
            (acc: Record<string, number>, state: string) => ({
              ...acc,
              [state]: (acc[state] || 0) + 1,
            }),
            {},
          ),
        })

        setLive(next)
      } catch (error: any) {
        if (cancelled || version !== requestVersion) return
        console.error('[BP-DIAG][admin-grid][error]', { date, version, error })
      } finally {
        if (!cancelled && version === requestVersion) setLoading(false)
      }
    }

    console.info('[BP-DIAG][admin-grid][request]', {
      url,
      date,
      checkOut,
      roomCount: rooms.length,
    })

    void loadAvailability()

    const refresh = (event: Event) => {
      if (cancelled) return
      const detail = (event as CustomEvent).detail || {}
      const table = typeof detail.table === 'string' ? detail.table : null
      if (!table || !REFRESH_TABLES.has(table)) return

      console.info('[BP-DIAG][admin-grid][realtime-refresh]', {
        date,
        table,
        operation: detail.operation ?? null,
        roomId: detail.roomId ?? null,
        status: detail.status ?? null,
        receivedAt: new Date().toISOString(),
      })

      // Preserve the immediate local state while the authoritative request catches up.
      if (typeof detail.roomId === 'string' && typeof detail.status === 'string') {
        setLive((current) => ({ ...current, [detail.roomId]: detail.status }))
      }

      if (refreshTimer !== null) window.clearTimeout(refreshTimer)
      refreshTimer = window.setTimeout(() => {
        refreshTimer = null
        setLoading(true)
        void loadAvailability()
      }, 180)
    }

    window.addEventListener('bluepair:database-change', refresh)

    return () => {
      cancelled = true
      window.removeEventListener('bluepair:database-change', refresh)
      if (refreshTimer !== null) window.clearTimeout(refreshTimer)
      console.info('[BP-DIAG][admin-grid][effect-cleanup]', { date })
    }
  }, [date, rooms.length])

  return (
    <div>
      <div className="rounded-md bg-cream-100 border border-black/[.06] p-4 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays size={15} className="text-gold-600" />
          <div>
            <p className="text-xs font-semibold">Room status and availability</p>
            <p className="text-[10px] text-navy-400">
              Booking status follows the selected date; operational room status persists until changed.
            </p>
          </div>
          {loading && (
            <Loader2 size={13} className="ml-auto animate-spin text-navy-400" />
          )}
        </div>

        <div>
          <label className="field-label">Date</label>
          <input
            type="date"
            min={todayISO()}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="field-input"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-5 text-xs text-navy-500">
        {['available', 'taken', 'cleaning_required', 'cleaning', 'maintenance', 'available_soon'].map(
          (key) => (
            <span key={key} className="flex items-center gap-1.5">
              <i className={'w-2.5 h-2.5 rounded-sm inline-block ' + COLORS[key]} />
              {LABELS[key]}
            </span>
          ),
        )}
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
        {rooms.map((room) => {
          const state = live[room.id] || (loading ? 'checking' : room.status)

          return (
            <button
              key={room.id}
              onClick={() => onSelect?.(room.id)}
              title={`Room ${room.roomNumber} · ${LABELS[state] || state}`}
              className={
                'aspect-square rounded-md flex flex-col items-center justify-center text-white font-bold text-xs gap-0.5 hover:brightness-110 transition ' +
                (COLORS[state] || COLORS.available)
              }
            >
              <span>{room.roomNumber}</span>
              <span className="text-[8px] font-medium opacity-80">
                {LABELS[state] || state}
              </span>
            </button>
          )
        })}
      </div>

      <p className="text-[10px] text-navy-400 mt-4">
        Selected date: <b>{date}</b>. Click a room for operational controls.
      </p>
    </div>
  )
}
