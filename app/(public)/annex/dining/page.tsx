import { buildMetadata } from '../../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../../components/JsonLd'
import { SITE_URL } from '../../../../lib/siteConfig'
import { getAmenity } from '../../../../lib/data'
import { getAnnexActiveBookings, getAnnexMenuData, type AnnexOutletKey } from '../../../../lib/annexOrders'
import AnnexMenuExperience from '../../../../components/annex/AnnexMenuExperience'

export const metadata = buildMetadata({
  title: 'Annex Dining & Drinks in Uromi, Edo State | Blue Pair Hotel',
  description: 'Explore dining and drinks at the Blue Pair Hotel Annex in Uromi, Edo State — restaurant, bar, open-flame grills and outdoor eatery in one unified menu.',
  keywords: 'annex dining uromi, annex restaurant, annex bar, annex grilling, suya uromi, blue pair annex dining',
  path: '/annex/dining',
})

const VALID_OUTLETS: Set<string> = new Set(['restaurant', 'bar', 'grilling', 'outdoor_eatery'])

export default async function AnnexDiningPage({
  searchParams,
}: {
  searchParams?: { outlet?: string }
}) {
  const initialOutlet: AnnexOutletKey =
    searchParams?.outlet && VALID_OUTLETS.has(searchParams.outlet)
      ? (searchParams.outlet as AnnexOutletKey)
      : 'restaurant'

  const [amenity, activeBookings, annexMenu] = await Promise.all([
    getAmenity('annex-restaurant'),
    getAnnexActiveBookings(),
    getAnnexMenuData(),
  ])

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'The Annex', path: '/annex' },
    { name: 'Annex Dining', path: '/annex/dining' },
  ]

  const restaurantJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': `${SITE_URL}/annex/dining#restaurant`,
    name: 'Annex Dining & Drinks',
    url: `${SITE_URL}/annex/dining`,
    servesCuisine: ['Nigerian', 'Continental'],
  }

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs, SITE_URL), restaurantJsonLd]} />
      <AnnexMenuExperience
        outlet={initialOutlet}
        annexMenu={annexMenu}
        activeBookings={activeBookings}
        footerLabel="Blue Pair Hotel · The Annex"
      />
    </>
  )
}
