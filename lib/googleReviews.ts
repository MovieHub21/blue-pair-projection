import { SITE_ADDRESS_DISPLAY, SITE_NAME } from './siteConfig'

export type GoogleReview = {
  id: string
  rating: number
  text: string
  author: string
  authorUrl?: string
  photoUrl?: string
  published: string
  googleMapsUri: string
}

export type GoogleReviewsData = {
  rating: number | null
  reviewCount: number | null
  placeName: string
  googleMapsUri: string
  reviews: GoogleReview[]
}

export function getGoogleReviewUrl() {
  return process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL?.trim() || googleMapsSearchUrl()
}

export function getGoogleMapsProfileUrl() {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_URL?.trim() || googleMapsSearchUrl()
}

function googleMapsSearchUrl() {
  const query = encodeURIComponent(`${SITE_NAME}, ${SITE_ADDRESS_DISPLAY}`)
  return `https://www.google.com/maps/search/?api=1&query=${query}`
}

export async function getGoogleReviews(): Promise<GoogleReviewsData | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim()
  const placeId = process.env.GOOGLE_PLACE_ID?.trim()
  if (!apiKey || !placeId) return null

  try {
    const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'id,displayName,rating,userRatingCount,googleMapsUri,reviews.name,reviews.rating,reviews.text,reviews.relativePublishTimeDescription,reviews.authorAttribution,reviews.googleMapsUri',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(4500),
    })
    if (!response.ok) {
      console.error('[google-reviews] Places API returned', response.status)
      return null
    }

    const place = await response.json()
    const fallbackMapsUri = place.googleMapsUri || googleMapsSearchUrl()
    return {
      rating: typeof place.rating === 'number' ? place.rating : null,
      reviewCount: typeof place.userRatingCount === 'number' ? place.userRatingCount : null,
      placeName: place.displayName?.text || SITE_NAME,
      googleMapsUri: fallbackMapsUri,
      reviews: (place.reviews || []).map((review: any, index: number) => ({
        id: review.name || `${place.id}-${index}`,
        rating: Number(review.rating) || 0,
        text: review.text?.text || review.originalText?.text || '',
        author: review.authorAttribution?.displayName || 'Google Maps user',
        authorUrl: review.authorAttribution?.uri,
        photoUrl: review.authorAttribution?.photoUri,
        published: review.relativePublishTimeDescription || '',
        googleMapsUri: review.googleMapsUri || fallbackMapsUri,
      })).filter((review: GoogleReview) => review.rating > 0 && review.text),
    }
  } catch (error) {
    console.error('[google-reviews] Unable to load Google reviews', error)
    return null
  }
}
