import { buildMetadata } from '../../../../lib/buildMetadata'
import { getAmenity, getMenuItems } from '../../../../lib/data'
import AnnexMenuExperience from '../../../../components/annex/AnnexMenuExperience'

export const metadata = buildMetadata({
  title: 'Outdoor Eatery in Uromi, Edo State | Blue Pair Hotel Annex',
  description: 'Explore the Outdoor Eatery menu at Blue Pair Hotel, Uromi, Edo State.',
  keywords: 'outdoor eatery uromi, open air restaurant edo state, annex restaurant uromi',
  path: '/annex/outdoor-eatery',
})

export default async function OutdoorEateryPage() {
  const [amenity, menuItems] = await Promise.all([getAmenity('annex-outdoor-eatery'), getMenuItems()])
  return <AnnexMenuExperience mode="food" eyebrow={amenity?.eyebrow || 'Open-air dining'} title={amenity?.name || 'Outdoor Eatery'} description={amenity?.description || 'An open-air Annex dining space for relaxed meals and an easygoing night out.'} heroImage={amenity?.heroImage || ''} items={menuItems.filter(item => item.outlet === 'Annex Outdoor Eatery')} />
}
