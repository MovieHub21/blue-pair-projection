import { createSupabasePublicClient } from './supabase/server'

export type EventReservation = {
  id: string
  event_id: string
  user_id: string | null
  guest_name: string
  guest_email: string
  guest_phone: string
  guest_count: number
  notes: string | null
  status: 'pending' | 'reserved' | 'declined' | 'cancelled'
  staff_note: string | null
  created_at: string
  updated_at: string
  reserved_at: string | null
  reserved_by: string | null
  event?: { title: string; date: string; price: number; image: string; capacity: number } | null
}

export async function getMyEventReservations() {
  const db = createSupabasePublicClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return [] as EventReservation[]
  const { data } = await db.from('event_reservations').select('*, events(title,date,price,image,capacity)').eq('user_id', user.id).order('created_at', { ascending: false })
  return ((data ?? []) as any[]).map(row => ({ ...row, event: row.events ? { title: row.events.title, date: row.events.date, price: row.events.price, image: row.events.image, capacity: row.events.capacity } : null })) as EventReservation[]
}
