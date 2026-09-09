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
  adults: number
  children: number
  amount: number
  paymentStatus: 'paid' | 'pending' | 'refunded'
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled'
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
  { id:'c2', name:'Chukwuemeka Eze', email:'chuk.eze@yahoo.com', phone:'+234 810 552 9081', lastStay:'2026-07-01', status:'active' },
  { id:'c3', name:'Fatima Bello', email:'fatima.bello@outlook.com', phone:'+234 706 320 4471', lastStay:'2026-05-22', status:'active' },
  { id:'c4', name:'Oluwaseun Adebayo', email:'seun.adebayo@gmail.com', phone:'+234 802 771 3390', lastStay:'2026-07-20', status:'vip' },
  { id:'c5', name:'Ngozi Umeh', email:'ngozi.umeh@gmail.com', phone:'+234 815 004 2261', lastStay:'2026-04-03', status:'inactive' },
  { id:'c6', name:'Ibrahim Suleiman', email:'i.suleiman@hotmail.com', phone:'+234 809 663 1128', lastStay:'2026-07-28', status:'active' },
  { id:'c7', name:'Amaka Nwosu', email:'amaka.nwosu@gmail.com', phone:'+234 703 891 6674', lastStay:'2026-06-30', status:'active' },
  { id:'c8', name:'Tunde Bakare', email:'tunde.bakare@gmail.com', phone:'+234 813 227 5540', lastStay:'2026-07-15', status:'vip' },
]

// ---------------- BOOKINGS ----------------
export const bookings: Booking[] = [
  { id:'b1', reference:'BPH-24917', customerId:'c1', roomTypeId:'rt6', roomId:'r401', checkIn:'2026-08-09', checkOut:'2026-08-13', adults:2, children:0, amount:1680000, paymentStatus:'paid', status:'checked_in', createdAt:'2026-08-01' },
  { id:'b2', reference:'BPH-24918', customerId:'c2', roomTypeId:'rt3', roomId:'r203', checkIn:'2026-08-09', checkOut:'2026-08-11', adults:1, children:0, amount:270000, paymentStatus:'paid', status:'checked_in', createdAt:'2026-08-02' },
  { id:'b3', reference:'BPH-24919', customerId:'c3', roomTypeId:'rt2', checkIn:'2026-08-10', checkOut:'2026-08-12', adults:2, children:1, amount:190000, paymentStatus:'pending', status:'confirmed', createdAt:'2026-08-05' },
  { id:'b4', reference:'BPH-24920', customerId:'c4', roomTypeId:'rt5', roomId:'r302', checkIn:'2026-08-08', checkOut:'2026-08-09', adults:2, children:0, amount:260000, paymentStatus:'paid', status:'checked_in', createdAt:'2026-08-03' },
  { id:'b5', reference:'BPH-24921', customerId:'c6', roomTypeId:'rt1', checkIn:'2026-08-11', checkOut:'2026-08-14', adults:1, children:0, amount:195000, paymentStatus:'paid', status:'confirmed', createdAt:'2026-08-06' },
  { id:'b6', reference:'BPH-24922', customerId:'c7', roomTypeId:'rt4', checkIn:'2026-08-07', checkOut:'2026-08-09', adults:2, children:0, amount:350000, paymentStatus:'paid', status:'checked_out', createdAt:'2026-07-30' },
  { id:'b7', reference:'BPH-24923', customerId:'c8', roomTypeId:'rt6', checkIn:'2026-08-14', checkOut:'2026-08-17', adults:2, children:2, amount:1260000, paymentStatus:'pending', status:'pending', createdAt:'2026-08-07' },
]

