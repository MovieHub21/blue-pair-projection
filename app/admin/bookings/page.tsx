'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { pushToast } from '../../../components/ui/Toast'
import { naira, formatDate, nightsBetween, todayISO, addDaysISO } from '../../../lib/format'
import StatusBadge from '../../../components/ui/StatusBadge'
import Modal from '../../../components/ui/Modal'
import { Search, UserRoundPlus, CreditCard, Banknote, Loader2, Plus, Check, ChevronDown } from 'lucide-react'
import { sendGuestTransactionalEmail } from '../../../components/GuestEmailWatcher'
import { useAuth } from '../../../lib/useAuth'
import { supabase } from '../../../lib/supabase/client'
import { mapBooking, mapCustomer, mapRoom, mapRoomType } from '../../../lib/mappers'
import type { Booking, Customer, Room, RoomType } from '../../../data/mock'

type PaymentMethod = 'Transfer' | 'Cash' | 'POS'
type ExtraService = { id: string; name: string; price: number }
type LiveAvailabilityRoom = { id: string; room_type_id: string; room_number: string; name?: string | null; floor?: string | null; guest_status: string }

const EXTRA_SERVICES: ExtraService[] = [
  { id: 'laundry', name: 'Laundry Service', price: 5000 },
  { id: 'feeding', name: 'Full stay Feeding', price: 17000 },
  { id: 'gym', name: 'Gym House', price: 1500 },
  { id: 'game', name: 'Game House', price: 5000 },
]

const emptyWalkIn = { name: '', email: '', phone: '', roomTypeId: '', roomId: '', checkIn: todayISO(), checkOut: addDaysISO(1), adults: 1, children: 0, specialRequests: '', extraServices: [] as ExtraService[] }

