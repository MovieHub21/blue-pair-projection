import { buildMetadata } from '../../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../../components/JsonLd'
import { SITE_URL } from '../../../../lib/siteConfig'
import { getAmenity } from '../../../../lib/data'
import { getAnnexActiveBookings, getAnnexMenuData } from '../../../../lib/annexOrders'
import AnnexMenuExperience from '../../../../components/annex/AnnexMenuExperience'

const ANNEX_BAR_IMAGES = [
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=85',
  'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=85',
]

export const metadata = buildMetadata({
  title: 'Annex Bar Drinks Menu in Uromi, Edo State | Blue Pair Hotel',
  description: 'Explore drinks at the Blue Pair Hotel Annex Bar in Uromi, Edo State, with a browsable menu of available selections.',
  keywords: 'annex bar uromi, drinks menu uromi, bar uromi, blue pair annex bar, drinks edo state',
  path: '/annex/bar',
})

export default async function AnnexBarPage() {
  const [amenity, activeBookings, annexMenu] = await Promise.all([
    getAmenity('annex-bar'),
    getAnnexActiveBookings(),
    getAnnexMenuData(),
  ])
  const items = annexMenu.bar
  const breadcrumbs = [{ name: 'Home', path: '/' }, { name: 'The Annex', path: '/annex' }, { name: 'Annex Bar', path: '/annex/bar' }]
  const barJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BarOrPub',
    '@id': `${SITE_URL}/annex/bar#bar`,
    name: amenity?.name || 'Annex Bar',
    url: `${SITE_URL}/annex/bar`,
  }
  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs, SITE_URL), barJsonLd]} />
      <AnnexMenuExperience
        outlet="bar"
        mode="bar"
        eyebrow={amenity?.eyebrow || 'Drinks & nightlife'}
        title={amenity?.name || 'Annex Bar'}
        description={amenity?.description || 'A relaxed Annex bar for drinks, conversation and late-evening atmosphere.'}
        heroImage={ANNEX_BAR_IMAGES[0]}
        items={items}
        annexMenu={annexMenu}
        activeBookings={activeBookings}
      />
    </>
  )
}
