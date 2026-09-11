import { buildMetadata } from '../../../lib/buildMetadata'
import AmenityPage from '../../../components/ui/AmenityPage'
import { resolveAmenityConfig } from '../../../lib/amenity'

export const metadata = buildMetadata({
  title: 'VIP Lounge in Uromi, Edo State | Blue Pair Hotel',
  description: 'Private VIP lounge at Blue Pair Hotel, Uromi, Edo State — booth seating, premium spirits and a dedicated host. Reserve a table for your next night out in Uromi.',
  keywords: 'vip lounge uromi, vip lounge edo state, private lounge uromi, hotel with vip lounge esan north-east, blue pair hotel vip',
  path: '/vip-lounge',
})

export default async function VipLoungePage() {
  const config = await resolveAmenityConfig('vip-lounge', {
    name: 'VIP Lounge', eyebrow: 'Exclusive access',
    heroImage: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1600&q=80',
    description: 'A members-style lounge for hotel guests and VIP cardholders — private seating, a curated drinks list, and a dedicated host from check-in to last call.',
    gallery: [
      'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=900&q=80',
    ],
    hours: 'Daily, 6:00 PM – 3:00 AM',
    facilities: ['Private booth seating', 'Dedicated lounge host', 'Premium spirits list', 'Cigar terrace access', 'Live DJ Thursday–Saturday', 'Complimentary valet'],
    pricingNote: 'Free entry for hotel guests. ₦20,000 minimum spend for walk-ins.',
    ctaLabel: 'Reserve a table',
    breadcrumbs: [{name:'Home',path:'/'},{name:'VIP Lounge',path:'/vip-lounge'}],
  })
  return <AmenityPage config={config} />
}
