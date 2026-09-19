'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, Loader2 } from 'lucide-react'
import { addDaysISO, todayISO } from '../../lib/format'
import type { Room } from '../../data/mock'
import { onAvailabilityChange } from '../../lib/availabilityRealtime'

const COLORS: Record<string, string> = {
  available: 'bg-emerald-500',
  checking: 'bg-slate-300 text-slate-700',
  cleaning_required: 'bg-amber-300 text-navy-950',
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

export default function AvailabilityGrid({
  onSelect,
  onDateChange,
}: {
  rooms: Room[]
  onSelect?: (roomId: string) => void
  onDateChange?: (date: string) => void
}) {
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
    setLoading(true)
    setLive({})

    const checkOut = addDaysISO(1, date)
    const url = `/api/public/availability?checkin=${encodeURIComponent(date)}&checkout=${encodeURIComponent(checkOut)}`

    const loadAvailability = () => {
      const version = ++requestVersion
      const startedAt = Date.now()
      console.info('[admin-availability][fetch-start]', {
        date,
        url,
        startedAt: new Date(startedAt).toISOString(),
      })

      return fetch(url, { cache: 'no-store' })
        .then(async (response) => {
          const data = await response.json().catch(() => null)
          console.info('[admin-availability][response]', {
            ok: response.ok,
            status: response.status,
            date,
            roomCount: data?.rooms?.length ?? 0,
            error: data?.error ?? null,
            elapsedMs: Date.now() - startedAt,
          })
          return response.ok ? data : null
        })
        .then((data) => {
          if (cancelled || version !== requestVersion) return

          const next: Record<string, string> = {}
          for (const room of data?.rooms || []) {
            next[room.id] = room.admin_status || room.guest_status
          }

          console.info('[admin-availability][mapped]', {
            date,
            states: Object.values(next).reduce(
              (acc: Record<string, number>, state: string) => ({
                ...acc,
                [state]: (acc[state] || 0) + 1,
              }),
              {},
            ),
          })

          setLive(next)
        })
        .catch((error) => {
          console.error('[admin-availability][error]', { date, error })
          if (!cancelled) setLive({})
        })
        .finally(() => {
          if (!cancelled && version === requestVersion) setLoading(false)
        })
    }

    console.info('[admin-availability][request]', {
      url,
      date,
      checkOut,
      roomCount: rooms.length,
    })

    void loadAvailability()

    const refresh = (detail: { table: string | null; operation: string | null }) => {
      if (cancelled) return
      console.info('[admin-availability][realtime-refresh]', {
        date,
        table: detail.table ?? null,
        operation: detail.operation ?? null,
        receivedAt: new Date().toISOString(),
      })
      setLoading(true)
      void loadAvailability()
    }

    const stopListening = onAvailabilityChange(refresh)

    return () => {
      cancelled = true
      stopListening()
      console.info('[admin-availability][effect-cleanup]', { date })
    }
  }, [date, rooms.length])

  return (
    <div>
      <div className="rounded-md bg-cream-100 border border-black/[.06] p-4 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays size={15} className="text-gold-600" />
          <div>
            <p className="text-xs font-semibold">Room status for this day</p>
            <p className="text-[10px] text-navy-400">
              Each room card represents the selected date only.
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
              <i
                className={
                  'w-2.5 h-2.5 rounded-sm inline-block ' + COLORS[key]
                }
              />
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
