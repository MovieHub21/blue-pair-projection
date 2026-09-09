import { buildMetadata } from '../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../components/JsonLd'
import { SITE_URL } from '../../../lib/siteConfig'
import PageHero from '../../../components/layout/PageHero'
import DiningClient from './DiningClient'

export const metadata = buildMetadata({
  title: 'Best Restaurant & Bar in Uromi, Edo State | Blue Pair Dining',
  description: 'Dine at Blue Pair Restaurant and the Outdoor Bar & Eatery — Nigerian and continental cuisine in Uromi, Edo State. View the menu and prices.',
  keywords: 'restaurant uromi, best restaurant edo state, blue pair restaurant menu, outdoor bar uromi, restaurant near me uromi',
  path: '/dining',
})

const breadcrumbs = [{name:'Home',path:'/'},{name:'Dining',path:'/dining'}]
const restaurantJsonLd = {
  '@context': 'https://schema.org', '@type': 'Restaurant', name: 'Blue Pair Restaurant',
  servesCuisine: ['Nigerian', 'Continental'], priceRange: '₦₦₦',
  address: { '@type': 'PostalAddress', streetAddress: 'Auchi Road', addressLocality: 'Uromi', addressRegion: 'Edo State', addressCountry: 'NG' },
  openingHours: 'Mo-Su 07:00-23:00',
}

export default function DiningPage() {
  return (
    <div>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs, SITE_URL), restaurantJsonLd]} />
      <PageHero image="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80"
        eyebrow="Food & drink" title="Dining at Blue Pair" crumbs="Home / Dining" height="h-80" />
      <DiningClient />
    </div>
  )
}