// ---------------- STAFF ----------------
export const staff: StaffMember[] = [
  { id:'s1', name:'Chinedu Obiora', email:'chinedu.obiora@bluepairhotel.com', phone:'+234 802 110 4432', role:'Super Admin', department:'Management', status:'active', joined:'2019-03-11' },
  { id:'s2', name:'Blessing Okafor', email:'blessing.okafor@bluepairhotel.com', phone:'+234 806 552 7710', role:'Manager', department:'Operations', status:'active', joined:'2020-06-02' },
  { id:'s3', name:'Yusuf Aliyu', email:'yusuf.aliyu@bluepairhotel.com', phone:'+234 813 991 2260', role:'Reception', department:'Front Desk', status:'active', joined:'2022-01-18' },
  { id:'s4', name:'Grace Effiong', email:'grace.effiong@bluepairhotel.com', phone:'+234 705 448 6631', role:'Reception', department:'Front Desk', status:'active', joined:'2023-04-09' },
  { id:'s5', name:'Musa Danladi', email:'musa.danladi@bluepairhotel.com', phone:'+234 810 227 5541', role:'Housekeeping', department:'Housekeeping', status:'active', joined:'2021-09-14' },
  { id:'s6', name:'Patience Nwachukwu', email:'patience.n@bluepairhotel.com', phone:'+234 803 662 9012', role:'Housekeeping', department:'Housekeeping', status:'active', joined:'2022-11-01' },
  { id:'s7', name:'Emeka Nnamdi', email:'emeka.nnamdi@bluepairhotel.com', phone:'+234 807 335 6621', role:'Maintenance', department:'Facilities', status:'active', joined:'2020-02-20' },
  { id:'s8', name:'Halima Yakubu', email:'halima.yakubu@bluepairhotel.com', phone:'+234 812 774 3390', role:'Restaurant Staff', department:'Blue Pair Restaurant', status:'active', joined:'2023-08-15' },
  { id:'s9', name:'Chidi Anyanwu', email:'chidi.anyanwu@bluepairhotel.com', phone:'+234 809 118 2245', role:'Bar Staff', department:'Main Bar', status:'active', joined:'2024-01-10' },
  { id:'s10', name:'Funmilayo Adisa', email:'funmi.adisa@bluepairhotel.com', phone:'+234 701 556 8842', role:'Accountant', department:'Finance', status:'disabled', joined:'2019-11-05' },
]

export const rolePermissions: Record<string, { section: string; allowed: boolean }[]> = {
  'Super Admin': [{section:'Everything',allowed:true}],
  'Manager': [
    {section:'Dashboard & Reports',allowed:true},{section:'Room & Booking Management',allowed:true},
    {section:'Staff Management',allowed:true},{section:'Payments',allowed:true},{section:'Website/CMS',allowed:true},
  ],
  'Reception': [
    {section:'Arrivals & Departures',allowed:true},{section:'Check-in / Check-out',allowed:true},
    {section:'Room Assignment',allowed:true},{section:'Guest Requests',allowed:true},
    {section:'Payments',allowed:false},{section:'Room Pricing',allowed:false},{section:'Staff Management',allowed:false},
  ],
  'Housekeeping': [
    {section:'View assigned rooms',allowed:true},{section:'Update cleaning status',allowed:true},
    {section:'Payments',allowed:false},{section:'Revenue',allowed:false},{section:'Room pricing',allowed:false},{section:'Customer deletion',allowed:false},
  ],
  'Maintenance': [
    {section:'View maintenance tickets',allowed:true},{section:'Update ticket status',allowed:true},
    {section:'Payments',allowed:false},{section:'Bookings',allowed:false},{section:'Room pricing',allowed:false},
  ],
  'Restaurant Staff': [
    {section:'Menu Management',allowed:true},{section:'Order queue',allowed:true},
    {section:'Payments',allowed:false},{section:'Room Management',allowed:false},
  ],
  'Bar Staff': [
    {section:'Drink Management',allowed:true},{section:'Order queue',allowed:true},
    {section:'Payments',allowed:false},{section:'Room Management',allowed:false},
  ],
  'Accountant': [
    {section:'Payments',allowed:true},{section:'Revenue Reports',allowed:true},
    {section:'Room Management',allowed:false},{section:'Staff Management',allowed:false},
  ],
}

