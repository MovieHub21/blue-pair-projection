// ============================================================
// Blue Pair Hotel — mock data
// Structured so this file is the only thing that needs to change
// when wiring up Supabase/a real API later.
// ============================================================

export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'cleaning_required' | 'maintenance'

export interface RoomType {
  id: string
  slug: string
  name: string
  category: 'Standard' | 'Deluxe' | 'Executive' | 'Premium' | 'Suite' | 'VIP Suite'
  price: number
  guests: number
  bedType: string
  sizeSqm: number
  amenities: string[]
  images: string[]
  description: string
  active: boolean
}

export interface Room {
  id: string
  roomNumber: string
  roomTypeId: string
  floor: string
  status: RoomStatus
}

export interface BookingExtraService {
  id: string
  name: string
  price: number
}

export interface Booking {
  id: string
  reference: string
  customerId: string
  roomTypeId: string
  roomId?: string
  checkIn: string
  checkOut: string
  adults: number
  children: number
  amount: number
  paymentStatus: 'paid' | 'pending' | 'refunded'
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled'
  createdAt: string
  specialRequests?: string
  extraServices?: BookingExtraService[]
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  lastStay?: string
  status: 'active' | 'vip' | 'inactive'
}

export interface StaffMember {
  id: string
  userId?: string
  name: string
  email: string
  phone: string
  role: 'Super Admin' | 'Manager' | 'Reception' | 'Housekeeping' | 'Maintenance' | 'Restaurant Staff' | 'Bar Staff' | 'Accountant'
  department: string
  status: 'active' | 'disabled'
  joined: string
}

export interface MenuItem {
  id: string
  outlet: 'Blue Pair Restaurant' | 'Outdoor Bar & Eatery' | 'Annex Restaurant' | 'Annex Grilling'
  category: string
  name: string
  price: number
  image: string
  available: boolean
}

export interface Drink {
  id: string
  bar: 'Main Bar' | 'VIP Bar' | 'Outdoor Bar' | 'Annex Bar'
  category: string
  name: string
  price: number
  available: boolean
}

export interface ShortLet {
  id: string
  name: string
  type: string
  price: number
  bedrooms: number
  amenities: string[]
  image: string
  available: boolean
  description: string
}

export interface EventItem {
  id: string
  title: string
  date: string
  price: number
  capacity: number
  image: string
  description: string
  published: boolean
}

export interface MaintenanceTicket {
  id: string
  room: string
  issue: string
  priority: 'Low' | 'Medium' | 'High'
  assignedTo: string
  dateReported: string
  status: 'open' | 'in_progress' | 'resolved'
  notes: string
}

export interface HousekeepingTask {
  id: string
  room: string
  roomType: string
  checkoutTime: string
  priority: 'Low' | 'Medium' | 'High'
  assignedTo: string
  status: 'pending' | 'in_progress' | 'completed'
  notes: string
  completedAt?: string
}

export interface BillboardSpace {
  id: string
  location: string
  dimensions: string
  price: number
  image: string
  available: boolean
}

export interface ParkingZone {
  id: string
  name: string
  type: 'Standard' | 'VIP'
  capacity: number
  occupied: number
}

export interface Payment {
  id: string
  reference: string
  bookingRef: string
  customer: string
  amount: number
  method: 'Card' | 'Bank Transfer' | 'Paystack' | 'Cash'
  status: 'success' | 'pending' | 'refunded'
  date: string
}

export interface Offer {
  id: string
  title: string
  description: string
  discount: string
  category: 'Room' | 'Restaurant' | 'Seasonal' | 'Package'
  active: boolean
}

