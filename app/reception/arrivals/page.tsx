'use client'

import { useCallback, useEffect, useState } from 'react'
import { naira, formatDate } from '../../../lib/format'
import StatusBadge from '../../../components/ui/StatusBadge'
import { pushToast } from '../../../components/ui/Toast'
import { supabase } from '../../../lib/supabase/client'
import { mapBooking, mapCustomer, mapRoom, mapRoomType } from '../../../lib/mappers'
import type { Booking, Customer, Room, RoomType } from '../../../data/mock'

export default function Arrivals() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const [bk, rt, cu, rm] = await Promise.all([
      supabase.from('bookings').select('*').eq('status', 'confirmed').eq('payment_status', 'paid').order('check_in'),
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

  const arrivals = bookings.filter(b => b.status === 'confirmed' && b.paymentStatus === 'paid')
  const custOf = (id: string) => customers.find(c => c.id === id)
  const roomOf = (id: string) => roomTypes.find(r => r.id === id)
  const freeRoom = (roomTypeId: string) => rooms.find(r => r.roomTypeId === roomTypeId && r.status === 'available')

  async function checkIn(bookingId: string, roomId: string) {
    setProcessingId(bookingId)
    try {
      const { error: bError } = await supabase
        .from('bookings')
        .update({ status: 'checked_in', room_id: roomId, checked_in_at: new Date().toISOString() })
        .eq('id', bookingId)
      if (bError) throw bError

      const { error: rError } = await supabase
        .from('rooms')
        .update({ status: 'occupied' })
        .eq('id', roomId)
      if (rError) throw rError

      await loadData()
      pushToast('Guest checked in successfully', 'success')
    } catch (err: any) {
      pushToast(err?.message || 'Failed to check in guest', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Today&apos;s Arrivals</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left text-xs text-navy-400 border-b border-black/5">
              <th className="p-4">Guest</th>
              <th className="p-4">Room type</th>
              <th className="p-4">Nights</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {arrivals.map(b => {
              const room = freeRoom(b.roomTypeId)
              const isProcessing = processingId === b.id
              return (
                <tr key={b.id} className="border-b border-black/5 last:border-none">
                  <td className="p-4">
                    <b>{custOf(b.customerId)?.name}</b>
                    <div className="text-xs text-navy-400">{b.reference}</div>
                  </td>
                  <td className="p-4 text-navy-500">{roomOf(b.roomTypeId)?.name}</td>
                  <td className="p-4 text-navy-500">
                    {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                  </td>
                  <td className="p-4 font-display">{naira(b.amount)}</td>
                  <td className="p-4"><StatusBadge status={b.status} /></td>
                  <td className="p-4">
                    <button
                      disabled={!room || isProcessing}
                      onClick={() => room && void checkIn(b.id, room.id)}
                      className={'btn-sm ' + (room && !isProcessing ? 'btn-primary' : 'btn-outline opacity-50 cursor-not-allowed')}
                    >
                      {isProcessing ? 'Checking in…' : 'Check in'}
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
