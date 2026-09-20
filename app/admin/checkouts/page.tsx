'use client'

import { useCallback, useEffect, useState } from 'react'
import { naira, formatDate, todayISO } from '../../../lib/format'
import StatusBadge from '../../../components/ui/StatusBadge'
import { pushToast } from '../../../components/ui/Toast'
import { supabase } from '../../../lib/supabase/client'
import { mapBooking, mapCustomer, mapRoom, mapRoomType } from '../../../lib/mappers'
import type { Booking, Customer, Room, RoomType } from '../../../data/mock'

export default function CheckOutManagement() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [note, setNote] = useState<Record<string, string>>({})
  const [checkingOutId, setCheckingOutId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const today = todayISO()
    const [bk, rt, cu, rm] = await Promise.all([
      supabase.from('bookings').select('*').eq('status', 'checked_in').gte('check_out', today).order('check_out'),
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

  const today = todayISO()
  const departures = bookings.filter(b => b.status === 'checked_in' && b.checkOut >= today).sort((a, b) => a.checkOut.localeCompare(b.checkOut))
  const custOf = (id: string) => customers.find(c => c.id === id)
  const roomOf = (id: string) => roomTypes.find(r => r.id === id)
  const physicalRoom = (id?: string) => rooms.find(r => r.id === id)

  async function checkout(id: string) {
    setCheckingOutId(id)
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
      pushToast('Guest checked out. The room is marked Cleaning Required for the actual checkout date.', 'success')
    } catch (err: any) {
      pushToast(err?.message || 'Could not check out guest.', 'error')
    } finally {
      setCheckingOutId(null)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Check-out Management</h1>
      <p className="text-navy-400 text-sm mb-6">
        Guests whose scheduled check-out is today or later. Checking out flags the room for housekeeping on the actual checkout date.
      </p>
      <div className="grid gap-4">
        {departures.map(b => {
          const dueToday = b.checkOut === today
          const isProcessing = checkingOutId === b.id
          return (
            <div key={b.id} className={`card p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${dueToday ? 'border border-gold-200' : ''}`}>
              <img loading="lazy" decoding="async" src={roomOf(b.roomTypeId)?.images[0]} className="w-16 h-16 rounded-xl object-cover" alt="" />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <b>{custOf(b.customerId)?.name}</b>
                  <StatusBadge status={b.status} />
                  {dueToday && <span className="rounded-full bg-gold-50 text-gold-700 px-2.5 py-1 text-[11px] font-semibold">Due today</span>}
                </div>
                <span className="text-xs text-navy-400">
                  Room {physicalRoom(b.roomId)?.roomNumber} · {roomOf(b.roomTypeId)?.name} · {b.reference} · Check-out {formatDate(b.checkOut)}
                </span>
              </div>
              <input
                value={note[b.id] ?? ''}
                onChange={e => setNote({ ...note, [b.id]: e.target.value })}
                placeholder="Add checkout note…"
                className="field-input w-52 hidden md:block"
              />
              <button
                disabled={isProcessing}
                onClick={() => void checkout(b.id)}
                className="btn-primary btn-sm disabled:opacity-50"
              >
                {isProcessing ? 'Checking out…' : 'Check out guest'}
              </button>
            </div>
          )
        })}
        {departures.length === 0 && (
          <div className="card p-10 text-center text-navy-400 text-sm">
            No guests are due to check out today or later.
          </div>
        )}
      </div>
    </div>
  )
}
