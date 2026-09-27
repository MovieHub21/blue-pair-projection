import { buildMetadata } from '../../../../lib/buildMetadata'
import AmenityPage from '../../../../components/ui/AmenityPage'
import { getAmenity } from '../../../../lib/data'

const ANNEX_VIP_IMAGES = [
  'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1600&q=85',
  'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=1200&q=85',
]

export const metadata = buildMetadata({
  title: 'Annex VIP Lounge in Uromi, Edo State | Blue Pair Hotel',
  description: 'A private, intimate VIP lounge within the Blue Pair Hotel Annex, Uromi, Edo State — ideal for small celebrations. Open daily 5pm–2am.',
  keywords: 'vip lounge uromi annex, private lounge edo state, blue pair annex vip',
  path: '/annex/vip-lounge',
})

export default async function AnnexVipLoungePage() {
  const amenity = await getAmenity('annex-vip-lounge')
  const config = amenity ? { ...amenity, heroImage: ANNEX_VIP_IMAGES[0], gallery: ANNEX_VIP_IMAGES } : {
    name: 'Annex VIP Lounge',
    eyebrow: 'Private lounge',
    mini: 'AN EXPERIENCE FOR THE SENSES',
    heroImage: ANNEX_VIP_IMAGES[0],
    description: 'A private, intimate VIP lounge within the Blue Pair Hotel Annex — ideal for small celebrations and relaxed evenings.',
    gallery: ANNEX_VIP_IMAGES,
    hours: 'Daily, 5pm–2am',
    facilities: ['Private lounge seating', 'Small celebrations', 'Priority access for hotel guests'],
    pricingNote: '',
    ctaLabel: 'Reserve now',
  }
  return <AmenityPage config={config} />
}