'use client'

import { useMemo, useState } from 'react'
import { Search, X, Mail, Phone, CalendarDays, BedDouble, Users, CreditCard, MessageSquare, Clock3, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { useStore } from '../../../store/useStore'
import { formatDate, initials } from '../../../lib/format'
import StatusBadge from '../../../components/ui/StatusBadge'

const money = (value: number) => `₦${Number(value || 0).toLocaleString('en-NG')}`

const bookingStatusLabel: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  checked_in: 'Checked in',
  checked_out: 'Checked out',
  cancelled: 'Cancelled',
}

const bookingStatusClass: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-blue-50 text-blue-700',
  checked_in: 'bg-emerald-50 text-emerald-700',
  checked_out: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-red-50 text-red-700',
}

export default function CustomerManagement() {
  const { customers, bookings, rooms, roomTypes, guestRequests, payments } = useStore()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filteredCustomers = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    return customers.filter(customer => {
      const customerBookings = bookings.filter(b => b.customerId === customer.id)
      const matchesQuery = !normalized || [
        customer.name,
        customer.email,
        customer.phone,
        ...customerBookings.map(b => b.reference),
      ].some(value => String(value ?? '').toLowerCase().includes(normalized))

      const matchesStatus = statusFilter === 'all' || customer.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [customers, bookings, query, statusFilter])

  const selectedCustomer = customers.find(c => c.id === selectedId) ?? null

  const selectedBookings = useMemo(() => {
    if (!selectedCustomer) return []
    return bookings
      .filter(b => b.customerId === selectedCustomer.id)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  }, [bookings, selectedCustomer])

  const activeBooking = selectedBookings.find(b => b.status === 'checked_in') ?? null
  const selectedRequests = selectedCustomer
    ? guestRequests.filter(r => r.customerId === selectedCustomer.id)
    : []
  const selectedPayments = selectedCustomer
    ? payments.filter(p => selectedBookings.some(b => b.reference === p.bookingRef))
    : []

  const getRoomName = (booking: typeof bookings[number]) =>
    roomTypes.find(r => r.id === booking.roomTypeId)?.name ?? 'Room'

  const getAssignedRoom = (booking: typeof bookings[number]) => {
    const room = rooms.find(r => r.id === booking.roomId)
    return room ? `Room ${room.roomNumber}` : 'Not assigned'
  }

  const bookingCount = (id: string) => bookings.filter(b => b.customerId === id).length
  const lastBooking = (id: string) => bookings
    .filter(b => b.customerId === id && b.status !== 'cancelled')
    .sort((a, b) => String(b.checkOut).localeCompare(String(a.checkOut)))[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Customer Management</h1>
        <p className="mt-1 text-sm text-navy-500">Search guests, review their complete stay history, and understand their current or previous visits.</p>
      </div>

      <div className="card p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name, email, phone or booking code..."
              className="w-full rounded-xl border border-black/10 bg-white pl-10 pr-4 py-3 text-sm outline-none focus:border-gold-400"
            />
          </div>
          <div className="flex items-center gap-2 min-w-[210px]">
            <SlidersHorizontal className="w-4 h-4 text-navy-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm outline-none focus:border-gold-400"
            >
              <option value="all">All customer statuses</option>
              <option value="active">Active</option>
              <option value="vip">VIP</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className="text-xs text-navy-400">Showing {filteredCustomers.length} of {customers.length} customers</div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="text-left text-xs text-navy-400 border-b border-black/5">
              <th className="p-4">Guest</th>
              <th className="p-4">Email</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Bookings</th>
              <th className="p-4">Last stay</th>
              <th className="p-4">Status</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(c => (
              <tr
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className="border-b border-black/5 last:border-none cursor-pointer hover:bg-black/[0.02] transition-colors"
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gold-50 text-gold-600 text-[11px] font-bold flex items-center justify-center">{initials(c.name)}</div>
                    <div>
                      <b>{c.name}</b>
                      {bookings.some(b => b.customerId === c.id && b.status === 'checked_in') && (
                        <div className="text-[11px] text-emerald-600 mt-0.5">Currently staying</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-4 text-navy-500">{c.email}</td>
                <td className="p-4 text-navy-500">{c.phone}</td>
                <td className="p-4 text-navy-500">{bookingCount(c.id)}</td>
                <td className="p-4 text-navy-500">{lastBooking(c.id)?.checkOut ? formatDate(lastBooking(c.id)!.checkOut) : '—'}</td>
                <td className="p-4"><StatusBadge status={c.status} /></td>
                <td className="p-4"><ChevronRight className="w-4 h-4 text-navy-300" /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCustomers.length === 0 && (
          <div className="py-14 text-center text-sm text-navy-400">No customers match your search or filter.</div>
        )}
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-navy-950/40 backdrop-blur-sm flex items-end lg:items-center justify-center p-0 lg:p-6" onClick={() => setSelectedId(null)}>
          <div
            className="bg-white w-full lg:max-w-6xl max-h-[94vh] overflow-y-auto rounded-t-3xl lg:rounded-3xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-black/5 px-5 lg:px-7 py-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gold-50 text-gold-600 text-sm font-bold flex items-center justify-center">{initials(selectedCustomer.name)}</div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold">{selectedCustomer.name}</h2>
                    <StatusBadge status={selectedCustomer.status} />
                    {activeBooking && <span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 text-[11px] font-semibold">Currently staying</span>}
                  </div>
                  <div className="text-sm text-navy-500 mt-1">Customer since {selectedBookings[selectedBookings.length - 1]?.createdAt ? formatDate(selectedBookings[selectedBookings.length - 1].createdAt) : '—'}</div>
                </div>
              </div>
              <button onClick={() => setSelectedId(null)} className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 lg:p-7 space-y-7">
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <InfoCard icon={<Mail className="w-4 h-4" />} label="Email" value={selectedCustomer.email} />
                <InfoCard icon={<Phone className="w-4 h-4" />} label="Phone" value={selectedCustomer.phone || 'Not provided'} />
                <InfoCard icon={<CalendarDays className="w-4 h-4" />} label="Total bookings" value={String(selectedBookings.length)} />
                <InfoCard icon={<CreditCard className="w-4 h-4" />} label="Total booked value" value={money(selectedBookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + b.amount, 0))} />
              </section>

              {activeBooking && (
                <section className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider font-semibold text-emerald-700">Current stay</p>
                      <h3 className="text-lg font-semibold mt-1">{getRoomName(activeBooking)} · {getAssignedRoom(activeBooking)}</h3>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700">{bookingStatusLabel[activeBooking.status]}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <DetailItem label="Checked in" value={formatDate(activeBooking.checkIn)} />
                    <DetailItem label="Checkout due" value={formatDate(activeBooking.checkOut)} />
                    <DetailItem label="Booking code" value={activeBooking.reference} />
                  </div>
                  {activeBooking.specialRequests && (
                    <div className="mt-4 rounded-xl bg-white/80 p-3 text-sm"><b>Special requests:</b> {activeBooking.specialRequests}</div>
                  )}
                </section>
              )}

              <section>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">Stay history</h3>
                    <p className="text-xs text-navy-400 mt-1">Every reservation, room assignment, guest count and stay status.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {selectedBookings.map(booking => (
                    <div key={booking.id} className="rounded-2xl border border-black/5 p-4 lg:p-5">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold">{getRoomName(booking)}</h4>
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${bookingStatusClass[booking.status] ?? 'bg-slate-100 text-slate-600'}`}>{bookingStatusLabel[booking.status] ?? booking.status}</span>
                          </div>
                          <div className="text-xs text-navy-400 mt-1">Booking code: <span className="font-medium text-navy-600">{booking.reference}</span></div>
                        </div>
                        <div className="text-left lg:text-right">
                          <div className="font-semibold">{money(booking.amount)}</div>
                          <div className="text-xs text-navy-400 capitalize">Payment: {booking.paymentStatus}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-5 text-sm">
                        <DetailItem icon={<CalendarDays className="w-3.5 h-3.5" />} label="Check-in" value={formatDate(booking.checkIn)} />
                        <DetailItem icon={<Clock3 className="w-3.5 h-3.5" />} label="Check-out" value={formatDate(booking.checkOut)} />
                        <DetailItem icon={<BedDouble className="w-3.5 h-3.5" />} label="Room" value={getAssignedRoom(booking)} />
                        <DetailItem icon={<Users className="w-3.5 h-3.5" />} label="Guests" value={`${booking.adults} adult${booking.adults === 1 ? '' : 's'} · ${booking.children} child${booking.children === 1 ? '' : 'ren'}`} />
                        <DetailItem label="Booked" value={formatDate(booking.createdAt)} />
                      </div>

                      {booking.specialRequests && (
                        <div className="mt-4 rounded-xl bg-navy-50/60 p-3 text-sm flex gap-2">
                          <MessageSquare className="w-4 h-4 mt-0.5 text-navy-400 shrink-0" />
                          <div><b>Special requests</b><div className="text-navy-500 mt-0.5">{booking.specialRequests}</div></div>
                        </div>
                      )}
                    </div>
                  ))}
                  {selectedBookings.length === 0 && <div className="text-sm text-navy-400 py-4">No booking history found.</div>}
                </div>
              </section>

              <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="rounded-2xl border border-black/5 p-5">
                  <h3 className="font-semibold mb-4">Guest requests & interactions</h3>
                  {selectedRequests.length ? (
                    <div className="space-y-3">
                      {selectedRequests.map(request => (
                        <div key={request.id} className="rounded-xl bg-navy-50/50 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold capitalize">{request.type.replace(/_/g, ' ')}</span>
                            <span className="text-[11px] text-navy-400">{request.status}</span>
                          </div>
                          <p className="text-sm text-navy-600 mt-1">{request.message}</p>
                          <p className="text-[11px] text-navy-400 mt-2">{request.bookingRef || 'No booking'} · {request.room || 'No room'} · {formatDate(request.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-navy-400">No guest requests recorded.</p>}
                </div>

                <div className="rounded-2xl border border-black/5 p-5">
                  <h3 className="font-semibold mb-4">Payment history</h3>
                  {selectedPayments.length ? (
                    <div className="space-y-3">
                      {selectedPayments.map(payment => (
                        <div key={payment.id} className="flex items-center justify-between gap-4 rounded-xl bg-navy-50/50 p-3">
                          <div>
                            <div className="text-sm font-semibold">{payment.reference}</div>
                            <div className="text-[11px] text-navy-400">{payment.bookingRef} · {payment.method} · {formatDate(payment.date)}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-sm">{money(payment.amount)}</div>
                            <div className="text-[11px] capitalize text-navy-400">{payment.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-navy-400">No payment records linked to this guest.</p>}
                </div>
              </section>

              <section className="rounded-2xl bg-navy-50/50 p-5">
                <h3 className="font-semibold mb-3">Guest overview for staff</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <DetailItem label="Customer status" value={selectedCustomer.status} />
                  <DetailItem label="Reservations" value={String(selectedBookings.length)} />
                  <DetailItem label="Completed stays" value={String(selectedBookings.filter(b => b.status === 'checked_out').length)} />
                  <DetailItem label="Cancelled bookings" value={String(selectedBookings.filter(b => b.status === 'cancelled').length)} />
                </div>
                <p className="text-xs text-navy-400 mt-4">Use this profile to quickly understand the guest's contact details, reservation history, room preferences expressed through requests, stay dates, guest counts, payments and current status before assisting them.</p>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4">
      <div className="flex items-center gap-2 text-xs text-navy-400">{icon}{label}</div>
      <div className="font-medium text-sm mt-2 break-words">{value}</div>
    </div>
  )
}

function DetailItem({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[11px] text-navy-400">{icon}{label}</div>
      <div className="text-sm font-medium mt-1 capitalize">{value}</div>
    </div>
  )
}
