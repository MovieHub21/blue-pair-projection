import { buildMetadata } from '../../../lib/buildMetadata'
import AmenityPage from '../../../components/ui/AmenityPage'
import { resolveAmenityConfig } from '../../../lib/amenity'

export const metadata = buildMetadata({
  title: 'VIP bar in Uromi, Edo State | Blue Pair Hotel',
  description: 'Private VIP bar at Blue Pair Hotel, Uromi, Edo State — booth seating, premium spirits and a dedicated host. Reserve a table for your next night out in Uromi.',
  keywords: 'VIP bar Uromi, private bar Uromi, VIP lounge Uromi, hotel bar Uromi, Blue Pair Hotel VIP bar',
  path: '/vip-lounge',
})

export default async function VipLoungePage() {
  const config = await resolveAmenityConfig('vip-lounge', {
    name: 'VIP Bar', eyebrow: 'Exclusive access', mini: 'AN EXPERIENCE FOR THE SENSES',
    heroImage: 'https://bluepairsignature.com/images/annexvip.jpg',
    description: 'A members-style bar for hotel guests and VIP cardholders private seating, a curated drinks list, and a dedicated host from check-in to last call.',
    gallery: [
      'https://bluepairsignature.com/images/annexvip.jpg',
      'https://bluepairsignature.com/images/annexvip2.jpg',
      'https://bluepairsignature.com/images/annexvip3.jpg',
    ],
    hours: 'Daily, 8:00 PM – 3:00 AM',
    facilities: ['Private booth seating', 'Dedicated lounge host', 'Premium spirits list', 'Cigar terrace access', 'Live DJ Thursday–Saturday', 'Complimentary valet'],
    pricingNote: 'Free entry for hotel guests. ₦20,000 minimum spend for walk-ins.',
    ctaLabel: 'Reserve a table',
    breadcrumbs: [{name:'Home',path:'/'},{name:'VIP Bar',path:'/vip-lounge'}],
  })
  return <AmenityPage config={config} />
}
