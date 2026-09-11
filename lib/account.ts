import { cache } from 'react'
import { createSupabaseServerClient } from './supabase/server'
import { mapBooking, mapPayment, mapGuestRequest, mapRoomType } from './mappers'

/**
 * Signed-in user + their profile row, or null if not authenticated.
 * Wrapped in React's cache() so repeated calls within the same request
 * (dashboard fetching bookings + payments + requests in parallel) share
 * one auth check + one profile query instead of firing it every time.
 */
export const getCurrentUser = cache(async () => {
  const db = createSupabaseServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { user: null, profile: null }
  const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).maybeSingle()
  return { user, profile: profile ?? null }
})

/** The `customers` row linked to the signed-in user, creating one if it doesn't exist yet. Request-memoized. */
export const getMyCustomer = cache(async () => {
  const { user, profile } = await getCurrentUser()
  if (!user) return null
  const db = createSupabaseServerClient()
  const { data: existing } = await db.from('customers').select('*').eq('user_id', user.id).maybeSingle()
  if (existing) return existing as any

  const id = `c_${Date.now()}`
  const { data: created } = await db.from('customers').insert({
    id, user_id: user.id, name: profile?.name || user.email || 'Guest',
    email: profile?.email || user.email || '', phone: profile?.phone || '',
  }).select('*').maybeSingle()
  return created as any
})

export async function getMyBookings() {
  const customer = await getMyCustomer()
  if (!customer) return []
  const db = createSupabaseServerClient()
  const { data } = await db.from('bookings').select('*, room_types(*), rooms(room_number)').eq('customer_id', customer.id).order('created_at', { ascending: false })
  return (data ?? []).map((r: any) => ({ ...mapBooking(r), room: r.room_types ? mapRoomType(r.room_types) : null, roomNumber: r.rooms?.room_number ?? null }))
}

export async function getMyPayments() {
  const customer = await getMyCustomer()
  if (!customer) return []
  const db = createSupabaseServerClient()
  const { data: bookings } = await db.from('bookings').select('reference').eq('customer_id', customer.id)
  const refs = (bookings ?? []).map((b: any) => b.reference)
  if (!refs.length) return []
  const { data } = await db.from('payments').select('*').in('booking_ref', refs).order('date', { ascending: false })
  return (data ?? []).map(mapPayment)
}

export async function getMyGuestRequests() {
  const customer = await getMyCustomer()
  if (!customer) return []
  const db = createSupabaseServerClient()
  const { data } = await db.from('guest_requests').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false })
  return (data ?? []).map(mapGuestRequest)
}
