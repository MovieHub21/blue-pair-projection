import { buildMetadata } from '../../../../lib/buildMetadata'
import AmenityPage from '../../../../components/ui/AmenityPage'

export const metadata = buildMetadata({
  title: 'Annex VIP Lounge in Uromi, Edo State | Blue Pair Hotel',
  description: 'A private, intimate VIP lounge within the Blue Pair Hotel Annex, Uromi, Edo State — ideal for small celebrations. Open daily 5pm–2am.',
  keywords: 'vip lounge uromi annex, private lounge edo state, blue pair annex vip',
  path: '/annex/vip-lounge',
})

export default function AnnexVipLoungePage() {
  return <AmenityPage config={{
    name: 'Annex VIP Lounge', eyebrow: 'Annex exclusive',
    heroImage: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1600&q=80',
    description: 'A quieter, more intimate VIP space within the Annex — ideal for private gatherings and small celebrations.',
    gallery: [
      'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=900&q=80',
    ],
    hours: 'Daily, 5:00 PM – 2:00 AM',
    facilities: ['Private lounge seating', 'Dedicated server', 'Bottle service', 'Outdoor courtyard access', 'Sound system for private events'],
    pricingNote: 'Reservations from ₦100,000 minimum spend, redeemable at the bar.',
    ctaLabel: 'Reserve the lounge',
    breadcrumbs: [{name:'Home',path:'/'},{name:'The Annex',path:'/annex'},{name:'VIP Lounge',path:'/annex/vip-lounge'}],
  }} />
}
