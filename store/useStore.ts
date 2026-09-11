import { create } from 'zustand'
import { supabase } from '../lib/supabase/client'
import {
  mapRoomType, mapRoom, mapBooking, mapCustomer, mapStaff, mapMenuItem, mapDrink,
  mapShortLet, mapEvent, mapMaintenanceTicket, mapHousekeepingTask, mapBillboard,
  mapParkingZone, mapPayment, mapOffer, mapGuestRequest, type GuestRequest,
  mapGalleryImage, type GalleryImage,
} from '../lib/mappers'
import {
  type RoomType, type Room, type Booking, type Customer, type StaffMember, type MenuItem,
  type Drink, type ShortLet, type EventItem, type MaintenanceTicket, type HousekeepingTask,
  type BillboardSpace, type Payment, type Offer, type RoomStatus, type ParkingZone,
} from '../data/mock'

interface ToastMsg { id: number; text: string; tone: 'success' | 'info' | 'error' }

interface StoreState {
  loaded: boolean
  roomTypes: RoomType[]
  rooms: Room[]
  bookings: Booking[]
  customers: Customer[]
  staff: StaffMember[]
  menuItems: MenuItem[]
  drinks: Drink[]
  shortLets: ShortLet[]
  events: EventItem[]
  maintenanceTickets: MaintenanceTicket[]
  housekeepingTasks: HousekeepingTask[]
  billboards: BillboardSpace[]
  payments: Payment[]
  offers: Offer[]
  guestRequests: GuestRequest[]
  parkingZones: ParkingZone[]
  galleryImages: GalleryImage[]
  toasts: ToastMsg[]

  loadAll: () => Promise<void>

  pushToast: (text: string, tone?: ToastMsg['tone']) => void
  dismissToast: (id: number) => void

  updateRoomTypePrice: (id: string, price: number) => void
  toggleRoomTypeActive: (id: string) => void
  addRoomType: (rt: RoomType) => void
  setRoomStatus: (roomId: string, status: RoomStatus) => void

  createBooking: (b: Omit<Booking, 'id' | 'reference' | 'createdAt' | 'status' | 'paymentStatus'>) => Booking
  confirmBookingPayment: (bookingId: string) => void
  checkInBooking: (bookingId: string, roomId: string) => void
  checkOutBooking: (bookingId: string) => void
  cancelBooking: (bookingId: string) => void

  markCleaningStarted: (taskId: string) => void
  markCleaned: (taskId: string, cleanerName: string) => void

  addMaintenanceTicket: (t: Omit<MaintenanceTicket, 'id' | 'status'>) => void
  resolveMaintenanceTicket: (id: string) => void
  updateMaintenanceTicket: (id: string, patch: Partial<MaintenanceTicket>) => void

  updateMenuItemPrice: (id: string, price: number) => void
  toggleMenuItemAvailable: (id: string) => void
  addMenuItem: (item: MenuItem) => void

  updateDrinkPrice: (id: string, price: number) => void
  toggleDrinkAvailable: (id: string) => void
  addDrink: (d: Drink) => void

  addStaff: (s: StaffMember) => void
  toggleStaffStatus: (id: string) => void
  updateStaffRole: (id: string, role: StaffMember['role']) => void

  togglePublishEvent: (id: string) => void
  addEvent: (e: EventItem) => void

  toggleOfferActive: (id: string) => void

  addGuestRequest: (r: { customerId?: string; bookingRef?: string; room?: string; guestName: string; type: string; message: string }) => void
  resolveGuestRequest: (id: string) => void

  addGalleryImage: (url: string, caption?: string) => void
  removeGalleryImage: (id: string) => void
}

let toastSeq = 1

async function save(table: string, patch: Record<string, any>, id: string) {
  const { error } = await supabase.from(table).update(patch).eq('id', id)
  if (error) console.error(`[${table}] update failed`, error.message)
}

async function insertRow(table: string, row: Record<string, any>) {
  const { error } = await supabase.from(table).insert(row)
  if (error) console.error(`[${table}] insert failed`, error.message)
}

