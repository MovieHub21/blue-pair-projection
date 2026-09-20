import { buildMetadata } from '../../../../lib/buildMetadata'
import AmenityPage from '../../../../components/ui/AmenityPage'
import { getAmenity, getMenuItems } from '../../../../lib/data'
import { naira } from '../../../../lib/format'

export const metadata = buildMetadata({
  title: 'Outdoor Eatery in Uromi, Edo State | Blue Pair Hotel Annex',
  description: 'Open-air courtyard dining at the Blue Pair Hotel Annex, Uromi, Edo State — live music weekends, kid-friendly seating. Open daily noon–1am.',
  keywords: 'outdoor eatery uromi, open air restaurant edo state, annex restaurant uromi',
  path: '/annex/outdoor-eatery',
})

export default async function OutdoorEateryPage() {
  const [amenity, menuItems] = await Promise.all([getAmenity('annex-outdoor-eatery'), getMenuItems()])
  const items = menuItems.filter(m => m.outlet === 'Annex Outdoor Eatery')
  const config = amenity || {
    name: 'Outdoor Eatery',
    eyebrow: 'Open-air dining',
    heroImage: '',
    description: 'An open-air Annex dining space for relaxed meals, drinks and live music weekends.',
    gallery: [],
    hours: 'Daily, noon–1am',
    facilities: ['Open-air seating', 'Live music weekends', 'Kid-friendly seating'],
    pricingNote: '',
    ctaLabel: 'Reserve now',
  }
  return <AmenityPage config={{...config, extra: items.length ? <div className="mt-10"><h4 className="text-lg font-semibold mb-4">Outdoor Eatery Menu</h4><div className="card divide-y divide-black/5">{items.map(i => <div key={i.id} className="flex justify-between p-4"><span>{i.name}</span><b>{naira(i.price)}</b></div>)}</div></div> : null}} />
}