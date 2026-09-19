'use client'

import { useCallback, useEffect, useState } from 'react'
import { formatDate } from '@/lib/format'
import StatusBadge from '@/components/ui/StatusBadge'
import { pushToast } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase/client'
import { mapBooking, mapCustomer, mapRoom, mapRoomType } from '@/lib/mappers'
import type { Booking, Customer, Room, RoomType } from '@/data/mock'

export default function Departures() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const [bk, rt, cu, rm] = await Promise.all([
      supabase.from('bookings').select('*').eq('status', 'checked_in').order('check_out'),
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

    const RELEVANT_TABLES = new Set(['bookings', 'rooms', 'customers', 'room_types', 'room_daily_statuses'])
    const refresh = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail?.table || RELEVANT_TABLES.has(detail.table)) {
        void loadData()
      }
    }

    window.addEventListener('bluepair:database-change', refresh)
    return () => window.removeEventListener('bluepair:database-change', refresh)
  }, [loadData])

  const departures = bookings.filter(b => b.status === 'checked_in')
  const custOf = (id: string) => customers.find(c => c.id === id)
  const roomOf = (id: string) => roomTypes.find(r => r.id === id)
  const physicalRoom = (id?: string) => rooms.find(r => r.id === id)

  async function checkOut(id: string) {
    setProcessingId(id)
    try {
      const response = await fetch('/api/admin/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: id }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        pushToast(data.error || 'Could not check out guest.', 'error')
        return
      }
      await loadData()
      pushToast('Guest checked out successfully', 'success')
    } catch (err: any) {
      pushToast(err?.message || 'Could not check out guest.', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Today&apos;s Departures</h1>
      <p className="text-sm text-navy-400 mb-6">Checking out automatically flags the room for housekeeping.</p>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left text-xs text-navy-400 border-b border-black/5">
              <th className="p-4">Guest</th>
              <th className="p-4">Room</th>
              <th className="p-4">Check-out</th>
              <th className="p-4">Status</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {departures.map(b => {
              const isProcessing = processingId === b.id
              return (
                <tr key={b.id} className="border-b border-black/5 last:border-none">
                  <td className="p-4">
                    <b>{custOf(b.customerId)?.name}</b>
                    <div className="text-xs text-navy-400">{b.reference}</div>
                  </td>
                  <td className="p-4 text-navy-500">
                    Room {physicalRoom(b.roomId)?.roomNumber} · {roomOf(b.roomTypeId)?.name}
                  </td>
                  <td className="p-4 text-navy-500">{formatDate(b.checkOut)}</td>
                  <td className="p-4"><StatusBadge status={b.status} /></td>
                  <td className="p-4">
                    <button
                      disabled={isProcessing}
                      onClick={() => void checkOut(b.id)}
                      className="btn-primary btn-sm disabled:opacity-50"
                    >
                      {isProcessing ? 'Checking out…' : 'Check out'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