// ---------------- ROOM TYPES ----------------
export const roomTypes: RoomType[] = [
  { id:'rt1', slug:'standard-room', name:'Standard Room', category:'Standard', price:65000, guests:2, bedType:'Queen bed', sizeSqm:24,
    amenities:['Free WiFi','Air conditioning','Flat-screen TV','Work desk'],
    images:['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80'],
    description:'A comfortable, well-appointed room for the essentials of a good stay — quiet, clean, and close to the lobby.', active:true },
  { id:'rt2', slug:'deluxe-room', name:'Deluxe Room', category:'Deluxe', price:95000, guests:2, bedType:'King bed', sizeSqm:30,
    amenities:['Free WiFi','Minibar','Smart TV','Rain shower','City view'],
    images:['https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80'],
    description:'A brighter, larger room with a city view and a stocked minibar — a favourite for business travellers.', active:true },
  { id:'rt3', slug:'executive-room', name:'Executive Room', category:'Executive', price:135000, guests:3, bedType:'King + sofa bed', sizeSqm:38,
    amenities:['Free WiFi','Minibar','Lounge access','Nespresso machine','Bathtub'],
    images:['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'],
    description:'Executive-floor comfort with lounge access and a separate seating area for meetings or downtime.', active:true },
  { id:'rt4', slug:'premium-room', name:'Premium Room', category:'Premium', price:175000, guests:3, bedType:'King bed', sizeSqm:44,
    amenities:['Free WiFi','Minibar','Pool view','Rain shower','Bathrobe & slippers'],
    images:['https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80'],
    description:'Pool-facing premium comfort with an oversized soaking tub and a private balcony.', active:true },
  { id:'rt5', slug:'suite', name:'Suite', category:'Suite', price:260000, guests:4, bedType:'King + living room', sizeSqm:62,
    amenities:['Free WiFi','Full lounge','Dining area','Minibar','Butler on request'],
    images:['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80'],
    description:'A full separate living area and dining space, built for longer stays and entertaining guests.', active:true },
  { id:'rt6', slug:'vip-suite', name:'VIP Suite', category:'VIP Suite', price:420000, guests:4, bedType:'Two king rooms', sizeSqm:95,
    amenities:['Free WiFi','Private lounge','Butler service','Jacuzzi','VIP parking','Airport pickup'],
    images:['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'],
    description:'The hotel\u2019s flagship suite — a private two-room residence with dedicated butler service and VIP parking.', active:true },
]

export const rooms: Room[] = [
  { id:'r101', roomNumber:'101', roomTypeId:'rt1', floor:'1', status:'available' },
  { id:'r102', roomNumber:'102', roomTypeId:'rt1', floor:'1', status:'occupied' },
  { id:'r103', roomNumber:'103', roomTypeId:'rt1', floor:'1', status:'cleaning_required' },
  { id:'r104', roomNumber:'104', roomTypeId:'rt2', floor:'1', status:'available' },
  { id:'r105', roomNumber:'105', roomTypeId:'rt2', floor:'1', status:'occupied' },
  { id:'r201', roomNumber:'201', roomTypeId:'rt2', floor:'2', status:'cleaning' },
  { id:'r202', roomNumber:'202', roomTypeId:'rt3', floor:'2', status:'available' },
  { id:'r203', roomNumber:'203', roomTypeId:'rt3', floor:'2', status:'occupied' },
  { id:'r204', roomNumber:'204', roomTypeId:'rt3', floor:'2', status:'cleaning_required' },
  { id:'r205', roomNumber:'205', roomTypeId:'rt4', floor:'2', status:'maintenance' },
  { id:'r301', roomNumber:'301', roomTypeId:'rt4', floor:'3', status:'available' },
  { id:'r302', roomNumber:'302', roomTypeId:'rt5', floor:'3', status:'occupied' },
  { id:'r303', roomNumber:'303', roomTypeId:'rt5', floor:'3', status:'available' },
  { id:'r401', roomNumber:'401', roomTypeId:'rt6', floor:'4', status:'occupied' },
  { id:'r402', roomNumber:'402', roomTypeId:'rt6', floor:'4', status:'available' },
]

// ---------------- CUSTOMERS ----------------
export const customers: Customer[] = [
  { id:'c1', name:'Adaeze Okonkwo', email:'adaeze.okonkwo@gmail.com', phone:'+234 803 214 5567', lastStay:'2026-06-12', status:'vip' },
]
