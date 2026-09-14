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

export interface ExtraServiceSelection {
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
  extraServices?: ExtraServiceSelection[]
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
