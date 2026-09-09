import { create } from 'zustand'
import {
  roomTypes as initialRoomTypes, rooms as initialRooms, bookings as initialBookings,
  customers as initialCustomers, staff as initialStaff, menuItems as initialMenuItems,
  drinks as initialDrinks, shortLets as initialShortLets, events as initialEvents,
  maintenanceTickets as initialMaintenanceTickets, housekeepingTasks as initialHousekeepingTasks,
  billboards as initialBillboards, parkingZones, payments as initialPayments, offers as initialOffers,
  type RoomType, type Room, type Booking, type Customer, type StaffMember, type MenuItem,
  type Drink, type ShortLet, type EventItem, type MaintenanceTicket, type HousekeepingTask,
  type BillboardSpace, type Payment, type Offer, type RoomStatus,
} from '../data/mock'

interface ToastMsg { id: number; text: string; tone: 'success' | 'info' | 'error' }

interface StoreState {
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
  toasts: ToastMsg[]

  // actions
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
}

let bookingSeq = 24924
let toastSeq = 1

export const useStore = create<StoreState>((set, get) => ({
  roomTypes: initialRoomTypes,
  rooms: initialRooms,
  bookings: initialBookings,
  customers: initialCustomers,
  staff: initialStaff,
  menuItems: initialMenuItems,
  drinks: initialDrinks,
  shortLets: initialShortLets,
  events: initialEvents,
  maintenanceTickets: initialMaintenanceTickets,
  housekeepingTasks: initialHousekeepingTasks,
  billboards: initialBillboards,
  payments: initialPayments,
  offers: initialOffers,
  toasts: [],

  pushToast: (text, tone = 'success') => {
    const id = toastSeq++
    set(s => ({ toasts: [...s.toasts, { id, text, tone }] }))
    setTimeout(() => get().dismissToast(id), 3600)
  },
  dismissToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  updateRoomTypePrice: (id, price) => {
    set(s => ({ roomTypes: s.roomTypes.map(rt => rt.id === id ? { ...rt, price } : rt) }))
    get().pushToast('Price updated — now live on the public website', 'success')
  },
  toggleRoomTypeActive: (id) => {
    set(s => ({ roomTypes: s.roomTypes.map(rt => rt.id === id ? { ...rt, active: !rt.active } : rt) }))
    get().pushToast('Room availability toggled', 'info')
  },
  addRoomType: (rt) => {
    set(s => ({ roomTypes: [rt, ...s.roomTypes] }))
    get().pushToast('Room type added', 'success')
  },
  setRoomStatus: (roomId, status) => {
    set(s => ({ rooms: s.rooms.map(r => r.id === roomId ? { ...r, status } : r) }))
  },

  createBooking: (b) => {
    const reference = `BPH-${bookingSeq++}`
    const booking: Booking = { ...b, id: `b_${Date.now()}`, reference, createdAt: new Date().toISOString().slice(0,10), status: 'pending', paymentStatus: 'pending' }
    set(s => ({ bookings: [booking, ...s.bookings] }))
    return booking
  },
  confirmBookingPayment: (bookingId) => {
    set(s => ({ bookings: s.bookings.map(b => b.id === bookingId ? { ...b, status: 'confirmed', paymentStatus: 'paid' } : b) }))
    get().pushToast('Payment confirmed — booking added to admin list', 'success')
  },
  checkInBooking: (bookingId, roomId) => {
    set(s => ({
      bookings: s.bookings.map(b => b.id === bookingId ? { ...b, status: 'checked_in', roomId } : b),
      rooms: s.rooms.map(r => r.id === roomId ? { ...r, status: 'occupied' } : r),
    }))
    get().pushToast('Guest checked in', 'success')
  },
  checkOutBooking: (bookingId) => {
    const booking = get().bookings.find(b => b.id === bookingId)
    set(s => ({
      bookings: s.bookings.map(b => b.id === bookingId ? { ...b, status: 'checked_out' } : b),
      rooms: booking?.roomId ? s.rooms.map(r => r.id === booking.roomId ? { ...r, status: 'cleaning_required' } : r) : s.rooms,
    }))
    if (booking?.roomId) {
      const room = get().rooms.find(r => r.id === booking.roomId)
      const rt = get().roomTypes.find(rt => rt.id === booking.roomTypeId)
      const exists = get().housekeepingTasks.some(t => t.room === room?.roomNumber && t.status !== 'completed')
      if (room && !exists) {
        set(s => ({ housekeepingTasks: [{
          id: `hk_${Date.now()}`, room: room.roomNumber, roomType: rt?.name ?? '', checkoutTime: new Date().toLocaleTimeString('en-NG', {hour:'2-digit',minute:'2-digit'}),
          priority: 'Medium', assignedTo: 'Unassigned', status: 'pending', notes: 'Auto-created on checkout.',
        }, ...s.housekeepingTasks] }))
      }
    }
    get().pushToast('Guest checked out — room marked Cleaning Required', 'info')
  },
  cancelBooking: (bookingId) => {
    set(s => ({ bookings: s.bookings.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b) }))
    get().pushToast('Booking cancelled', 'error')
  },

  markCleaningStarted: (taskId) => {
    set(s => ({ housekeepingTasks: s.housekeepingTasks.map(t => t.id === taskId ? { ...t, status: 'in_progress' } : t) }))
    const task = get().housekeepingTasks.find(t => t.id === taskId)
    if (task) {
      const room = get().rooms.find(r => r.roomNumber === task.room)
      if (room) get().setRoomStatus(room.id, 'cleaning')
    }
    get().pushToast('Cleaning started', 'info')
  },
  markCleaned: (taskId, cleanerName) => {
    const now = new Date()
    const stamp = now.toLocaleString('en-NG', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })
    set(s => ({ housekeepingTasks: s.housekeepingTasks.map(t => t.id === taskId ? { ...t, status: 'completed', completedAt: stamp } : t) }))
    const task = get().housekeepingTasks.find(t => t.id === taskId)
    if (task) {
      const room = get().rooms.find(r => r.roomNumber === task.room)
      if (room) get().setRoomStatus(room.id, 'available')
    }
    get().pushToast(`Room ${task?.room} cleaned successfully by ${cleanerName}`, 'success')
  },

  addMaintenanceTicket: (t) => {
    set(s => ({ maintenanceTickets: [{ ...t, id: `mt_${Date.now()}`, status: 'open' }, ...s.maintenanceTickets] }))
    get().pushToast('Maintenance ticket created', 'success')
  },
  resolveMaintenanceTicket: (id) => {
    set(s => ({ maintenanceTickets: s.maintenanceTickets.map(t => t.id === id ? { ...t, status: 'resolved' } : t) }))
    get().pushToast('Ticket marked resolved — room status updated', 'success')
  },
  updateMaintenanceTicket: (id, patch) => {
    set(s => ({ maintenanceTickets: s.maintenanceTickets.map(t => t.id === id ? { ...t, ...patch } : t) }))
  },

  updateMenuItemPrice: (id, price) => {
    set(s => ({ menuItems: s.menuItems.map(m => m.id === id ? { ...m, price } : m) }))
    get().pushToast('Menu price updated — reflected on public menu', 'success')
  },
  toggleMenuItemAvailable: (id) => set(s => ({ menuItems: s.menuItems.map(m => m.id === id ? { ...m, available: !m.available } : m) })),
  addMenuItem: (item) => {
    set(s => ({ menuItems: [item, ...s.menuItems] }))
    get().pushToast('Menu item added', 'success')
  },

  updateDrinkPrice: (id, price) => {
    set(s => ({ drinks: s.drinks.map(d => d.id === id ? { ...d, price } : d) }))
    get().pushToast('Drink price updated — reflected on public bar menu', 'success')
  },
  toggleDrinkAvailable: (id) => set(s => ({ drinks: s.drinks.map(d => d.id === id ? { ...d, available: !d.available } : d) })),
  addDrink: (d) => {
    set(s => ({ drinks: [d, ...s.drinks] }))
    get().pushToast('Drink added', 'success')
  },

  addStaff: (member) => {
    set(s => ({ staff: [member, ...s.staff] }))
    get().pushToast('Staff member added — permissions applied', 'success')
  },
  toggleStaffStatus: (id) => set(s => ({ staff: s.staff.map(m => m.id === id ? { ...m, status: m.status === 'active' ? 'disabled' : 'active' } : m) })),
  updateStaffRole: (id, role) => {
    set(s => ({ staff: s.staff.map(m => m.id === id ? { ...m, role } : m) }))
    get().pushToast('Role updated — permissions refreshed', 'success')
  },

  togglePublishEvent: (id) => {
    set(s => ({ events: s.events.map(e => e.id === id ? { ...e, published: !e.published } : e) }))
    get().pushToast('Event publish state updated', 'success')
  },
  addEvent: (e) => {
    set(s => ({ events: [e, ...s.events] }))
    get().pushToast('Event created', 'success')
  },

  toggleOfferActive: (id) => set(s => ({ offers: s.offers.map(o => o.id === id ? { ...o, active: !o.active } : o) })),
}))

export { parkingZones }
