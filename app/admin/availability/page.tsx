'use client'

import { useCallback, useState } from 'react'
import { useStore } from '../../../store/useStore'
import AvailabilityGrid from '../../../components/admin/AvailabilityGrid'
import AvailabilityCalendar from '../../../components/booking/AvailabilityCalendar'
import Modal from '../../../components/ui/Modal'
import type { RoomStatus } from '../../../data/mock'

const STATUS_OPTIONS: { key: RoomStatus; label: string }[] = [
  { key: 'available', label: 'Available' },
  { key: 'cleaning', label: 'Cleaning' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'available_soon', label: 'Available Soon' },
]

export default function RoomAvailability() {
  const { rooms, roomTypes, loadAll, pushToast } = useStore()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')

  const room = rooms.find((r) => r.id === activeId)
  const rt = room ? roomTypes.find((t) => t.id === room.roomTypeId) : null

  const handleDateChange = useCallback((date: string) => {
    console.info('[admin-status][selected-date]', { date })
    setSelectedDate(date)
  }, [])

  async function updateStatus(status: RoomStatus) {
    console.info('[admin-status][click]', {
      roomId: room?.id ?? null,
      roomNumber: room?.roomNumber ?? null,
      selectedDate,
      status,
      busy,
    })

    if (!room || busy || !selectedDate) {
      console.warn('[admin-status][click-ignored]', {
        reason: !room ? 'no-active-room' : busy ? 'already-busy' : 'no-selected-date',
      })
      return
    }

    setBusy(true)
    const startedAt = Date.now()

    try {
      console.info('[admin-status][request]', {
        roomId: room.id,
        roomNumber: room.roomNumber,
        selectedDate,
        status,
      })

      const response = await fetch('/api/admin/room-daily-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room.id,
          statusDate: selectedDate,
          status,
        }),
      })

      const data = await response.json().catch(() => ({}))

      console.info('[admin-status][response]', {
        ok: response.ok,
        status: response.status,
        data,
        elapsedMs: Date.now() - startedAt,
      })

      if (!response.ok) {
        throw new Error(data.error || 'Could not update room status.')
      }

      // The database is authoritative. The realtime bridge will also cause
      // the availability grid/calendar to refetch without a page refresh.
      await loadAll()

      pushToast(
        `Room ${room.roomNumber} set to ${STATUS_OPTIONS.find((s) => s.key === status)?.label} for ${selectedDate}.`,
        'success',
      )

      setActiveId(null)
    } catch (error: any) {
      console.error('[admin-status][client-error]', {
        roomId: room?.id ?? null,
        selectedDate,
        status,
        message: error?.message,
        error,
      })
      pushToast(error?.message || 'Could not update room status.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Room Availability</h1>
      <p className="text-navy-400 text-sm mb-6">
        Each room card represents the selected day. Paid reservations block their reservation dates; maintenance can remain unavailable indefinitely.
      </p>

      <div className="card p-6">
        <AvailabilityGrid
          onSelect={setActiveId}
          onDateChange={handleDateChange}
        />
      </div>

      <Modal
        open={!!activeId}
        onClose={() => !busy && setActiveId(null)}
        title={room ? `Room ${room.roomNumber}` : ''}
        subtitle={rt?.name}
      >
        {room && (
          <div>
            <AvailabilityCalendar roomId={room.id} />

            <div className="mt-5">
              <label className="field-label mb-2 block">
                Set status for {selectedDate || 'selected day'}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.key}
                    disabled={busy || !selectedDate}
                    onClick={() => void updateStatus(s.key)}
                    className={
                      'px-3.5 py-3 rounded-lg border text-xs font-semibold text-left disabled:opacity-50 ' +
                      (s.key === 'maintenance'
                        ? room.status === 'maintenance'
                        : false
                          ? 'border-navy-950 bg-cream-100'
                          : '')
                    }
                  >
                    {busy ? 'Updating…' : s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