// ---------------- RESTAURANT / BAR ----------------
export const menuItems: MenuItem[] = [
  { id:'m1', outlet:'Blue Pair Restaurant', category:'Starters', name:'Peppered Snail', price:8500, image:'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=500&q=80', available:true },
  { id:'m2', outlet:'Blue Pair Restaurant', category:'Mains', name:'Grilled Tilapia & Jollof', price:14500, image:'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80', available:true },
  { id:'m3', outlet:'Blue Pair Restaurant', category:'Mains', name:'Native Jollof with Turkey', price:13000, image:'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=500&q=80', available:true },
  { id:'m4', outlet:'Blue Pair Restaurant', category:'Soups', name:'Afang Soup & Pounded Yam', price:11500, image:'https://images.unsplash.com/photo-1600335895229-6e75511892c8?auto=format&fit=crop&w=500&q=80', available:true },
  { id:'m5', outlet:'Blue Pair Restaurant', category:'Desserts', name:'Chin Chin & Ice Cream', price:5000, image:'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=500&q=80', available:true },
  { id:'m6', outlet:'Outdoor Bar & Eatery', category:'Small Chops', name:'Suya Platter', price:9500, image:'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=500&q=80', available:true },
  { id:'m7', outlet:'Outdoor Bar & Eatery', category:'Small Chops', name:'Puff Puff & Spring Rolls', price:6000, image:'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=500&q=80', available:true },
  { id:'m8', outlet:'Annex Restaurant', category:'Mains', name:'Ofada Rice & Ayamase', price:12000, image:'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?auto=format&fit=crop&w=500&q=80', available:true },
  { id:'m9', outlet:'Annex Grilling', category:'Grill', name:'Full Chicken Grill', price:16000, image:'https://images.unsplash.com/photo-1598515213692-5f252f9a90a6?auto=format&fit=crop&w=500&q=80', available:true },
  { id:'m10', outlet:'Annex Grilling', category:'Grill', name:'Grilled Fish (Whole)', price:15000, image:'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=500&q=80', available:false },
]

export const drinks: Drink[] = [
  { id:'d1', bar:'Main Bar', category:'Whisky', name:'Hennessy VS (Bottle)', price:85000, available:true },
  { id:'d2', bar:'Main Bar', category:'Champagne', name:'Moët & Chandon', price:120000, available:true },
  { id:'d3', bar:'Main Bar', category:'Beer', name:'Star Lager', price:2000, available:true },
  { id:'d4', bar:'VIP Bar', category:'Whisky', name:'Johnnie Walker Blue Label', price:250000, available:true },
  { id:'d5', bar:'VIP Bar', category:'Champagne', name:'Dom Pérignon', price:450000, available:true },
  { id:'d6', bar:'Outdoor Bar', category:'Beer', name:'Guinness Foreign Extra', price:2200, available:true },
  { id:'d7', bar:'Outdoor Bar', category:'Cocktails', name:'Chapman', price:4500, available:true },
  { id:'d8', bar:'Annex Bar', category:'Beer', name:'Heineken', price:2500, available:true },
  { id:'d9', bar:'Annex Bar', category:'Spirits', name:'Smirnoff Vodka', price:22000, available:false },
]

// ---------------- SHORT-LETS ----------------
export const shortLets: ShortLet[] = [
  { id:'sl1', name:'Annex 2-Bed Apartment', type:'Apartment', price:110000, bedrooms:2, amenities:['Full kitchen','WiFi','Generator backup','Parking'], image:'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80', available:true, description:'A self-contained two-bedroom apartment within the Annex, ideal for extended stays and small families.' },
  { id:'sl2', name:'Annex Studio Short-let', type:'Studio', price:65000, bedrooms:1, amenities:['Kitchenette','WiFi','Generator backup'], image:'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80', available:true, description:'A compact, well-furnished studio suited to solo travellers and short business trips.' },
  { id:'sl3', name:'Annex 3-Bed Duplex', type:'Duplex', price:180000, bedrooms:3, amenities:['Full kitchen','WiFi','Private compound','Generator backup','Parking'], image:'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=900&q=80', available:false, description:'A private duplex with its own compound, best for families or groups travelling together.' },
]

// ---------------- EVENTS ----------------
export const events: EventItem[] = [
  { id:'e1', title:'Blue Pair Owambe Night', date:'2026-08-22', price:25000, capacity:200, image:'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=900&q=80', description:'A live band, open bar, and small chops through the night on the Club terrace.', published:true },
  { id:'e2', title:'Sunday Pool Brunch', date:'2026-08-16', price:15000, capacity:80, image:'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=900&q=80', description:'Bottomless brunch by the indoor pool, every Sunday from 11am.', published:true },
  { id:'e3', title:'Corporate Gala Dinner', date:'2026-09-05', price:40000, capacity:150, image:'https://images.unsplash.com/photo-1519167758481-83f29c8e8de8?auto=format&fit=crop&w=900&q=80', description:'A black-tie evening in the Grand Hall, catered by the Blue Pair Restaurant team.', published:false },
]

