import { notFound } from 'next/navigation'
import { buildMetadata } from '../../../../lib/buildMetadata'
import AmenityPage from '../../../../components/ui/AmenityPage'
import { getAmenity } from '../../../../lib/data'

export const metadata = buildMetadata({
  title: 'Annex VIP Lounge in Uromi, Edo State | Blue Pair Hotel',
  description: 'A private, intimate VIP lounge within the Blue Pair Hotel Annex, Uromi, Edo State — ideal for small celebrations. Open daily 5pm–2am.',
  keywords: 'vip lounge uromi annex, private lounge edo state, blue pair annex vip',
  path: '/annex/vip-lounge',
})

export default async function AnnexVipLoungePage() {
  const amenity = await getAmenity('annex-vip-lounge')
  if (!amenity || !amenity.published) notFound()

  return <AmenityPage config={amenity} />
}