export default function BookingManagement() {
  const auth = useAuth()
  const searchParams = useSearchParams()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [rooms, setRooms] = useState<Room[]>([])

  const [active, setActive] = useState<Booking | null>(null)
  const [q, setQ] = useState('')
  const [paymentFilter, setPaymentFilter] = useState<'paid' | 'pending' | 'refunded' | 'all'>('paid')
  const [showWalkIn, setShowWalkIn] = useState(false)
  const [walkIn, setWalkIn] = useState({ ...emptyWalkIn, roomTypeId: '' })
  const [expandedWalkInType, setExpandedWalkInType] = useState<string | null>(null)
  const [walkInAvailability, setWalkInAvailability] = useState<LiveAvailabilityRoom[]>([])
  const [loadingWalkInAvailability, setLoadingWalkInAvailability] = useState(false)
  const [creating, setCreating] = useState(false)
  const [confirmingPayment, setConfirmingPayment] = useState<Booking | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [savingPayment, setSavingPayment] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const [bk, rt, cu, rm] = await Promise.all([
      supabase.from('bookings').select('*').order('created_at', { ascending: false }),
      supabase.from('room_types').select('*').order('price'),
      supabase.from('customers').select('*').order('name'),
      supabase.from('rooms').select('*').order('room_number'),
    ])
    if (bk.data) setBookings(bk.data.map(mapBooking))
    if (rt.data) {
      const types = rt.data.map(mapRoomType)
      setRoomTypes(types)
      setWalkIn(current => current.roomTypeId ? current : { ...current, roomTypeId: types[0]?.id ?? '' })
    }
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

  useEffect(() => {
    const result = searchParams.get('payment')
    if (!result) return
    const messages: Record<string, string> = { success: 'Paystack payment verified and booking marked as paid.', failed: 'Paystack payment was not completed.', 'not-configured': 'Paystack is not configured on the server.', 'amount-mismatch': 'Paystack payment amount did not match the booking.', unmatched: 'Paystack payment could not be matched to a booking.', missing: 'Paystack returned without a payment reference.', error: 'There was a problem verifying the Paystack payment.' }
    pushToast(messages[result] || 'Payment status updated.', result === 'success' ? 'success' : 'error')
    void loadData()
  }, [searchParams, loadData])

  useEffect(() => {
    if (!showWalkIn || !walkIn.checkIn || !walkIn.checkOut || walkIn.checkIn >= walkIn.checkOut) { setWalkInAvailability([]); return }
    let cancelled = false
    setLoadingWalkInAvailability(true)
    fetch(`/api/public/availability?checkin=${encodeURIComponent(walkIn.checkIn)}&checkout=${encodeURIComponent(walkIn.checkOut)}${walkIn.roomTypeId ? `&roomTypeId=${encodeURIComponent(walkIn.roomTypeId)}` : ''}&_=${Date.now()}`, { cache: 'no-store' })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (cancelled) return
        const liveRooms = Array.isArray(data?.rooms) ? data.rooms.filter((room: LiveAvailabilityRoom) => room.guest_status === 'available') : []
        setWalkInAvailability(liveRooms)
        setWalkIn(current => current.roomId && !liveRooms.some(room => room.id === current.roomId) ? { ...current, roomId: '' } : current)
      })
      .catch(() => { if (!cancelled) setWalkInAvailability([]) })
      .finally(() => { if (!cancelled) setLoadingWalkInAvailability(false) })
    return () => { cancelled = true }
  }, [showWalkIn, walkIn.checkIn, walkIn.checkOut, walkIn.roomTypeId])

  const custOf = (id: string) => customers.find(c => c.id === id)
  const roomOf = (id: string) => roomTypes.find(r => r.id === id)
  const physicalRoomOf = (id?: string) => id ? rooms.find(r => r.id === id) : undefined
  const filtered = bookings.filter(b => {
    if (paymentFilter !== 'all' && b.paymentStatus !== paymentFilter) return false
    const customer = custOf(b.customerId)
    const query = q.toLowerCase()
    return !query || [customer?.name, customer?.email, customer?.phone, b.reference].some(v => String(v ?? '').toLowerCase().includes(query))
  })
  const freeRoom = (roomTypeId: string) => rooms.find(r => r.roomTypeId === roomTypeId && r.status === 'available')
  const walkInRoom = roomTypes.find(r => r.id === walkIn.roomTypeId)
  const walkInNights = walkInRoom ? nightsBetween(walkIn.checkIn, walkIn.checkOut) : 0
  const walkInSubtotal = (walkInRoom?.price ?? 0) * walkInNights
  const walkInExtrasTotal = walkIn.extraServices.reduce((sum, item) => sum + Number(item.price), 0)
  const walkInTax = Math.round((walkInSubtotal + walkInExtrasTotal) * 0.075)
  const walkInTotal = walkInSubtotal + walkInExtrasTotal + walkInTax
  const walkInAvailableRooms = (roomTypeId: string) => { const liveIds = new Set(walkInAvailability.filter(room => room.room_type_id === roomTypeId).map(room => room.id)); return rooms.filter(room => room.roomTypeId === roomTypeId && liveIds.has(room.id)) }

  function selectWalkInType(roomTypeId: string) { setWalkIn(current => ({ ...current, roomTypeId, roomId: current.roomTypeId === roomTypeId ? current.roomId : '' })); setExpandedWalkInType(current => current === roomTypeId ? null : roomTypeId); setError(null) }
  function selectWalkInRoom(roomTypeId: string, roomId: string) { setWalkIn(current => ({ ...current, roomTypeId, roomId })); setExpandedWalkInType(roomTypeId); setError(null) }
  function toggleWalkInExtra(service: ExtraService) { setWalkIn(current => ({ ...current, extraServices: current.extraServices.some(x => x.id === service.id) ? current.extraServices.filter(x => x.id !== service.id) : [...current.extraServices, service] })) }
  function openWalkIn() { setError(null); const firstType = roomTypes.find(r => r.active)?.id ?? ''; setWalkIn({ ...emptyWalkIn, roomTypeId: firstType, roomId: '' }); setExpandedWalkInType(firstType || null); setWalkInAvailability([]); setShowWalkIn(true) }
  function openBooking(booking: Booking) { setActive(booking); setError(null) }

  async function createWalkIn() {
    setError(null)
    if (!walkIn.name || !walkIn.email || !walkIn.phone || !walkIn.roomTypeId || !walkIn.roomId) { setError('Name, email, phone and an available room are required.'); return }
    if (!walkInAvailableRooms(walkIn.roomTypeId).some(room => room.id === walkIn.roomId)) { setError('That room is no longer available for the selected dates. Please choose another room.'); return }
    setCreating(true)
    try {
      const response = await fetch('/api/admin/walk-in-booking', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(walkIn) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to create walk-in booking.')
      await loadData()
      setShowWalkIn(false)
      setWalkIn({ ...emptyWalkIn, roomTypeId: roomTypes[0]?.id ?? '' })
      setExpandedWalkInType(roomTypes[0]?.id ?? null)
      setWalkInAvailability([])
      setError(null)
      const emailSent = await sendGuestTransactionalEmail('booking_confirmation', { bookingId: data.booking.id })
      pushToast(emailSent ? 'Walk-in booking created and confirmation email sent.' : 'Walk-in booking created. Confirmation email could not be sent.', emailSent ? 'success' : 'error')
      if (data.booking) {
        setConfirmingPayment(mapBooking(data.booking))
      }
    } catch (e: any) { setError(e?.message || 'Unable to create walk-in booking.') } finally { setCreating(false) }
  }

  async function confirmPayment() {
    if (!confirmingPayment || !paymentMethod) return
    setSavingPayment(true); setError(null)
    try {
      const response = await fetch('/api/admin/confirm-payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId: confirmingPayment.id, method: paymentMethod === 'Transfer' ? 'Paystack' : paymentMethod }) })
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to confirm payment.')
      await loadData()
      await sendGuestTransactionalEmail('payment_successful', { bookingId: confirmingPayment.id, paymentReference: data.paymentReference })
      setConfirmingPayment(null)
      setPaymentMethod(null)
    } catch (e: any) { setError(e?.message || 'Unable to confirm payment.') } finally { setSavingPayment(false) }
  }

  async function checkIn(id: string) {
    const booking = bookings.find(b => b.id === id)
    if (!booking) return
    const room = booking.roomId ? rooms.find(r => r.id === booking.roomId) : freeRoom(booking.roomTypeId)
    if (!room || room.status !== 'available') return
    await supabase.from('bookings').update({ status: 'checked_in', room_id: room.id, checked_in_at: new Date().toISOString() }).eq('id', id)
    await supabase.from('rooms').update({ status: 'occupied' }).eq('id', room.id)
    await loadData()
    pushToast(`Guest checked in to Room ${room.roomNumber}.`, 'success')
  }

  async function checkOut(id: string) {
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
  }

  async function cancelBooking(id: string) {
    const booking = bookings.find(b => b.id === id)
    if (!booking) return
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id)
    if (booking.roomId) {
      await supabase.from('rooms').update({ status: 'available' }).eq('id', booking.roomId)
    }
    await loadData()
    pushToast('Booking cancelled.', 'info')
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Booking Management</h1>
          <p className="text-sm text-navy-400 mt-1">Online reservations and front-desk walk-ins in one place.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-black/10 rounded-full px-4 py-2 w-64">
            <Search size={14} className="text-navy-400" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search guest, email or booking…" className="text-sm outline-none flex-1" />
          </div>
          <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value as typeof paymentFilter)} aria-label="Filter bookings by payment status" className="h-10 rounded-full border border-black/10 bg-white px-4 text-sm outline-none">
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
            <option value="all">All payments</option>
          </select>
          <button onClick={openWalkIn} className="btn-gold flex items-center gap-2"><UserRoundPlus size={16} /> Walk-in booking</button>
        </div>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[1050px]">
          <thead>
            <tr className="text-left text-xs text-navy-400 border-b border-black/5">
              <th className="p-4">Booking ID</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Source</th>
              <th className="p-4">Room</th>
              <th className="p-4">Check-in</th>
              <th className="p-4">Check-out</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Payment</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(b => (
              <tr key={b.id} className="border-b border-black/5 last:border-none">
                <td className="p-4 font-medium">{b.reference}</td>
                <td className="p-4">{custOf(b.customerId)?.name}</td>
                <td className="p-4">{(b as any).source === 'walk_in' ? <span className="rounded-full bg-amber-50 text-amber-700 px-2.5 py-1 text-[11px] font-semibold">Walk-in</span> : <span className="text-xs text-navy-400">Online</span>}</td>
                <td className="p-4 text-navy-500">{physicalRoomOf(b.roomId)?.roomNumber ? `Room ${physicalRoomOf(b.roomId)?.roomNumber}` : roomOf(b.roomTypeId)?.name}</td>
                <td className="p-4 text-navy-500">{formatDate(b.checkIn)}</td>
                <td className="p-4 text-navy-500">{formatDate(b.checkOut)}</td>
                <td className="p-4 font-display">{naira(b.amount)}</td>
                <td className="p-4"><StatusBadge status={b.paymentStatus} /></td>
                <td className="p-4"><StatusBadge status={b.status} /></td>
                <td className="p-4">
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => openBooking(b)} className="text-xs font-semibold text-navy-900">View</button>
                    {b.paymentStatus !== 'paid' && b.status !== 'cancelled' && <button onClick={() => { setConfirmingPayment(b); setPaymentMethod(null); setError(null) }} className="text-xs font-semibold text-gold-700">Payment</button>}
                    {b.status === 'confirmed' && <button onClick={() => void checkIn(b.id)} className="text-xs font-semibold text-emerald-700">Check-in</button>}
                    {b.status === 'checked_in' && <button onClick={() => void checkOut(b.id)} className="text-xs font-semibold text-blue-700">Check-out</button>}
                    {['pending','confirmed'].includes(b.status) && <button onClick={() => void cancelBooking(b.id)} className="text-xs font-semibold text-red-600">Cancel</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="py-14 text-center text-sm text-navy-400">No bookings match your search or payment filter.</div>}
      </div>

      <Modal open={!!active} onClose={() => setActive(null)} title="Booking details" subtitle={active?.reference}>
        {active && (
          <div className="space-y-5">
            <div className="flex flex-col gap-0.5">
              {[
                ['Customer', custOf(active.customerId)?.name],
                ['Email', custOf(active.customerId)?.email],
                ['Phone', custOf(active.customerId)?.phone],
                ['Source', (active as any).source === 'walk_in' ? 'Walk-in / Front desk' : 'Online'],
                ['Room', physicalRoomOf(active.roomId)?.roomNumber ? `Room ${physicalRoomOf(active.roomId)?.roomNumber} · ${roomOf(active.roomTypeId)?.name}` : roomOf(active.roomTypeId)?.name],
                ['Dates', `${formatDate(active.checkIn)} → ${formatDate(active.checkOut)}`],
                ['Guests', `${active.adults} adults, ${active.children} children`],
                ['Payment', active.paymentStatus],
                ['Special requests', active.specialRequests || 'None'],
                ['Checked in at', (active as any).checkedInAt ? new Date((active as any).checkedInAt).toLocaleString('en-NG') : 'Not checked in'],
                ['Checked out at', (active as any).checkedOutAt ? new Date((active as any).checkedOutAt).toLocaleString('en-NG') : 'Not checked out']
              ].map(([l,v]) => (
                <div key={l} className="flex justify-between gap-5 text-sm py-2 border-b border-dashed border-black/10 last:border-none">
                  <span className="text-navy-400">{l}</span>
                  <span className="font-medium text-right">{v}</span>
                </div>
              ))}
            </div>
            {!!active.extraServices?.length && (
              <div className="rounded-2xl border border-black/10 p-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="text-sm font-semibold">Extra services</h3>
                    <p className="text-xs text-navy-400 mt-1">Services selected when this booking was created.</p>
                  </div>
                  <span className="text-xs font-semibold">{naira(active.extraServices.reduce((sum, x) => sum + x.price, 0))}</span>
                </div>
                <div className="space-y-2">
                  {active.extraServices.map(service => (
                    <div key={service.id} className="flex items-center justify-between rounded-xl bg-navy-50 px-3 py-2 text-sm">
                      <span>{service.name}</span>
                      <span className="font-semibold">{naira(service.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="rounded-xl bg-navy-50 p-3 text-xs text-navy-500">
              Extra services are selected during booking creation. The booking details view does not edit the booking total after creation.
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showWalkIn} onClose={() => !creating && setShowWalkIn(false)} title="Create walk-in booking" subtitle="Reception can book for a guest without creating a guest account.">
        <div className="space-y-5">
          <div className="rounded-xl bg-navy-50 p-3 text-xs text-navy-500">
            The guest&apos;s email is required so Blue Pair can send the booking confirmation and continue sending payment, arrival, service and post-stay updates even when the guest has no account.
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Guest full name</label>
              <input value={walkIn.name} onChange={e => setWalkIn({ ...walkIn, name: e.target.value })} className="field-input" placeholder="Guest name" />
            </div>
            <div>
              <label className="field-label">Email</label>
              <input type="email" value={walkIn.email} onChange={e => setWalkIn({ ...walkIn, email: e.target.value })} className="field-input" placeholder="guest@email.com" />
            </div>
            <div>
              <label className="field-label">Phone</label>
              <input value={walkIn.phone} onChange={e => setWalkIn({ ...walkIn, phone: e.target.value })} className="field-input" placeholder="+234 800 000 0000" />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">Room</label>
              <div className="space-y-2">
                {roomTypes.filter(r => r.active).map(type => {
                  const availableRooms = walkInAvailableRooms(type.id)
                  const expanded = expandedWalkInType === type.id
                  const selected = walkIn.roomTypeId === type.id
                  return (
                    <div key={type.id} className={`rounded-2xl border overflow-hidden transition ${selected ? 'border-gold-500' : 'border-black/10'}`}>
                      <button type="button" onClick={() => selectWalkInType(type.id)} className="w-full p-4 flex items-center gap-3 text-left bg-white hover:bg-navy-50/50">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-semibold text-sm">{type.name}</span>
                            <span className="font-display font-semibold text-sm whitespace-nowrap">{naira(type.price)}/night</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-navy-400">
                            <span>{loadingWalkInAvailability ? 'Checking availability…' : `${availableRooms.length} available room${availableRooms.length === 1 ? '' : 's'}`}</span>
                            {selected && walkIn.roomId && <span>· Room {rooms.find(r => r.id === walkIn.roomId)?.roomNumber}</span>}
                          </div>
                        </div>
                        <ChevronDown size={17} className={`shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                      </button>
                      {expanded && (
                        <div className="border-t border-black/5 bg-navy-50/40 p-3 space-y-2">
                          {loadingWalkInAvailability ? (
                            <div className="rounded-xl bg-white border border-black/5 p-4 text-center text-xs text-navy-400">
                              Checking rooms for {formatDate(walkIn.checkIn)} → {formatDate(walkIn.checkOut)}…
                            </div>
                          ) : availableRooms.length === 0 ? (
                            <div className="rounded-xl bg-white border border-black/5 p-4 text-center text-xs text-navy-400">
                              No rooms available for these dates.
                            </div>
                          ) : (
                            availableRooms.map(room => {
                              const roomSelected = walkIn.roomId === room.id
                              return (
                                <button key={room.id} type="button" onClick={() => selectWalkInRoom(type.id, room.id)} className={`w-full rounded-xl border p-3 flex items-center gap-3 text-left transition ${roomSelected ? 'border-navy-950 bg-navy-950 text-white' : 'border-black/10 bg-white hover:border-black/20'}`}>
                                  <span className="flex-1 min-w-0">
                                    <b className="block text-sm">Room {room.roomNumber}</b>
                                    <span className={`text-[11px] ${roomSelected ? 'text-white/60' : 'text-navy-400'}`}>Floor {room.floor} · {naira(type.price)}/night</span>
                                  </span>
                                  <span className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${roomSelected ? 'border-white bg-white text-navy-950' : 'border-black/15'}`}>
                                    {roomSelected && <Check size={12}/>}
                                  </span>
                                </button>
                              )
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              {!walkIn.roomId && <p className="text-[11px] text-navy-400 mt-2">Select a room type to see its available physical rooms for the selected dates, then choose the exact room for the guest.</p>}
            </div>
            <div>
              <label className="field-label">Check-in</label>
              <input type="date" min={todayISO()} value={walkIn.checkIn} onChange={e => setWalkIn({ ...walkIn, checkIn: e.target.value, roomId: '' })} className="field-input" />
            </div>
            <div>
              <label className="field-label">Check-out</label>
              <input type="date" min={addDaysISO(1, walkIn.checkIn)} value={walkIn.checkOut} onChange={e => setWalkIn({ ...walkIn, checkOut: e.target.value, roomId: '' })} className="field-input" />
            </div>
            <div>
              <label className="field-label">Adults</label>
              <select value={walkIn.adults} onChange={e => setWalkIn({ ...walkIn, adults: Number(e.target.value) })} className="field-input">
                {Array.from({ length: walkInRoom?.guests ?? 1 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Children</label>
              <select value={walkIn.children} onChange={e => setWalkIn({ ...walkIn, children: Number(e.target.value) })} className="field-input">
                {[0,1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <label className="field-label mb-0">Extra services</label>
                <p className="text-[11px] text-navy-400 mt-1">Choose any services the guest wants before creating the booking.</p>
              </div>
              <span className="text-xs font-semibold">{naira(walkInExtrasTotal)}</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {EXTRA_SERVICES.map(service => {
                const selected = walkIn.extraServices.some(x => x.id === service.id)
                return (
                  <button key={service.id} type="button" onClick={() => toggleWalkInExtra(service)} className={`rounded-xl border p-3 flex items-center gap-3 text-left transition ${selected ? 'border-navy-950 bg-navy-950 text-white' : 'border-black/10 bg-white hover:border-black/20'}`}>
                    <span className="flex-1">
                      <b className="block text-xs">{service.name}</b>
                      <span className={`text-[10px] ${selected ? 'text-white/60' : 'text-navy-400'}`}>{naira(service.price)}</span>
                    </span>
                    {selected ? <Check size={15}/> : <Plus size={15} className="text-navy-400"/>}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label className="field-label">Special requests</label>
            <textarea value={walkIn.specialRequests} onChange={e => setWalkIn({ ...walkIn, specialRequests: e.target.value })} className="field-input min-h-24" placeholder="Late arrival, room preference, extra towels, etc." />
          </div>
          <div className="rounded-2xl border border-black/5 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-navy-500">{walkInNights} night{walkInNights === 1 ? '' : 's'} × {walkIn.roomId ? `Room ${rooms.find(r => r.id === walkIn.roomId)?.roomNumber}` : 'room'}</span>
              <span>{naira(walkInSubtotal)}</span>
            </div>
            {!!walkInExtrasTotal && (
              <div className="flex justify-between text-sm">
                <span className="text-navy-500">Extra services</span>
                <span>{naira(walkInExtrasTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-navy-500">Room rate</span>
              <span>{naira(walkInRoom?.price ?? 0)}/night</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-navy-500">Taxes & VAT</span>
              <span>{naira(walkInTax)}</span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t border-black/10">
              <span>Total</span>
              <span>{naira(walkInTotal)}</span>
            </div>
          </div>
          {error && <div className="rounded-xl bg-red-50 text-red-700 text-sm p-3">{error}</div>}
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowWalkIn(false)} disabled={creating} className="btn-outline">Cancel</button>
            <button onClick={() => void createWalkIn()} disabled={creating || !walkIn.roomId} className={`flex items-center gap-2 ${creating || !walkIn.roomId ? 'rounded-lg bg-gray-200 px-4 py-2 text-gray-400 cursor-not-allowed' : 'btn-gold'}`}>
              {creating && <Loader2 size={15} className="animate-spin" />} Create booking
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!confirmingPayment} onClose={() => !savingPayment && setConfirmingPayment(null)} title="Choose payment method" subtitle={confirmingPayment ? `${confirmingPayment.reference} · ${naira(confirmingPayment.amount)}` : undefined}>
        <div className="space-y-5">
          <div className="rounded-xl bg-amber-50 text-amber-800 p-4 text-sm">
            Choose how the walk-in guest is paying. Cash, Transfer and POS are confirmed by reception. Transfer is shown here for the walk-in workflow, while the payment record continues to use the existing Paystack label used elsewhere in Blue Pair.
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <button onClick={() => setPaymentMethod('Transfer')} className={`rounded-2xl border-2 p-5 flex flex-col items-center gap-2 text-sm font-semibold ${paymentMethod === 'Transfer' ? 'border-gold-500 bg-gold-50' : 'border-black/10'}`}><Banknote size={22} />Transfer</button>
            <button onClick={() => setPaymentMethod('Cash')} className={`rounded-2xl border-2 p-5 flex flex-col items-center gap-2 text-sm font-semibold ${paymentMethod === 'Cash' ? 'border-navy-950 bg-navy-50' : 'border-black/10'}`}><Banknote size={22} />Cash</button>
            <button onClick={() => setPaymentMethod('POS')} className={`rounded-2xl border-2 p-5 flex flex-col items-center gap-2 text-sm font-semibold ${paymentMethod === 'POS' ? 'border-navy-950 bg-navy-50' : 'border-black/10'}`}><CreditCard size={22} />POS</button>
          </div>
          {error && <div className="rounded-xl bg-red-50 text-red-700 text-sm p-3">{error}</div>}
          <div className="flex justify-end gap-3">
            <button onClick={() => setConfirmingPayment(null)} disabled={savingPayment} className="btn-outline">Cancel</button>
            <button onClick={() => void confirmPayment()} disabled={!paymentMethod || savingPayment} className="btn-gold flex items-center gap-2">
              {savingPayment && <Loader2 size={15} className="animate-spin" />} Confirm {paymentMethod || 'payment'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
