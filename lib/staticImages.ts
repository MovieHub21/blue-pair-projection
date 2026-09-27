export type CodeImageSet = {
  hero: string
  gallery: string[]
}

/**
 * Images that are owned by the application rather than the admin database.
 *
 * Put local files in /public and reference them here, e.g.
 *   hero: '/images/amenities/gym/hero.webp'
 *   gallery: ['/images/amenities/gym/1.webp', '/images/amenities/gym/2.webp']
 *
 * A gallery can contain as many images as needed. The first image is the
 * primary/hero image when a page needs one.
 */
export const CODE_AMENITY_IMAGES: Record<string, CodeImageSet> = {
  gym: {
    hero: '/blue-pair-gym.jpeg',
    gallery: [
      '/blue-pair-gym.jpeg',
      'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80',
    ],
  },
  pool: {
    hero: '/blue-pair-pool.jpeg',
    gallery: ['/blue-pair-pool.jpeg'],
  },
  club: {
    hero: '/CLUB2.jpg',
    gallery: [
      '/CLUB2.jpg',
      'https://images.unsplash.com/photo-1470229722913-7ea0d7ea3d0f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=80',
    ],
  },
  games: {
    hero: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1615117972428-52295aeb3c99?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1595326953832-6f9d3f39e4e7?auto=format&fit=crop&w=900&q=80',
    ],
  },
  'vip-lounge': {
    hero: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=900&q=80',
    ],
  },
  'smoking-area': {
    hero: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1521401830884-6c03c1c87ebb?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=900&q=80',
    ],
  },

  // Annex content is intentionally listed here as code-owned slots.
  // Replace the empty strings with /public paths when the final Annex
  // photography is added to the repository. Until then the existing
  // database image is retained as a non-destructive fallback.
  'annex-home': { hero: '', gallery: [] },
  'annex-bar': { hero: '', gallery: [] },
  'annex-grilling': { hero: '', gallery: [] },
  'annex-outdoor-eatery': { hero: '', gallery: [] },
  'annex-restaurant': { hero: '', gallery: [] },
  'annex-vip-lounge': { hero: '', gallery: [] },
}

/**
 * Code-owned short-let photography.
 *
 * Keep property data (name, price, availability, bookings, etc.) in Supabase.
 * Only the photography is defined here. Add as many paths as the property needs.
 */
export const CODE_SHORTLET_IMAGES: Record<string, string[]> = {
  sl1: [
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80',
  ],
  sl2: [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80',
  ],
  sl3: [
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=900&q=80',
  ],
}

export function getCodeAmenityImages(key: string): CodeImageSet | null {
  const set = CODE_AMENITY_IMAGES[key]
  if (!set || (!set.hero && set.gallery.length === 0)) return null
  return set
}

export function getCodeShortLetImages(id: string): string[] | null {
  const images = CODE_SHORTLET_IMAGES[id]
  return images?.length ? images : null
}
