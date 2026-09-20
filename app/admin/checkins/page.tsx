'use client'

import { useCallback, useEffect, useState } from 'react'
import { naira, formatDate } from '../../../lib/format'
import StatusBadge from '../../../components/ui/StatusBadge'
import { pushToast } from '../../../components/ui/Toast'
import { supabase } from '../../../lib/supabase/client'
import { mapBooking, mapCustomer, mapRoom, mapRoomType } from '../../../lib/mappers'
import type { Booking, Customer, Room, RoomType } from '../../../data/mock'

export default function CheckInManagement() {
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
      <h1 className="text-2xl font-semibold mb-1">Check-in Management</h1>
      <p className="text-navy-400 text-sm mb-6">Today&apos;s arrivals — paid reservations only.</p>
      <div className="grid gap-4">
        {arrivals.map(b => {
          const room = freeRoom(b.roomTypeId)
          const isProcessing = processingId === b.id
          return (
            <div key={b.id} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <img loading="lazy" decoding="async" src={roomOf(b.roomTypeId)?.images[0]} className="w-16 h-16 rounded-xl object-cover" alt="" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <b>{custOf(b.customerId)?.name}</b>
                  <StatusBadge status={b.status} />
                </div>
                <span className="text-xs text-navy-400">
                  {roomOf(b.roomTypeId)?.name} · {formatDate(b.checkIn)} → {formatDate(b.checkOut)} · {b.reference}
                </span>
              </div>
              <div className="text-right">
                <b className="font-display block">{naira(b.amount)}</b>
                <span className="text-xs text-navy-400">
                  {room ? `Room ${room.roomNumber} available` : 'No room free — assign manually'}
                </span>
              </div>
              <button
                disabled={!room || isProcessing}
                onClick={() => room && void checkIn(b.id, room.id)}
                className={'btn-sm ' + (room && !isProcessing ? 'btn-primary' : 'btn-outline opacity-50 cursor-not-allowed')}
              >
                {isProcessing ? 'Checking in…' : 'Confirm guest & check in'}
              </button>
            </div>
          )
        })}
        {arrivals.length === 0 && (
          <div className="card p-10 text-center text-navy-400 text-sm">
            No paid arrivals pending check-in.
          </div>
        )}
      </div>
    </div>
  )
}
