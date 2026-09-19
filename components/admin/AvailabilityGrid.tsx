'use client'

import { useEffect, useState, useCallback } from 'react'
import { CalendarDays, Loader2 } from 'lucide-react'
import { addDaysISO, todayISO } from '../../lib/format'
import { supabase } from '../../lib/supabase/client'

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


interface GridRoom {
  id: string
  roomNumber: string
  status: string
}


export default function AvailabilityGrid({
  onSelect,
  onDateChange,
}: {
  onSelect?: (roomId: string) => void
  onDateChange?: (date: string) => void
}) {
  const [rooms, setRooms] = useState<GridRoom[]>([])
  const [date, setDate] = useState(todayISO())
  const [live, setLive] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const loadRooms = useCallback(async () => {
    const { data } = await supabase
      .from('rooms')
      .select('id, room_number, status')
      .order('room_number')
    if (data) {
      setRooms(data.map(r => ({ id: r.id, roomNumber: r.room_number, status: r.status })))
    }
  }, [])

  useEffect(() => {
    void loadRooms()
  }, [loadRooms])

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

    const loadAvailability = async () => {
      const version = ++requestVersion
      const startedAt = Date.now()
      setLoading(true)

      const checkOut = addDaysISO(1, date)
      const url = `/api/public/availability?checkin=${encodeURIComponent(date)}&checkout=${encodeURIComponent(checkOut)}`

      console.info('[BP-DIAG][admin-grid][fetch-start]', {
        date,
        url,
        version,
        startedAt: new Date(startedAt).toISOString(),
      })

      try {
        const response = await fetch(url, { cache: 'no-store' })
        const data = await response.json().catch(() => null)

        if (cancelled || version !== requestVersion) return
        if (!response.ok) {
          console.error('[BP-DIAG][admin-grid][error]', {
            date,
            version,
            status: response.status,
          })
          return
        }

        const next: Record<string, string> = {}
        for (const room of data?.rooms || []) {
          if (room?.id) {
            next[room.id] = room.admin_status || room.guest_status || 'available'
          }
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

    void loadAvailability()

    const RELEVANT_TABLES = new Set(['rooms', 'bookings', 'room_daily_statuses', 'payment_holds', 'housekeeping_tasks'])

    const refresh = (e: Event) => {
      if (cancelled) return
      const detail = (e as CustomEvent).detail
      if (detail?.table && !RELEVANT_TABLES.has(detail.table)) return

      if (!detail?.table || detail.table === 'rooms') {
        void loadRooms()
      }

      if (refreshTimer !== null) window.clearTimeout(refreshTimer)
      refreshTimer = window.setTimeout(() => {
        void loadAvailability()
      }, 120)
    }

    window.addEventListener('bluepair:database-change', refresh)

    return () => {
      cancelled = true
      window.removeEventListener('bluepair:database-change', refresh)
      if (refreshTimer !== null) window.clearTimeout(refreshTimer)
      console.info('[BP-DIAG][admin-grid][effect-cleanup]', { date })
    }
  }, [date, loadRooms])

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