export const useStore = create<StoreState>((set, get) => ({
  loaded: false,
  roomTypes: [],
  rooms: [],
  bookings: [],
  customers: [],
  staff: [],
  menuItems: [],
  drinks: [],
  shortLets: [],
  events: [],
  maintenanceTickets: [],
  housekeepingTasks: [],
  billboards: [],
  payments: [],
  offers: [],
  guestRequests: [],
  parkingZones: [],
  galleryImages: [],
  toasts: [],

  loadAll: async () => {
    const [rt, rm, bk, cu, st, mi, dr, sl, ev, mt, hk, bb, pz, pay, of, gr, gi] = await Promise.all([
      supabase.from('room_types').select('*').order('price'),
      supabase.from('rooms').select('*').order('room_number'),
      supabase.from('bookings').select('*').order('created_at', { ascending: false }),
      supabase.from('customers').select('*').order('name'),
      supabase.from('staff').select('*').order('name'),
      supabase.from('menu_items').select('*').order('name'),
      supabase.from('drinks').select('*').order('name'),
      supabase.from('short_lets').select('*').order('price'),
      supabase.from('events').select('*').order('date'),
      supabase.from('maintenance_tickets').select('*').order('date_reported', { ascending: false }),
      supabase.from('housekeeping_tasks').select('*').order('room'),
      supabase.from('billboards').select('*').order('price', { ascending: false }),
      supabase.from('parking_zones').select('*').order('name'),
      supabase.from('payments').select('*').order('date', { ascending: false }),
      supabase.from('offers').select('*').order('title'),
      supabase.from('guest_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('gallery_images').select('*').order('sort_order'),
    ])
    set({
      loaded: true,
      roomTypes: (rt.data ?? []).map(mapRoomType),
      rooms: (rm.data ?? []).map(mapRoom),
      bookings: (bk.data ?? []).map(mapBooking),
      customers: (cu.data ?? []).map(mapCustomer),
      staff: (st.data ?? []).map(mapStaff),
      menuItems: (mi.data ?? []).map(mapMenuItem),
      drinks: (dr.data ?? []).map(mapDrink),
      shortLets: (sl.data ?? []).map(mapShortLet),
      events: (ev.data ?? []).map(mapEvent),
      maintenanceTickets: (mt.data ?? []).map(mapMaintenanceTicket),
      housekeepingTasks: (hk.data ?? []).map(mapHousekeepingTask),
      billboards: (bb.data ?? []).map(mapBillboard),
      parkingZones: (pz.data ?? []).map(mapParkingZone),
      payments: (pay.data ?? []).map(mapPayment),
      offers: (of.data ?? []).map(mapOffer),
      guestRequests: (gr.data ?? []).map(mapGuestRequest),
      galleryImages: (gi.data ?? []).map(mapGalleryImage),
    })
  },

  pushToast: (text, tone = 'success') => {
    const id = toastSeq++
    set(s => ({ toasts: [...s.toasts, { id, text, tone }] }))
    setTimeout(() => get().dismissToast(id), 3600)
  },
  dismissToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  updateRoomTypePrice: (id, price) => {
    set(s => ({ roomTypes: s.roomTypes.map(rt => rt.id === id ? { ...rt, price } : rt) }))
    save('room_types', { price }, id)
    get().pushToast('Price updated — now live on the public website', 'success')
  },
  toggleRoomTypeActive: (id) => {
    const next = !get().roomTypes.find(rt => rt.id === id)?.active
    set(s => ({ roomTypes: s.roomTypes.map(rt => rt.id === id ? { ...rt, active: next } : rt) }))
    save('room_types', { active: next }, id)
    get().pushToast('Room availability toggled', 'info')
  },
  addRoomType: (rt) => {
    set(s => ({ roomTypes: [rt, ...s.roomTypes] }))
    insertRow('room_types', {
      id: rt.id, slug: rt.slug, name: rt.name, category: rt.category, price: rt.price,
      guests: rt.guests, bed_type: rt.bedType, size_sqm: rt.sizeSqm, amenities: rt.amenities,
      images: rt.images, description: rt.description, active: rt.active,
    })
    get().pushToast('Room type added', 'success')
  },
  setRoomStatus: (roomId, status) => {
    set(s => ({ rooms: s.rooms.map(r => r.id === roomId ? { ...r, status } : r) }))
    save('rooms', { status }, roomId)
  },

  createBooking: (b) => {
    const reference = `BPH-${Math.floor(24900 + Math.random() * 900)}`
    const booking: Booking = {
      ...b, id: `b_${Date.now()}`, reference,
      createdAt: new Date().toISOString().slice(0, 10), status: 'pending', paymentStatus: 'pending',
    }
    set(s => ({ bookings: [booking, ...s.bookings] }))
    insertRow('bookings', {
      id: booking.id, reference, customer_id: booking.customerId, room_type_id: booking.roomTypeId,
      room_id: booking.roomId ?? null, check_in: booking.checkIn, check_out: booking.checkOut,
      adults: booking.adults, children: booking.children, amount: booking.amount,
      payment_status: 'pending', status: 'pending', special_requests: booking.specialRequests ?? null,
    })
    return booking
  },
  confirmBookingPayment: (bookingId) => {
    set(s => ({ bookings: s.bookings.map(b => b.id === bookingId ? { ...b, status: 'confirmed', paymentStatus: 'paid' } : b) }))
    save('bookings', { status: 'confirmed', payment_status: 'paid' }, bookingId)
    get().pushToast('Payment confirmed — booking added to admin list', 'success')
  },
  checkInBooking: (bookingId, roomId) => {
    set(s => ({
      bookings: s.bookings.map(b => b.id === bookingId ? { ...b, status: 'checked_in', roomId } : b),
      rooms: s.rooms.map(r => r.id === roomId ? { ...r, status: 'occupied' } : r),
    }))
    save('bookings', { status: 'checked_in', room_id: roomId }, bookingId)
    save('rooms', { status: 'occupied' }, roomId)
    get().pushToast('Guest checked in', 'success')
  },
  checkOutBooking: (bookingId) => {
    const booking = get().bookings.find(b => b.id === bookingId)
    set(s => ({
      bookings: s.bookings.map(b => b.id === bookingId ? { ...b, status: 'checked_out' } : b),
      rooms: booking?.roomId ? s.rooms.map(r => r.id === booking.roomId ? { ...r, status: 'cleaning_required' } : r) : s.rooms,
    }))
    save('bookings', { status: 'checked_out' }, bookingId)
    if (booking?.roomId) {
      save('rooms', { status: 'cleaning_required' }, booking.roomId)
      const room = get().rooms.find(r => r.id === booking.roomId)
      const rt = get().roomTypes.find(t => t.id === booking.roomTypeId)
      const exists = get().housekeepingTasks.some(t => t.room === room?.roomNumber && t.status !== 'completed')
      if (room && !exists) {
        const task: HousekeepingTask = {
          id: `hk_${Date.now()}`, room: room.roomNumber, roomType: rt?.name ?? '',
          checkoutTime: new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }),
          priority: 'Medium', assignedTo: 'Unassigned', status: 'pending', notes: 'Auto-created on checkout.',
        }
        set(s => ({ housekeepingTasks: [task, ...s.housekeepingTasks] }))
        insertRow('housekeeping_tasks', {
          id: task.id, room: task.room, room_type: task.roomType, checkout_time: task.checkoutTime,
          priority: task.priority, assigned_to: task.assignedTo, status: task.status, notes: task.notes,
        })
      }
    }
    get().pushToast('Guest checked out — room marked Cleaning Required', 'info')
  },
  cancelBooking: (bookingId) => {
    set(s => ({ bookings: s.bookings.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b) }))
    save('bookings', { status: 'cancelled' }, bookingId)
    get().pushToast('Booking cancelled', 'error')
  },

  markCleaningStarted: (taskId) => {
    set(s => ({ housekeepingTasks: s.housekeepingTasks.map(t => t.id === taskId ? { ...t, status: 'in_progress' } : t) }))
    save('housekeeping_tasks', { status: 'in_progress' }, taskId)
    const task = get().housekeepingTasks.find(t => t.id === taskId)
    if (task) {
      const room = get().rooms.find(r => r.roomNumber === task.room)
      if (room) get().setRoomStatus(room.id, 'cleaning')
    }
    get().pushToast('Cleaning started', 'info')
  },
  markCleaned: (taskId, cleanerName) => {
    const stamp = new Date().toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    set(s => ({ housekeepingTasks: s.housekeepingTasks.map(t => t.id === taskId ? { ...t, status: 'completed', completedAt: stamp } : t) }))
    save('housekeeping_tasks', { status: 'completed', completed_at: stamp }, taskId)
    const task = get().housekeepingTasks.find(t => t.id === taskId)
    if (task) {
      const room = get().rooms.find(r => r.roomNumber === task.room)
      if (room) get().setRoomStatus(room.id, 'available')
    }
    get().pushToast(`Room ${task?.room} cleaned successfully by ${cleanerName}`, 'success')
  },

  addMaintenanceTicket: (t) => {
    const ticket: MaintenanceTicket = { ...t, id: `mt_${Date.now()}`, status: 'open' }
    set(s => ({ maintenanceTickets: [ticket, ...s.maintenanceTickets] }))
    insertRow('maintenance_tickets', {
      id: ticket.id, room: ticket.room, issue: ticket.issue, priority: ticket.priority,
      assigned_to: ticket.assignedTo, date_reported: ticket.dateReported, status: 'open', notes: ticket.notes ?? '',
    })
    get().pushToast('Maintenance ticket created', 'success')
  },
  resolveMaintenanceTicket: (id) => {
    set(s => ({ maintenanceTickets: s.maintenanceTickets.map(t => t.id === id ? { ...t, status: 'resolved' } : t) }))
    save('maintenance_tickets', { status: 'resolved' }, id)
    get().pushToast('Ticket marked resolved — room status updated', 'success')
  },
  updateMaintenanceTicket: (id, patch) => {
    set(s => ({ maintenanceTickets: s.maintenanceTickets.map(t => t.id === id ? { ...t, ...patch } : t) }))
    const dbPatch: Record<string, any> = {}
    if (patch.status) dbPatch.status = patch.status
    if (patch.priority) dbPatch.priority = patch.priority
    if (patch.notes !== undefined) dbPatch.notes = patch.notes
    if (patch.assignedTo) dbPatch.assigned_to = patch.assignedTo
    if (Object.keys(dbPatch).length) save('maintenance_tickets', dbPatch, id)
  },

  updateMenuItemPrice: (id, price) => {
    set(s => ({ menuItems: s.menuItems.map(m => m.id === id ? { ...m, price } : m) }))
    save('menu_items', { price }, id)
    get().pushToast('Menu price updated — reflected on public menu', 'success')
  },
  toggleMenuItemAvailable: (id) => {
    const next = !get().menuItems.find(m => m.id === id)?.available
    set(s => ({ menuItems: s.menuItems.map(m => m.id === id ? { ...m, available: next } : m) }))
    save('menu_items', { available: next }, id)
  },
  addMenuItem: (item) => {
    set(s => ({ menuItems: [item, ...s.menuItems] }))
    insertRow('menu_items', {
      id: item.id, outlet: item.outlet, category: item.category, name: item.name,
      price: item.price, image: item.image, available: item.available,
    })
    get().pushToast('Menu item added', 'success')
  },

  updateDrinkPrice: (id, price) => {
    set(s => ({ drinks: s.drinks.map(d => d.id === id ? { ...d, price } : d) }))
    save('drinks', { price }, id)
    get().pushToast('Drink price updated — reflected on public bar menu', 'success')
  },
  toggleDrinkAvailable: (id) => {
    const next = !get().drinks.find(d => d.id === id)?.available
    set(s => ({ drinks: s.drinks.map(d => d.id === id ? { ...d, available: next } : d) }))
    save('drinks', { available: next }, id)
  },
  addDrink: (d) => {
    set(s => ({ drinks: [d, ...s.drinks] }))
    insertRow('drinks', { id: d.id, bar: d.bar, category: d.category, name: d.name, price: d.price, available: d.available })
    get().pushToast('Drink added', 'success')
  },

  addStaff: (member) => {
    set(s => ({ staff: [member, ...s.staff] }))
    insertRow('staff', {
      id: member.id, name: member.name, email: member.email, phone: member.phone,
      role: member.role, department: member.department, status: member.status, joined: member.joined,
    })
    get().pushToast('Staff member added — permissions applied', 'success')
  },
  toggleStaffStatus: (id) => {
    const next = get().staff.find(m => m.id === id)?.status === 'active' ? 'disabled' : 'active'
    set(s => ({ staff: s.staff.map(m => m.id === id ? { ...m, status: next } : m) }))
    save('staff', { status: next }, id)
  },
  updateStaffRole: (id, role) => {
    set(s => ({ staff: s.staff.map(m => m.id === id ? { ...m, role } : m) }))
    save('staff', { role }, id)
    get().pushToast('Role updated — permissions refreshed', 'success')
  },

  togglePublishEvent: (id) => {
    const next = !get().events.find(e => e.id === id)?.published
    set(s => ({ events: s.events.map(e => e.id === id ? { ...e, published: next } : e) }))
    save('events', { published: next }, id)
    get().pushToast('Event publish state updated', 'success')
  },
  addEvent: (e) => {
    set(s => ({ events: [e, ...s.events] }))
    insertRow('events', {
      id: e.id, title: e.title, date: e.date, price: e.price, capacity: e.capacity,
      image: e.image, description: e.description, published: e.published,
    })
    get().pushToast('Event created', 'success')
  },

  toggleOfferActive: (id) => {
    const next = !get().offers.find(o => o.id === id)?.active
    set(s => ({ offers: s.offers.map(o => o.id === id ? { ...o, active: next } : o) }))
    save('offers', { active: next }, id)
  },

  addGuestRequest: (r) => {
    const req: GuestRequest = {
      id: `gr_${Date.now()}`, customerId: r.customerId, bookingRef: r.bookingRef ?? '', room: r.room ?? '',
      guestName: r.guestName, type: r.type, message: r.message, status: 'open',
      createdAt: new Date().toISOString().slice(0, 10),
    }
    set(s => ({ guestRequests: [req, ...s.guestRequests] }))
    insertRow('guest_requests', {
      id: req.id, customer_id: req.customerId ?? null, booking_ref: req.bookingRef, room: req.room,
      guest_name: req.guestName, type: req.type, message: req.message, status: 'open',
    })
    get().pushToast('Request sent to reception', 'success')
  },
  resolveGuestRequest: (id) => {
    set(s => ({ guestRequests: s.guestRequests.map(r => r.id === id ? { ...r, status: 'resolved' } : r) }))
    save('guest_requests', { status: 'resolved' }, id)
    get().pushToast('Request marked resolved', 'success')
  },

  addGalleryImage: (url, caption) => {
    const img: GalleryImage = { id: `gi_${Date.now()}`, url, caption, sortOrder: get().galleryImages.length + 1 }
    set(s => ({ galleryImages: [...s.galleryImages, img] }))
    insertRow('gallery_images', { id: img.id, url: img.url, caption: img.caption ?? null, sort_order: img.sortOrder })
    get().pushToast('Image added to gallery', 'success')
  },
  removeGalleryImage: (id) => {
    set(s => ({ galleryImages: s.galleryImages.filter(g => g.id !== id) }))
    supabase.from('gallery_images').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('[gallery_images] delete failed', error.message)
    })
    get().pushToast('Image removed', 'info')
  },
}))

