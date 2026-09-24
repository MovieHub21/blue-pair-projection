import { buildMetadata } from '../../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../../components/JsonLd'
import { SITE_URL } from '../../../../lib/siteConfig'
import { getMenuItems, getAmenity } from '../../../../lib/data'
import { getAnnexActiveBookings } from '../../../../lib/annexOrders'
import AnnexMenuExperience from '../../../../components/annex/AnnexMenuExperience'

export const metadata = buildMetadata({
  title: 'Annex Restaurant Menu in Uromi, Edo State | Blue Pair Hotel',
  description: 'Explore the Blue Pair Hotel Annex Restaurant menu in Uromi, Edo State, with dishes, categories and prices.',
  keywords: 'annex restaurant uromi, restaurant menu uromi, nigerian food edo state, blue pair annex restaurant, restaurant esan north-east',
  path: '/annex/restaurant',
})

export default async function AnnexRestaurantPage() {
  const [menuItems, amenity, activeBookings] = await Promise.all([getMenuItems(), getAmenity('annex-restaurant'), getAnnexActiveBookings()])
  const items = menuItems.filter(item => item.outlet === 'Annex Restaurant')
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
      <AnnexMenuExperience outlet="restaurant" mode="food" eyebrow={amenity?.eyebrow || 'Dining'} title={amenity?.name || 'Annex Restaurant'} description={amenity?.description || 'Homestyle dishes and a relaxed dining experience at the Blue Pair Hotel Annex.'} heroImage={amenity?.heroImage || ''} items={items} activeBookings={activeBookings} />
    </>
  )
}
