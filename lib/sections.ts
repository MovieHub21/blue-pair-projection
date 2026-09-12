/** Canonical portal sections used by the permissions system (shared client + server). */
export const SECTION_PREFIXES: [prefix: string, section: string][] = [
  ['/admin/dashboard', 'dashboard'],
  ['/admin/bookings', 'bookings'],
  ['/admin/rooms', 'rooms'],
  ['/admin/availability', 'availability'],
  ['/admin/checkins', 'checkins'],
  ['/admin/checkouts', 'checkouts'],
  ['/admin/customers', 'customers'],
  ['/admin/payments', 'payments'],
  ['/admin/restaurant', 'restaurant'],
  ['/admin/menu', 'menu'],
  ['/admin/bar', 'bar'],
  ['/admin/amenities', 'amenities'],
  ['/admin/annex', 'annex'],
  ['/admin/shortlets', 'shortlets'],
  ['/admin/events', 'events'],
  ['/admin/billboards', 'billboards'],
  ['/admin/parking', 'parking'],
  ['/admin/offers', 'offers'],
  ['/admin/gallery', 'gallery'],
  ['/admin/website', 'website'],
  ['/admin/blog', 'blog'],
  ['/admin/seo', 'seo'],
  ['/admin/staff', 'staff'],
  ['/admin/permissions', 'permissions'],
  ['/admin/reports', 'reports'],
  ['/reception', 'reception'],
  ['/housekeeping', 'housekeeping'],
  ['/maintenance', 'maintenance'],
]

export function sectionForPath(pathname: string): string | null {
  const hit = SECTION_PREFIXES.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix + '/'))
  if (hit) return hit[1]
  if (pathname === '/admin' || pathname === '/admin/') return 'dashboard'
  return null
}

export const APP_ROLES = [
  'super_admin', 'manager', 'reception', 'housekeeping', 'maintenance', 'restaurant', 'bar', 'accountant',
] as const
export type AppRoleKey = typeof APP_ROLES[number]

export const ROLE_LABELS: Record<AppRoleKey, string> = {
  super_admin: 'Super Admin', manager: 'Manager', reception: 'Reception',
  housekeeping: 'Housekeeping', maintenance: 'Maintenance', restaurant: 'Restaurant Staff',
  bar: 'Bar Staff', accountant: 'Accountant',
}

export function roleKeyFromLabel(label: string): AppRoleKey {
  const entry = (Object.entries(ROLE_LABELS) as [AppRoleKey, string][]).find(([, l]) => l === label)
  return entry ? entry[0] : 'reception'
}
