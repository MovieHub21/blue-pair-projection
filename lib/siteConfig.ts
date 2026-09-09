// Central place for the site's public identity — update SITE_URL once you
// have a real domain and every canonical/OG/sitemap/JSON-LD address follows
// from here. This is also the single source of truth to keep NAP (Name,
// Address, Phone) consistent between the website and your Google Business
// Profile — mismatched NAP is one of the most common reasons a local
// listing fails to rank.
export const SITE_NAME = 'Blue Pair Hotel'
export const SITE_URL = 'https://www.bluepairhotel.com' // ← replace with the live domain
export const DEFAULT_OG_IMAGE = 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80'
export const SITE_PHONE = '+234-901-234-5678'
export const SITE_PHONE_DISPLAY = '+234 901 234 5678'
export const SITE_EMAIL = 'reservations@bluepairhotel.com'

export const SITE_ADDRESS = {
  street: 'Auchi Road',
  locality: 'Uromi',
  region: 'Edo State',
  postalCode: '310107',
  country: 'NG',
}
export const SITE_ADDRESS_DISPLAY = 'Auchi Road, Uromi, Edo State'
export const SITE_GEO = { lat: 6.7000, lng: 6.3333 }
export const SITE_LGA = 'Esan North-East'
export const NEARBY_TOWNS = ['Ekpoma', 'Auchi', 'Ubiaja', 'Benin City']

// Keyword building blocks — reused across page metadata so every page can
// combine "what" (room/gym/pool/club/...) with "where" (Uromi / Edo State /
// Esan North-East / nearby towns), matching how people actually search
// ("hotel in Uromi", "hotel with pool Edo State", "hotel near Ekpoma").
export const LOCATION_TERMS = ['Uromi', 'Edo State', 'Esan North-East', 'Uromi Edo State']
