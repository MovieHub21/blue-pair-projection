import { buildMetadata } from '../../../../lib/buildMetadata'
import { getMenuItems, getAmenity } from '../../../../lib/data'
import AnnexMenuExperience from '../../../../components/annex/AnnexMenuExperience'

export const metadata = buildMetadata({
  title: 'Annex Restaurant Menu in Uromi, Edo State | Blue Pair Hotel',
  description: 'Explore the Annex Restaurant menu at Blue Pair Hotel, Uromi, Edo State.',
  keywords: 'annex restaurant uromi, nigerian food edo state, blue pair annex menu, restaurant esan north-east',
  path: '/annex/restaurant',
})

export default async function AnnexRestaurantPage() {
  const [menuItems, amenity] = await Promise.all([getMenuItems(), getAmenity('annex-restaurant')])
  return <AnnexMenuExperience mode="food" eyebrow={amenity?.eyebrow || 'Dining'} title={amenity?.name || 'Annex Restaurant'} description={amenity?.description || 'Homestyle dishes and a relaxed dining experience at the Blue Pair Hotel Annex.'} heroImage={amenity?.heroImage || ''} items={menuItems.filter(item => item.outlet === 'Annex Restaurant')} />
}
