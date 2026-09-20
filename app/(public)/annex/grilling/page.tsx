import { buildMetadata } from '../../../../lib/buildMetadata'
import { getMenuItems, getAmenity } from '../../../../lib/data'
import AnnexMenuExperience from '../../../../components/annex/AnnexMenuExperience'

export const metadata = buildMetadata({
  title: 'Grill Menu & Prices in Uromi, Edo State | Blue Pair Hotel Annex',
  description: 'Explore the Annex Grilling menu at Blue Pair Hotel, Uromi, Edo State.',
  keywords: 'grill menu uromi, suya uromi, annex grilling blue pair, grill house edo state',
  path: '/annex/grilling',
})

export default async function GrillingPage() {
  const [menuItems, amenity] = await Promise.all([getMenuItems(), getAmenity('annex-grilling')])
  return <AnnexMenuExperience mode="food" eyebrow={amenity?.eyebrow || 'Fire & flavour'} title={amenity?.name || 'Annex Grilling'} description={amenity?.description || 'Freshly prepared food from the Annex kitchen, served with the atmosphere of an open grill.'} heroImage={amenity?.heroImage || ''} items={menuItems.filter(item => item.outlet === 'Annex Grilling')} />
}
