import { getMyCustomer } from './account'
import { createSupabaseAdminClient } from './supabase/admin'
import { getMenuItems, getDrinks } from './data'

export type AnnexActiveBooking = { id: string; type: 'room' | 'short_let'; label: string; reference: string }
export type AnnexOutletKey = 'restaurant' | 'bar' | 'grilling' | 'outdoor_eatery'

export type AnnexOrderItem = {
  id: string
  name: string
  category: string
  price: number
  available: boolean
  image?: string
  outlet: string
  itemType: 'food' | 'drink'
}

export type AnnexMenuData = {
  restaurant: AnnexOrderItem[]
  bar: AnnexOrderItem[]
  grilling: AnnexOrderItem[]
  outdoor_eatery: AnnexOrderItem[]
}

export async function getAnnexMenuData(): Promise<AnnexMenuData> {
  const [menuItems, drinks] = await Promise.all([getMenuItems(), getDrinks()])
  return {
    restaurant: menuItems.filter(item => item.outlet === 'Annex Restaurant').map(item => ({ ...item, outlet: 'Annex Restaurant', itemType: 'food' })),
    bar: drinks.filter(d => d.bar === 'Annex Bar').map(d => ({ ...d, outlet: 'Annex Bar', itemType: 'drink' })),
    grilling: menuItems.filter(item => item.outlet === 'Annex Grilling').map(item => ({ ...item, outlet: 'Annex Grilling', itemType: 'food' })),
    outdoor_eatery: menuItems.filter(item => item.outlet === 'Outdoor Bar & Eatery' || item.outlet === 'Annex Outdoor Eatery').map(item => ({ ...item, outlet: 'Outdoor Eatery', itemType: 'food' })),
  }
}

export async function getAnnexActiveBookings(): Promise<AnnexActiveBooking[]> {
  const customer = await getMyCustomer()
  if (!customer?.id) return []
  const admin = createSupabaseAdminClient()
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })
  const { data: bookings } = await admin
    .from('bookings')
    .select('id,reference,check_in,check_out,status,payment_status,room_id,short_let_id')
    .eq('customer_id', customer.id)
    .in('status', ['confirmed','checked_in'])
    .or(`and(status.eq.checked_in,check_out.gt.${today}),and(status.eq.confirmed,payment_status.eq.paid,check_in.lte.${today},check_out.gt.${today})`)
    .order('check_in', { ascending: false })

  const roomIds = (bookings ?? []).map(b => b.room_id).filter(Boolean)
  const shortLetIds = (bookings ?? []).map(b => b.short_let_id).filter(Boolean)
  const [{ data: rooms }, { data: shortLets }] = await Promise.all([
    roomIds.length ? admin.from('rooms').select('id,room_number').in('id', roomIds) : Promise.resolve({ data: [] as any[] }),
    shortLetIds.length ? admin.from('short_lets').select('id,name').in('id', shortLetIds) : Promise.resolve({ data: [] as any[] }),
  ])

  const result: AnnexActiveBooking[] = []
  for (const booking of bookings ?? []) {
    if (booking.room_id) {
      const room = (rooms ?? []).find(r => r.id === booking.room_id)
      if (room?.room_number) result.push({ id: booking.id, type: 'room', label: `Room ${room.room_number}`, reference: booking.reference })
    } else if (booking.short_let_id) {
      const property = (shortLets ?? []).find(s => s.id === booking.short_let_id)
      if (property?.name) result.push({ id: booking.id, type: 'short_let', label: property.name, reference: booking.reference })
    }
  }
  return result
}
