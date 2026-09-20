import { buildMetadata } from '../../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../../components/JsonLd'
import { SITE_URL } from '../../../../lib/siteConfig'
import { getDrinks, getAmenity } from '../../../../lib/data'
import AnnexMenuExperience from '../../../../components/annex/AnnexMenuExperience'

export const metadata = buildMetadata({
  title: 'Annex Bar Drinks Menu in Uromi, Edo State | Blue Pair Hotel',
  description: 'Explore drinks at the Blue Pair Hotel Annex Bar in Uromi, Edo State, with a browsable menu of available selections.',
  keywords: 'annex bar uromi, drinks menu uromi, bar uromi, blue pair annex bar, drinks edo state',
  path: '/annex/bar',
})

export default async function AnnexBarPage() {
  const [drinks, amenity] = await Promise.all([getDrinks(), getAmenity('annex-bar')])
  const items = drinks.filter(d => d.bar === 'Annex Bar')
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
      <AnnexMenuExperience mode="bar" eyebrow={amenity?.eyebrow || 'Drinks & nightlife'} title={amenity?.name || 'Annex Bar'} description={amenity?.description || 'A relaxed Annex bar for drinks, conversation and late-evening atmosphere.'} heroImage={amenity?.heroImage || ''} items={items} />
    </>
  )
}
