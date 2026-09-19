'use client'

import { useCallback, useEffect, useState } from 'react'
import { pushToast } from '../../../components/ui/Toast'

import AvailabilityGrid from '../../../components/admin/AvailabilityGrid'
import AvailabilityCalendar from '../../../components/booking/AvailabilityCalendar'
import Modal from '../../../components/ui/Modal'
import type { Room, RoomStatus, RoomType } from '../../../data/mock'
import { supabase } from '../../../lib/supabase/client'
import { mapRoom, mapRoomType } from '../../../lib/mappers'

const STATUS_OPTIONS: { key: RoomStatus | 'cleaning_required'; label: string }[] = [
  { key: 'available', label: 'Available' },
  { key: 'cleaning_required', label: 'Cleaning Required' },
  { key: 'cleaning', label: 'Cleaning' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'available_soon', label: 'Available Soon' },
]

export default function RoomAvailability() {

  const [rooms, setRooms] = useState<Room[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])

  const [activeId, setActiveId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [notice, setNotice] = useState<{ text: string; tone: 'success' | 'error' } | null>(null)

  const loadData = useCallback(async () => {
    const [rm, rt] = await Promise.all([
      supabase.from('rooms').select('*').order('room_number'),
      supabase.from('room_types').select('*').order('price'),
    ])
    if (rm.data) setRooms(rm.data.map(mapRoom))
    if (rt.data) setRoomTypes(rt.data.map(mapRoomType))
  }, [])

  useEffect(() => {
    void loadData()

    const refresh = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.table || detail.table === 'rooms' || detail.table === 'room_types') {
        void loadData()
      }
    }

    window.addEventListener('bluepair:database-change', refresh)
    return () => window.removeEventListener('bluepair:database-change', refresh)
  }, [loadData])

  const room = rooms.find((r) => r.id === activeId)
  const rt = room ? roomTypes.find((t) => t.id === room.roomTypeId) : null

  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date)
  }, [])

  async function updateStatus(status: RoomStatus | 'cleaning_required') {
    if (!room || busy) return

    setBusy(true)
    setNotice(null)

    try {
      const response = await fetch('/api/admin/room-daily-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id, status }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || 'Could not update room status.')
      }


      await loadData()

      pushToast(
        `Room ${room.roomNumber} set to ${STATUS_OPTIONS.find((s) => s.key === status)?.label} for ${selectedDate}.`,
        'success',
      )


      setNotice({
        text: 'Room ' + room.roomNumber + ' set to ' + (STATUS_OPTIONS.find((s) => s.key === status)?.label ?? status) + '.',
        tone: 'success',
      })
      setActiveId(null)
    } catch (error: any) {
      setNotice({ text: error?.message || 'Could not update room status.', tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Room Availability</h1>
      <p className="text-navy-400 text-sm mb-6">
        Paid reservations follow their booking dates. Maintenance and Available Soon are indefinite; cleaning status follows the room until it is completed.
      </p>

      {notice && (
        <div className={'mb-4 rounded-md px-4 py-3 text-sm ' + (notice.tone === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800')}>
          {notice.text}
        </div>
      )}

      <div className="card p-6">
        <AvailabilityGrid onSelect={setActiveId} onDateChange={handleDateChange} />
      </div>

      <Modal
        open={!!activeId}
        onClose={() => !busy && setActiveId(null)}
        title={room ? 'Room ' + room.roomNumber : ''}
        subtitle={rt?.name}
      >
        {room && (
          <div>
            <AvailabilityCalendar roomId={room.id} adminMode />

            <div className="mt-5">
              <label className="field-label mb-2 block">Set current room status</label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.key}
                    disabled={busy}
                    onClick={() => void updateStatus(s.key)}
                    className="px-3.5 py-3 rounded-lg border text-xs font-semibold text-left disabled:opacity-50"
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
