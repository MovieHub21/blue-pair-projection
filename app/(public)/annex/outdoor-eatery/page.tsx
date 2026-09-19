import { notFound } from 'next/navigation'
import { buildMetadata } from '../../../../lib/buildMetadata'
import AmenityPage from '../../../../components/ui/AmenityPage'
import { getAmenity } from '../../../../lib/data'

export const metadata = buildMetadata({
  title: 'Outdoor Eatery in Uromi, Edo State | Blue Pair Hotel Annex',
  description: 'Open-air courtyard dining at the Blue Pair Hotel Annex, Uromi, Edo State — live music weekends, kid-friendly seating. Open daily noon–1am.',
  keywords: 'outdoor eatery uromi, open air restaurant edo state, annex restaurant uromi',
  path: '/annex/outdoor-eatery',
})

export default async function OutdoorEateryPage() {
  const amenity = await getAmenity('annex-outdoor-eatery')
  if (!amenity || !amenity.published) notFound()

  return <AmenityPage config={amenity} />
}
