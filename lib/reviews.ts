import { createSupabasePublicClient } from './supabase/server'

export type GuestReview = {
  id: string
  user_id: string
  booking_id: string
  rating: number
  title: string | null
  review: string
  keywords: string[]
  published: boolean
  published_at: string | null
  created_at: string
}

const stopWords = new Set('a an and are as at be been but by for from had has have he her hotel i in is it its me my of on our that the their them they this to was we were with you your very so stay stayed room rooms'.split(' '))
const hotelTerms = ['hotel', 'uromi', 'edo state', 'room', 'suite', 'restaurant', 'dining', 'pool', 'gym', 'staff', 'service', 'hospitality', 'breakfast', 'clean', 'cleanliness', 'comfortable', 'location', 'parking', 'events', 'event', 'lounge', 'food', 'bar', 'value']

export function extractReviewKeywords(text: string) {
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ')
  const words = normalized.split(/\s+/).filter(Boolean)
  const counts = new Map<string, number>()
  for (const word of words) {
    if (word.length < 4 || stopWords.has(word) || /^\d+$/.test(word)) continue
    counts.set(word, (counts.get(word) || 0) + 1)
  }
  const candidates = [...counts.entries()].sort((a, b) => {
    const aBoost = hotelTerms.includes(a[0]) ? 3 : 0
    const bBoost = hotelTerms.includes(b[0]) ? 3 : 0
    return (b[1] + bBoost) - (a[1] + aBoost)
  }).map(([word]) => word)
  const phrases = hotelTerms.filter(term => normalized.includes(term)).slice(0, 3)
  return [...new Set([...phrases, ...candidates])].slice(0, 6)
}

export async function getPublishedGuestReviews(limit = 8) {
  const db = createSupabasePublicClient()
  const { data } = await db.from('guest_reviews').select('id,user_id,booking_id,rating,title,review,keywords,published,published_at,created_at').eq('published', true).order('created_at', { ascending: false }).limit(limit)
  return (data ?? []) as GuestReview[]
}
