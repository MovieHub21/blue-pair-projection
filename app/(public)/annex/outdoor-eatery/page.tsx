import { buildMetadata } from '../../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../../components/JsonLd'
import { SITE_URL } from '../../../../lib/siteConfig'
import { getAmenity, getMenuItems } from '../../../../lib/data'
import { getAnnexActiveBookings } from '../../../../lib/annexOrders'
import AnnexMenuExperience from '../../../../components/annex/AnnexMenuExperience'

const ANNEX_OUTDOOR_IMAGES = [
  'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=1600&q=85',
  'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=85',
]

export const metadata = buildMetadata({
  title: 'Outdoor Eatery in Uromi, Edo State | Blue Pair Hotel Annex',
  description: 'Explore the Blue Pair Hotel Annex Outdoor Eatery in Uromi, Edo State, with open-air dining and a browsable food menu.',
  keywords: 'outdoor eatery uromi, open air restaurant uromi, outdoor dining edo state, annex outdoor eatery',
  path: '/annex/outdoor-eatery',
})

export default async function OutdoorEateryPage() {
  const [amenity, menuItems, activeBookings] = await Promise.all([getAmenity('annex-outdoor-eatery'), getMenuItems(), getAnnexActiveBookings()])
  const items = menuItems.filter(item => item.outlet === 'Outdoor Bar & Eatery' || item.outlet === 'Annex Outdoor Eatery')
  const breadcrumbs = [{ name: 'Home', path: '/' }, { name: 'The Annex', path: '/annex' }, { name: 'Outdoor Eatery', path: '/annex/outdoor-eatery' }]
  const restaurantJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': `${SITE_URL}/annex/outdoor-eatery#restaurant`,
    name: amenity?.name || 'Outdoor Eatery',
    url: `${SITE_URL}/annex/outdoor-eatery`,
    servesCuisine: ['Nigerian', 'Continental'],
  }
  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs, SITE_URL), restaurantJsonLd]} />
      <AnnexMenuExperience outlet="outdoor_eatery" mode="food" eyebrow={amenity?.eyebrow || 'Open-air dining'} title={amenity?.name || 'Outdoor Eatery'} description={amenity?.description || 'An open-air Annex dining space for relaxed meals and an easygoing night out.'} heroImage={ANNEX_OUTDOOR_IMAGES[0]} items={items} activeBookings={activeBookings} />
    </>
  )
}
