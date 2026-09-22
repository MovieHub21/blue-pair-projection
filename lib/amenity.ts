import { getAmenity } from './data'
import type { AmenityConfig } from '../components/ui/AmenityPage'

/**
 * Loads an amenity record from the database and merges it over the static
 * fallback copy, so admin edits (text and uploaded photos) show on the website.
 */
export async function resolveAmenityConfig(key: string, fallback: AmenityConfig): Promise<AmenityConfig> {
  const a = await getAmenity(key)
  if (!a) return fallback
  return {
    ...fallback,
    name: fallback.name,
    eyebrow:fallback.eyebrow,
    heroImage: fallback.heroImage,
    description: fallback.description,
    gallery:  fallback.gallery,
    hours: fallback.hours,
    facilities:  fallback.facilities,
    pricingNote: fallback.pricingNote,
    ctaLabel:  fallback.ctaLabel,
  }
}
