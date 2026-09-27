import { buildMetadata } from '../../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../../components/JsonLd'
import { SITE_URL } from '../../../../lib/siteConfig'
import { getAmenity } from '../../../../lib/data'
import { getAnnexActiveBookings, getAnnexMenuData } from '../../../../lib/annexOrders'
import AnnexMenuExperience from '../../../../components/annex/AnnexMenuExperience'

const ANNEX_RESTAURANT_IMAGES = [
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=85',
  'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?auto=format&fit=crop&w=1200&q=85',
]

export const metadata = buildMetadata({
  title: 'Annex Restaurant Menu in Uromi, Edo State | Blue Pair Hotel',
  description: 'Explore the Blue Pair Hotel Annex Restaurant menu in Uromi, Edo State, with dishes, categories and prices.',
  keywords: 'annex restaurant uromi, restaurant menu uromi, nigerian food edo state, blue pair annex restaurant, restaurant esan north-east',
  path: '/annex/restaurant',
})

export default async function AnnexRestaurantPage() {
  const [amenity, activeBookings, annexMenu] = await Promise.all([
    getAmenity('annex-restaurant'),
    getAnnexActiveBookings(),
    getAnnexMenuData(),
  ])
  const items = annexMenu.restaurant
  const breadcrumbs = [{ name: 'Home', path: '/' }, { name: 'The Annex', path: '/annex' }, { name: 'Annex Restaurant', path: '/annex/restaurant' }]
  const restaurantJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': `${SITE_URL}/annex/restaurant#restaurant`,
    name: amenity?.name || 'Annex Restaurant',
    url: `${SITE_URL}/annex/restaurant`,
    servesCuisine: ['Nigerian', 'Continental'],
  }
  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs, SITE_URL), restaurantJsonLd]} />
      <AnnexMenuExperience
        outlet="restaurant"
        mode="food"
        eyebrow={amenity?.eyebrow || 'Dining'}
        title={amenity?.name || 'Annex Restaurant'}
        description={amenity?.description || 'Homestyle dishes and a relaxed dining experience at the Blue Pair Hotel Annex.'}
        heroImage={ANNEX_RESTAURANT_IMAGES[0]}
        items={items}
        annexMenu={annexMenu}
        activeBookings={activeBookings}
      />
    </>
  )
}
