import { getAmenity } from './data'
import type { AmenityConfig } from '../components/ui/AmenityPage'
import { getCodeAmenityImages } from './staticImages'

/**
 * Loads editable amenity copy from the database while keeping photography in the
 * application code. The code image set overrides the fallback when configured.
 */
export async function resolveAmenityConfig(key: string, fallback: AmenityConfig): Promise<AmenityConfig> {
  const a = await getAmenity(key)
  if (!a) {
    const codeImages = getCodeAmenityImages(key)
    return codeImages ? { ...fallback, heroImage: codeImages.hero, gallery: codeImages.gallery } : fallback
  }
  const codeImages = getCodeAmenityImages(key)
  return {
    ...fallback,
    name: fallback.name,
    eyebrow:fallback.eyebrow,
    mini:fallback.mini,
    heroImage: codeImages?.hero || fallback.heroImage,
    description: fallback.description,
    gallery:  codeImages?.gallery?.length ? codeImages.gallery : fallback.gallery,
    hours: fallback.hours,
    facilities:  fallback.facilities,
    pricingNote: fallback.pricingNote,
    ctaLabel:  fallback.ctaLabel,
  }
}
