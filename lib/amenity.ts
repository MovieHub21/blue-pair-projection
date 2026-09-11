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
    name: a.name || fallback.name,
    eyebrow: a.eyebrow || fallback.eyebrow,
    heroImage: a.heroImage || fallback.heroImage,
    description: a.description || fallback.description,
    gallery: a.gallery?.length ? a.gallery : fallback.gallery,
    hours: a.hours || fallback.hours,
    facilities: a.facilities?.length ? a.facilities : fallback.facilities,
    pricingNote: a.pricingNote || fallback.pricingNote,
    ctaLabel: a.ctaLabel || fallback.ctaLabel,
  }
}
