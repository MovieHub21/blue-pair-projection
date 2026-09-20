import { buildMetadata } from '../../../../lib/buildMetadata'
import { getDrinks, getAmenity } from '../../../../lib/data'
import AnnexMenuExperience from '../../../../components/annex/AnnexMenuExperience'

export const metadata = buildMetadata({
  title: 'Annex Bar — Drinks Menu in Uromi, Edo State | Blue Pair Hotel',
  description: 'Explore the Annex Bar drinks menu at Blue Pair Hotel, Uromi, Edo State.',
  keywords: 'annex bar uromi, drinks menu edo state, bar uromi, blue pair hotel',
  path: '/annex/bar',
})

export default async function AnnexBarPage() {
  const [drinks, amenity] = await Promise.all([getDrinks(), getAmenity('annex-bar')])
  return <AnnexMenuExperience mode="bar" eyebrow={amenity?.eyebrow || 'Drinks & nightlife'} title={amenity?.name || 'Annex Bar'} description={amenity?.description || 'A relaxed Annex bar for drinks, conversation and late-evening atmosphere.'} heroImage={amenity?.heroImage || ''} items={drinks.filter(d => d.bar === 'Annex Bar')} />
}