// ---------------- MAINTENANCE ----------------
export const maintenanceTickets: MaintenanceTicket[] = [
  { id:'mt1', room:'205', issue:'Air conditioner not cooling', priority:'High', assignedTo:'Emeka Nnamdi', dateReported:'2026-08-08', status:'in_progress', notes:'Technician confirmed gas refill needed, parts ordered.' },
  { id:'mt2', room:'204', issue:'Bathroom tap leaking', priority:'Medium', assignedTo:'Emeka Nnamdi', dateReported:'2026-08-07', status:'open', notes:'' },
  { id:'mt3', room:'110', issue:'TV remote not pairing', priority:'Low', assignedTo:'Emeka Nnamdi', dateReported:'2026-08-05', status:'resolved', notes:'Replaced batteries and re-paired. Confirmed working.' },
  { id:'mt4', room:'302', issue:'Door lock sticking', priority:'Medium', assignedTo:'Emeka Nnamdi', dateReported:'2026-08-06', status:'open', notes:'' },
]

// ---------------- HOUSEKEEPING ----------------
export const housekeepingTasks: HousekeepingTask[] = [
  { id:'hk1', room:'103', roomType:'Standard Room', checkoutTime:'11:00 AM', priority:'High', assignedTo:'Musa Danladi', status:'pending', notes:'Guest requested extra towels before checkout.' },
  { id:'hk2', room:'204', roomType:'Executive Room', checkoutTime:'12:00 PM', priority:'Medium', assignedTo:'Musa Danladi', status:'pending', notes:'' },
  { id:'hk3', room:'201', roomType:'Deluxe Room', checkoutTime:'10:30 AM', priority:'Medium', assignedTo:'Patience Nwachukwu', status:'in_progress', notes:'Started 10:45am.' },
  { id:'hk4', room:'108', roomType:'Standard Room', checkoutTime:'09:15 AM', priority:'Low', assignedTo:'Patience Nwachukwu', status:'completed', notes:'', completedAt:'2026-08-09 10:02 AM' },
]

// ---------------- BILLBOARD / PARKING ----------------
export const billboards: BillboardSpace[] = [
  { id:'bb1', location:'Main Entrance Gate', dimensions:'20ft x 10ft', price:450000, image:'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=900&q=80', available:true },
  { id:'bb2', location:'Poolside Wall', dimensions:'12ft x 8ft', price:280000, image:'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80', available:true },
  { id:'bb3', location:'Event Hall Entrance', dimensions:'15ft x 9ft', price:320000, image:'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=900&q=80', available:false },
]

export const parkingZones: ParkingZone[] = [
  { id:'pz1', name:'Main Lot', type:'Standard', capacity:60, occupied:41 },
  { id:'pz2', name:'VIP Courtyard', type:'VIP', capacity:15, occupied:9 },
  { id:'pz3', name:'Annex Lot', type:'Standard', capacity:30, occupied:12 },
]

// ---------------- PAYMENTS ----------------
export const payments: Payment[] = [
  { id:'p1', reference:'PAY-88213', bookingRef:'BPH-24917', customer:'Adaeze Okonkwo', amount:1680000, method:'Paystack', status:'success', date:'2026-08-01' },
  { id:'p2', reference:'PAY-88214', bookingRef:'BPH-24918', customer:'Chukwuemeka Eze', amount:270000, method:'Card', status:'success', date:'2026-08-02' },
  { id:'p3', reference:'PAY-88215', bookingRef:'BPH-24919', customer:'Fatima Bello', amount:190000, method:'Bank Transfer', status:'pending', date:'2026-08-05' },
  { id:'p4', reference:'PAY-88216', bookingRef:'BPH-24920', customer:'Oluwaseun Adebayo', amount:260000, method:'Paystack', status:'success', date:'2026-08-03' },
  { id:'p5', reference:'PAY-88217', bookingRef:'BPH-24922', customer:'Amaka Nwosu', amount:350000, method:'Card', status:'refunded', date:'2026-07-30' },
]

// ---------------- OFFERS ----------------
export const offers: Offer[] = [
  { id:'o1', title:'Stay 3, Pay for 2', description:'Valid on Deluxe rooms and above, any weekday.', discount:'33% off 3rd night', category:'Room', active:true },
  { id:'o2', title:'VIP Suite Weekend Package', description:'Includes airport pickup and a bottle of champagne.', discount:'\u20a650,000 value included', category:'Package', active:true },
  { id:'o3', title:'Restaurant Happy Hour', description:'20% off all mains, 5pm–7pm daily.', discount:'20% off', category:'Restaurant', active:true },
  { id:'o4', title:'Detty December Early Bird', description:'Book December stays before October for a flat discount.', discount:'15% off', category:'Seasonal', active:false },
]

export const galleryImages: string[] = [
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1519167758481-83f29c8e8de8?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80',
]
