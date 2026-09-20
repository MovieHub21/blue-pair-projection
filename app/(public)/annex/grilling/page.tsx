import { buildMetadata } from '../../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../../components/JsonLd'
import { SITE_URL } from '../../../../lib/siteConfig'
import { getMenuItems, getAmenity } from '../../../../lib/data'
import AnnexMenuExperience from '../../../../components/annex/AnnexMenuExperience'

export const metadata = buildMetadata({
  title: 'Grill Menu & Prices in Uromi, Edo State | Blue Pair Hotel Annex',
  description: 'Explore grilled food at the Blue Pair Hotel Annex in Uromi, Edo State, with a browsable grill menu and prices.',
  keywords: 'grill menu uromi, grilling uromi, suya uromi, annex grilling blue pair, grill house edo state',
  path: '/annex/grilling',
})

export default async function GrillingPage() {
  const [menuItems, amenity] = await Promise.all([getMenuItems(), getAmenity('annex-grilling')])
  const items = menuItems.filter(item => item.outlet === 'Annex Grilling')
  const breadcrumbs = [{ name: 'Home', path: '/' }, { name: 'The Annex', path: '/annex' }, { name: 'Annex Grilling', path: '/annex/grilling' }]
  const restaurantJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': `${SITE_URL}/annex/grilling#restaurant`,
    name: amenity?.name || 'Annex Grilling',
    url: `${SITE_URL}/annex/grilling`,
    servesCuisine: ['Nigerian'],
  }
  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs, SITE_URL), restaurantJsonLd]} />
      <AnnexMenuExperience mode="food" eyebrow={amenity?.eyebrow || 'Fire & flavour'} title={amenity?.name || 'Annex Grilling'} description={amenity?.description || 'Freshly prepared food from the Annex kitchen, served with the atmosphere of an open grill.'} heroImage={amenity?.heroImage || ''} items={items} />
    </>
  )
}
