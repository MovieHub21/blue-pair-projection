import { buildMetadata } from '../../../../lib/buildMetadata'
import AmenityPage from '../../../../components/ui/AmenityPage'

export const metadata = buildMetadata({
  title: 'Outdoor Eatery in Uromi, Edo State | Blue Pair Hotel Annex',
  description: 'Open-air courtyard dining at the Blue Pair Hotel Annex, Uromi, Edo State — live music weekends, kid-friendly seating. Open daily noon–1am.',
  keywords: 'outdoor eatery uromi, open air restaurant edo state, annex restaurant uromi',
  path: '/annex/outdoor-eatery',
})

export default function OutdoorEateryPage() {
  return <AmenityPage config={{
    name: 'Annex Outdoor Eatery', eyebrow: 'Open-air dining',
    heroImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80',
    description: 'Open-air seating scattered across the Annex courtyard, lit by string lights — casual dining for groups, families, and evening hangouts.',
    gallery: [
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=900&q=80',
    ],
    hours: 'Daily, 12:00 PM – 1:00 AM',
    facilities: ['Open-air courtyard seating', 'Live music weekends', 'Kid-friendly area', 'Full bar service', 'Group & event seating'],
    pricingNote: 'À la carte — see the Annex Restaurant menu for pricing.',
    ctaLabel: 'Reserve a table',
    breadcrumbs: [{name:'Home',path:'/'},{name:'The Annex',path:'/annex'},{name:'Outdoor Eatery',path:'/annex/outdoor-eatery'}],
  }} />
}
