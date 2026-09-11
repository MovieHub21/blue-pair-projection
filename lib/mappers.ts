import type {
  RoomType, Room, Booking, Customer, StaffMember, MenuItem, Drink, ShortLet,
  EventItem, MaintenanceTicket, HousekeepingTask, BillboardSpace, ParkingZone,
  Payment, Offer, RoomStatus,
} from '../data/mock'

type Row = Record<string, any>

export const mapRoomType = (r: Row): RoomType => ({
  id: r.id, slug: r.slug, name: r.name, category: r.category,
  price: Number(r.price), guests: r.guests, bedType: r.bed_type, sizeSqm: r.size_sqm,
  amenities: r.amenities ?? [], images: r.images ?? [], description: r.description, active: r.active,
})

export const mapRoom = (r: Row): Room => ({
  id: r.id, roomNumber: r.room_number, roomTypeId: r.room_type_id, floor: r.floor, status: r.status as RoomStatus,
})

export const mapBooking = (r: Row): Booking => ({
  id: r.id, reference: r.reference, customerId: r.customer_id, roomTypeId: r.room_type_id,
  roomId: r.room_id ?? undefined, checkIn: r.check_in, checkOut: r.check_out,
  adults: r.adults, children: r.children, amount: Number(r.amount),
  paymentStatus: r.payment_status, status: r.status,
  createdAt: (r.created_at ?? '').slice(0, 10), specialRequests: r.special_requests ?? undefined,
})

export const mapCustomer = (r: Row): Customer => ({
  id: r.id, name: r.name, email: r.email, phone: r.phone, lastStay: r.last_stay ?? undefined, status: r.status,
})

export const mapStaff = (r: Row): StaffMember => ({
  id: r.id, name: r.name, email: r.email, phone: r.phone, role: r.role,
  department: r.department, status: r.status, joined: r.joined,
})

export const mapMenuItem = (r: Row): MenuItem => ({
  id: r.id, outlet: r.outlet, category: r.category, name: r.name,
  price: Number(r.price), image: r.image, available: r.available,
})

export const mapDrink = (r: Row): Drink => ({
  id: r.id, bar: r.bar, category: r.category, name: r.name, price: Number(r.price), available: r.available,
})

export const mapShortLet = (r: Row): ShortLet => ({
  id: r.id, name: r.name, type: r.type, price: Number(r.price), bedrooms: r.bedrooms,
  amenities: r.amenities ?? [], image: r.image, available: r.available, description: r.description,
})

export const mapEvent = (r: Row): EventItem => ({
  id: r.id, title: r.title, date: r.date, price: Number(r.price), capacity: r.capacity,
  image: r.image, description: r.description, published: r.published,
})

export const mapMaintenanceTicket = (r: Row): MaintenanceTicket => ({
  id: r.id, room: r.room, issue: r.issue, priority: r.priority, assignedTo: r.assigned_to,
  dateReported: r.date_reported, status: r.status, notes: r.notes ?? '',
})

export const mapHousekeepingTask = (r: Row): HousekeepingTask => ({
  id: r.id, room: r.room, roomType: r.room_type, checkoutTime: r.checkout_time,
  priority: r.priority, assignedTo: r.assigned_to, status: r.status,
  notes: r.notes ?? '', completedAt: r.completed_at ?? undefined,
})

export const mapBillboard = (r: Row): BillboardSpace => ({
  id: r.id, location: r.location, dimensions: r.dimensions, price: Number(r.price),
  image: r.image, available: r.available,
})

export const mapParkingZone = (r: Row): ParkingZone => ({
  id: r.id, name: r.name, type: r.type, capacity: r.capacity, occupied: r.occupied,
})

export const mapPayment = (r: Row): Payment => ({
  id: r.id, reference: r.reference, bookingRef: r.booking_ref, customer: r.customer,
  amount: Number(r.amount), method: r.method, status: r.status, date: r.date,
})

export const mapOffer = (r: Row): Offer => ({
  id: r.id, title: r.title, description: r.description, discount: r.discount,
  category: r.category, active: r.active,
})

export interface GuestRequest {
  id: string
  customerId?: string
  bookingRef: string
  room: string
  guestName: string
  type: string
  message: string
  status: string
  createdAt: string
}

export const mapGuestRequest = (r: Row): GuestRequest => ({
  id: r.id, customerId: r.customer_id ?? undefined, bookingRef: r.booking_ref ?? '',
  room: r.room ?? '', guestName: r.guest_name ?? '', type: r.type, message: r.message,
  status: r.status, createdAt: (r.created_at ?? '').slice(0, 10),
})

export interface GalleryImage { id: string; url: string; caption?: string; sortOrder: number }

export const mapGalleryImage = (r: Row): GalleryImage => ({
  id: r.id, url: r.url, caption: r.caption ?? undefined, sortOrder: r.sort_order ?? 0,
})
