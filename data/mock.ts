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

export interface Booking {
  id: string
  reference: string
  customerId: string
  roomTypeId: string
  roomId?: string
  checkIn: string
  checkOut: string
  checkedInAt?: string
  checkedOutAt?: string
  adults: number
  children: number
  amount: number
  paymentStatus: 'paid' | 'pending' | 'refunded'
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled'
  source: 'online' | 'walk_in'
  createdBy?: string
  createdAt: string
  specialRequests?: string
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
  customerId?: string
  customer: string
  amount: number
  method: 'Card' | 'Bank Transfer' | 'Paystack' | 'Cash' | 'POS'
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
    description:'A larger room with upgraded comfort, a king bed, and thoughtful extras.', active:true },
  { id:'rt3', slug:'executive-room', name:'Executive Room', category:'Executive', price:130000, guests:2, bedType:'King bed', sizeSqm:38,
    amenities:['Free WiFi','Minibar','Smart TV','Rain shower','City view','Work lounge'],
    images:['https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80'],
    description:'A spacious executive stay designed for guests who want more room to work and unwind.', active:true },
  { id:'rt4', slug:'premium-suite', name:'Premium Suite', category:'Premium', price:180000, guests:3, bedType:'King bed + sofa bed', sizeSqm:52,
    amenities:['Free WiFi','Living area','Minibar','Smart TV','Rain shower','City view','Premium toiletries'],
    images:['https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&w=1200&q=80'],
    description:'A premium suite with a separate living feel and more space for longer stays.', active:true },
  { id:'rt5', slug:'vip-suite', name:'VIP Suite', category:'VIP Suite', price:250000, guests:4, bedType:'King bed + sofa bed', sizeSqm:70,
    amenities:['Free WiFi','Private lounge','Minibar','Smart TV','Rain shower','Dining area','VIP toiletries'],
    images:['https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80'],
    description:'The hotel’s most exclusive suite for guests who expect privacy, space, and elevated service.', active:true },
]
