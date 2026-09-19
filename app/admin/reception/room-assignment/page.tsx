'use client'

import { useCallback, useEffect, useState } from 'react'
import { formatDate } from '@/lib/format'
import { pushToast } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase/client'
import { mapBooking, mapCustomer, mapRoom, mapRoomType } from '@/lib/mappers'
import type { Booking, Customer, Room, RoomType } from '@/data/mock'

export default function RoomAssignment() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [assigningId, setAssigningId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const [bk, rt, cu, rm] = await Promise.all([
      supabase.from('bookings').select('*').eq('status', 'confirmed').is('room_id', null).order('check_in'),
      supabase.from('room_types').select('*').order('price'),
      supabase.from('customers').select('*').order('name'),
      supabase.from('rooms').select('*').order('room_number'),
    ])
    if (bk.data) setBookings(bk.data.map(mapBooking))
    if (rt.data) setRoomTypes(rt.data.map(mapRoomType))
    if (cu.data) setCustomers(cu.data.map(mapCustomer))
    if (rm.data) setRooms(rm.data.map(mapRoom))
  }, [])

  useEffect(() => {
    void loadData()

    const RELEVANT_TABLES = new Set(['bookings', 'rooms', 'customers', 'room_types'])
    const refresh = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.table || RELEVANT_TABLES.has(detail.table)) {
        void loadData()
      }
    }

    window.addEventListener('bluepair:database-change', refresh)
    return () => window.removeEventListener('bluepair:database-change', refresh)
  }, [loadData])

  const needsAssignment = bookings.filter(b => b.status === 'confirmed' && !b.roomId)
  const custOf = (id: string) => customers.find(c => c.id === id)
  const roomOf = (id: string) => roomTypes.find(r => r.id === id)

  async function assignRoom(bookingId: string, roomId: string, roomNumber: string) {
    setAssigningId(bookingId)
    try {
      const { error: bError } = await supabase
        .from('bookings')
        .update({ room_id: roomId, status: 'checked_in', checked_in_at: new Date().toISOString() })
        .eq('id', bookingId)
      if (bError) throw bError

      const { error: rError } = await supabase
        .from('rooms')
        .update({ status: 'occupied' })
        .eq('id', roomId)
      if (rError) throw rError

      await loadData()
      pushToast(`Room ${roomNumber} assigned successfully`, 'success')
    } catch (err: any) {
      pushToast(err?.message || 'Failed to assign room', 'error')
    } finally {
      setAssigningId(null)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Room Assignment</h1>
      <p className="text-sm text-navy-400 mb-6">Assign an available physical room to each confirmed booking.</p>
      <div className="grid gap-4">
        {needsAssignment.map(b => {
          const options = rooms.filter(r => r.roomTypeId === b.roomTypeId && r.status === 'available')
          const isProcessing = assigningId === b.id
          return (
            <div key={b.id} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <b>{custOf(b.customerId)?.name}</b>
                <div className="text-xs text-navy-400">
                  {roomOf(b.roomTypeId)?.name} · {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {options.length === 0 && <span className="text-xs text-navy-400">No rooms currently free</span>}
                {options.map(r => (
                  <button
                    key={r.id}
                    disabled={isProcessing}
                    onClick={() => void assignRoom(b.id, r.id, r.roomNumber)}
                    className="btn-outline btn-sm disabled:opacity-50"
                  >
                    {isProcessing ? 'Assigning…' : `Assign ${r.roomNumber}`}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
        {needsAssignment.length === 0 && (
          <div className="card p-10 text-center text-navy-400 text-sm">
            All confirmed bookings have rooms assigned.
          </div>
        )}
      </div>
    </div>
  )
}
