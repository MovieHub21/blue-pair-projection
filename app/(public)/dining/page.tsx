import { buildMetadata } from '../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../components/JsonLd'
import { SITE_URL } from '../../../lib/siteConfig'
import { getMenuItems } from '../../../lib/data'
import DiningClient from './DiningClient'
import type { MenuItem } from '../../../data/mock'

export const metadata = buildMetadata({
  title: 'Restaurant & Bar in Uromi, Edo State | Blue Pair Dining',
  description: 'Explore dining at Blue Pair Hotel in Uromi, Edo State, with Nigerian and continental dishes, an outdoor eatery and drinks menu.',
  keywords: 'restaurant uromi, restaurant edo state, blue pair restaurant, outdoor bar uromi, dining uromi, food menu uromi',
  path: '/dining',
})

const breadcrumbs = [{ name: 'Home', path: '/' }, { name: 'Dining', path: '/dining' }]

const restaurantJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  '@id': `${SITE_URL}/dining#restaurant`,
  name: 'Blue Pair Restaurant',
  url: `${SITE_URL}/dining`,
  servesCuisine: ['Nigerian', 'Continental'],
}

// Lets search engines read the menu: each course as a section, each dish with its price in naira.
function menuJsonLd(outlet: MenuItem['outlet'], items: MenuItem[]) {
  const sections = new Map<string, MenuItem[]>()
  for (const item of items) {
    if (item.outlet !== outlet || !item.available) continue
    const course = item.category?.trim() || 'House selection'
    sections.set(course, [...(sections.get(course) ?? []), item])
  }
  if (sections.size === 0) return undefined
  return {
    '@type': 'Menu',
    name: `${outlet} menu`,
    hasMenuSection: Array.from(sections.entries()).map(([name, list]) => ({
      '@type': 'MenuSection',
      name,
      hasMenuItem: list.map(item => ({ '@type': 'MenuItem', name: item.name, offers: { '@type': 'Offer', price: String(item.price), priceCurrency: 'NGN' } })),
    })),
  }
}

export default async function DiningPage() {
  const menuItems = await getMenuItems()
  const restaurantMenu = menuJsonLd('Blue Pair Restaurant', menuItems)
  const outdoorMenu = menuJsonLd('Outdoor Bar & Eatery', menuItems)

  return (
    <div>
      <JsonLd data={[
        breadcrumbJsonLd(breadcrumbs, SITE_URL),
        { ...restaurantJsonLd, ...(restaurantMenu ? { hasMenu: restaurantMenu } : {}) },
        ...(outdoorMenu ? [{ '@context': 'https://schema.org', '@type': 'Restaurant', '@id': `${SITE_URL}/dining#outdoor-bar-eatery`, name: 'Outdoor Bar & Eatery', url: `${SITE_URL}/dining`, hasMenu: outdoorMenu }] : []),
      ]} />
      <DiningClient menuItems={menuItems} />
    </div>
  )
}
