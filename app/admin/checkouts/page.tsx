'use client'
import { useState } from 'react'
import { useStore } from '../../../store/useStore'
import { naira, formatDate } from '../../../lib/format'
import StatusBadge from '../../../components/ui/StatusBadge'

export default function CheckOutManagement() {
  const { bookings, roomTypes, customers, rooms, checkOutBooking } = useStore()
  const [note, setNote] = useState<Record<string,string>>({})
  const departures = bookings.filter(b => b.status === 'checked_in')
  const custOf = (id: string) => customers.find(c => c.id === id)
  const roomOf = (id: string) => roomTypes.find(r => r.id === id)
  const physicalRoom = (id?: string) => rooms.find(r => r.id === id)

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Check-out Management</h1>
      <p className="text-navy-400 text-sm mb-6">Today's departures. Checking out automatically flags the room <b className="text-orange-600">Cleaning Required</b> for housekeeping.</p>
      <div className="grid gap-4">
        {departures.map(b => (
          <div key={b.id} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <img src={roomOf(b.roomTypeId)?.images[0]} className="w-16 h-16 rounded-xl object-cover" />
            <div className="flex-1">
              <div className="flex items-center gap-2"><b>{custOf(b.customerId)?.name}</b><StatusBadge status={b.status} /></div>
              <span className="text-xs text-navy-400">Room {physicalRoom(b.roomId)?.roomNumber} · {roomOf(b.roomTypeId)?.name} · {b.reference}</span>
            </div>
            <input value={note[b.id] ?? ''} onChange={e => setNote({...note, [b.id]: e.target.value})} placeholder="Add checkout note…" className="field-input w-52 hidden md:block" />
            <button onClick={() => checkOutBooking(b.id)} className="btn-primary btn-sm">Check out guest</button>
          </div>
        ))}
        {departures.length === 0 && <div className="card p-10 text-center text-navy-400 text-sm">No guests currently checked in.</div>}
      </div>
    </div>
  )
}
