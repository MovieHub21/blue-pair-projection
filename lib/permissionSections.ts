export const PATH_SECTIONS: { prefix: string; section: string }[] = [
  { prefix: '/admin/dashboard', section: 'dashboard' },
  { prefix: '/admin/bookings', section: 'bookings' },
  { prefix: '/admin/rooms', section: 'rooms' },
  { prefix: '/admin/availability', section: 'availability' },
  { prefix: '/admin/checkins', section: 'checkins' },
  { prefix: '/admin/checkouts', section: 'checkouts' },
  { prefix: '/admin/customers', section: 'customers' },
  { prefix: '/admin/payments', section: 'payments' },
  { prefix: '/admin/restaurant', section: 'restaurant' },
  { prefix: '/admin/menu', section: 'menu' },
  { prefix: '/admin/bar', section: 'bar' },
  { prefix: '/admin/amenities', section: 'amenities' },
  { prefix: '/admin/annex', section: 'annex' },
  { prefix: '/admin/shortlets', section: 'shortlets' },
  { prefix: '/admin/events', section: 'events' },
  { prefix: '/admin/billboards', section: 'billboards' },
  { prefix: '/admin/parking', section: 'parking' },
  { prefix: '/admin/offers', section: 'offers' },
  { prefix: '/admin/gallery', section: 'gallery' },
  { prefix: '/admin/website', section: 'website' },
  { prefix: '/admin/seo', section: 'seo' },
  { prefix: '/admin/staff', section: 'staff' },
  { prefix: '/admin/permissions', section: 'permissions' },
  { prefix: '/admin/reports', section: 'reports' },
  { prefix: '/housekeeping', section: 'housekeeping' },
  { prefix: '/maintenance', section: 'maintenance' },
  { prefix: '/reception', section: 'reception' },
]

/** Longest-prefix match, so /admin/amenities/gym resolves to the 'amenities' section, not a partial /admin match. */
export function sectionForPath(pathname: string): string | null {
  const match = PATH_SECTIONS.filter(p => pathname.startsWith(p.prefix)).sort((a, b) => b.prefix.length - a.prefix.length)[0]
  return match?.section ?? null
}

/** Sections every signed-in staff member can reach regardless of restrictions, so no one gets locked out entirely. */
export const ALWAYS_ALLOWED_SECTIONS = new Set(['dashboard'])
