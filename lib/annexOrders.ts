import { getMyCustomer } from './account'
import { createSupabaseAdminClient } from './supabase/admin'

export type AnnexActiveBooking = { id: string; type: 'room' | 'short_let'; label: string; reference: string }

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
    .eq('payment_status', 'paid')
    .lte('check_in', today)
    .gt('check_out', today)
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
