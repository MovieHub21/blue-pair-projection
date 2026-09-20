import { buildMetadata } from '../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../components/JsonLd'
import { SITE_URL } from '../../../lib/siteConfig'
import PageHero from '../../../components/layout/PageHero'
import { getMenuItems } from '../../../lib/data'
import DiningClient from './DiningClient'

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

export default async function DiningPage() {
  const menuItems = await getMenuItems()

  return (
    <div>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs, SITE_URL), restaurantJsonLd]} />
      <PageHero
        image="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80"
        eyebrow="Food & drink"
        title="Dining at Blue Pair"
        crumbs="Home / Dining"
        height="h-80"
      />
      <DiningClient menuItems={menuItems} />
    </div>
  )
}
