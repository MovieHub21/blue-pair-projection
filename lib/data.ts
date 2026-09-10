import { createSupabasePublicClient } from './supabase/server'
import {
  mapRoomType, mapRoom, mapMenuItem, mapDrink, mapShortLet, mapEvent,
  mapBillboard, mapParkingZone, mapOffer,
} from './mappers'

/** Public, server-rendered reads. Kept fresh so admin edits appear on the website. */
export const revalidate = 60

export async function getRoomTypes() {
  const db = createSupabasePublicClient()
  const { data } = await db.from('room_types').select('*').order('price')
  return (data ?? []).map(mapRoomType)
}

export async function getActiveRoomTypes() {
  return (await getRoomTypes()).filter(r => r.active)
}

export async function getRoomTypeBySlug(slug: string) {
  const db = createSupabasePublicClient()
  const { data } = await db.from('room_types').select('*').eq('slug', slug).maybeSingle()
  return data ? mapRoomType(data) : null
}

export async function getRooms() {
  const db = createSupabasePublicClient()
  const { data } = await db.from('rooms').select('*').order('room_number')
  return (data ?? []).map(mapRoom)
}

export async function getMenuItems() {
  const db = createSupabasePublicClient()
  const { data } = await db.from('menu_items').select('*').order('name')
  return (data ?? []).map(mapMenuItem)
}

export async function getDrinks() {
  const db = createSupabasePublicClient()
  const { data } = await db.from('drinks').select('*').order('name')
  return (data ?? []).map(mapDrink)
}

export async function getShortLets() {
  const db = createSupabasePublicClient()
  const { data } = await db.from('short_lets').select('*').order('price')
  return (data ?? []).map(mapShortLet)
}

export async function getEvents(publishedOnly = true) {
  const db = createSupabasePublicClient()
  let q = db.from('events').select('*').order('date')
  if (publishedOnly) q = q.eq('published', true)
  const { data } = await q
  return (data ?? []).map(mapEvent)
}

export async function getBillboards() {
  const db = createSupabasePublicClient()
  const { data } = await db.from('billboards').select('*').order('price', { ascending: false })
  return (data ?? []).map(mapBillboard)
}

export async function getParkingZones() {
  const db = createSupabasePublicClient()
  const { data } = await db.from('parking_zones').select('*').order('name')
  return (data ?? []).map(mapParkingZone)
}

export async function getOffers(activeOnly = false) {
  const db = createSupabasePublicClient()
  let q = db.from('offers').select('*').order('title')
  if (activeOnly) q = q.eq('active', true)
  const { data } = await q
  return (data ?? []).map(mapOffer)
}
