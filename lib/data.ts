import { unstable_cache } from 'next/cache'
import { createSupabasePublicClient } from './supabase/server'
import { hasPublicListingName } from './publicContent'
import {
  mapRoomType, mapRoom, mapMenuItem, mapDrink, mapShortLet, mapEvent,
  mapBillboard, mapParkingZone, mapOffer, mapGalleryImage, mapAmenity,
} from './mappers'

const readSiteContent = unstable_cache(async () => {
  const db = createSupabasePublicClient()
  const { data } = await db.from('site_content').select('key,value')
  const map: Record<string, string> = {}
  for (const row of data ?? []) map[row.key] = row.value
  return map
}, ['public-site-content-v1'], { revalidate: 60 })

const readOffers = unstable_cache(async (activeOnly: boolean) => {
  const db = createSupabasePublicClient()
  let query = db.from('offers').select('*').order('title')
  if (activeOnly) query = query.eq('active', true)
  const { data } = await query
  return (data ?? []).map(mapOffer)
}, ['public-offers-v1'], { revalidate: 60 })

const readGalleryImages = unstable_cache(async () => {
  const db = createSupabasePublicClient()
  const { data } = await db.from('gallery_images').select('*').order('sort_order')
  return (data ?? []).map(mapGalleryImage)
}, ['public-gallery-v1'], { revalidate: 60 })

const readAmenity = unstable_cache(async (key: string) => {
  const db = createSupabasePublicClient()
  const { data } = await db.from('amenities').select('*').eq('key', key).maybeSingle()
  return data ? mapAmenity(data) : null
}, ['public-amenity-v1'], { revalidate: 60 })

const readPublishedAmenities = unstable_cache(async (prefix: string | null) => {
  const db = createSupabasePublicClient()
  let query = db.from('amenities').select('*').eq('published', true).order('name')
  if (prefix) query = query.like('key', `${prefix}%`)
  const { data } = await query
  return (data ?? []).map(mapAmenity)
}, ['public-published-amenities-v1'], { revalidate: 60 })

// These cached reads are for displaying the menu/catalog only. Order APIs
// re-read current prices and availability before accepting any purchase.
const readMenuItems = unstable_cache(async () => {
  const db = createSupabasePublicClient()
  const { data } = await db.from('menu_items').select('*').order('name')
  return (data ?? []).map(mapMenuItem)
}, ['public-menu-items-v1'], { revalidate: 60 })

const readDrinks = unstable_cache(async () => {
  const db = createSupabasePublicClient()
  const { data } = await db.from('drinks').select('*').order('name')
  return (data ?? []).map(mapDrink)
}, ['public-drinks-v1'], { revalidate: 60 })

export async function getRoomTypes() {
  const db = createSupabasePublicClient()
  const { data } = await db.from('room_types').select('*').order('price')
  return (data ?? []).map(mapRoomType)
}
export async function getActiveRoomTypes() { return (await getRoomTypes()).filter(r => r.active) }
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
export async function getRoomsByType(roomTypeId: string) {
  const db = createSupabasePublicClient()
  const { data } = await db.from('rooms').select('*').eq('room_type_id', roomTypeId).order('room_number')
  return data ?? []
}
export async function getRoomBySlug(roomTypeId: string, slug: string) {
  const db = createSupabasePublicClient()
  const { data } = await db.from('rooms').select('*').eq('room_type_id', roomTypeId).eq('slug', slug).maybeSingle()
  return data ?? null
}
export async function getMenuItems() { return readMenuItems() }
export async function getDrinks() { return readDrinks() }
export async function getShortLets() { const db=createSupabasePublicClient(); const {data}=await db.from('short_lets').select('*').order('price'); return (data??[]).map(mapShortLet) }
export async function getPublicShortLets() { return (await getShortLets()).filter(s => hasPublicListingName(s.name)) }
export async function getEvents(publishedOnly=true) { const db=createSupabasePublicClient(); let q=db.from('events').select('*').order('date'); if(publishedOnly) q=q.eq('published',true); const {data}=await q; return (data??[]).map(mapEvent) }
export async function getBillboards() { const db=createSupabasePublicClient(); const {data}=await db.from('billboards').select('*').order('price',{ascending:false}); return (data??[]).map(mapBillboard) }
export async function getParkingZones() { const db=createSupabasePublicClient(); const {data}=await db.from('parking_zones').select('*').order('name'); return (data??[]).map(mapParkingZone) }
export async function getOffers(activeOnly = false) { return readOffers(activeOnly) }
export async function getGalleryImages() { return readGalleryImages() }
export async function getAmenity(key: string) { return readAmenity(key) }
export async function getPublishedAmenities(prefix?: string) { return readPublishedAmenities(prefix ?? null) }
export async function getSiteContent() { return readSiteContent() }
