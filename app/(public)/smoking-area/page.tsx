import { buildMetadata } from '../../../lib/buildMetadata'
import AmenityPage from '../../../components/ui/AmenityPage'

export const metadata = buildMetadata({
  title: 'Smoking Area & Rules | Blue Pair Hotel Uromi',
  description: 'Designated open-air smoking area at Blue Pair Hotel, Uromi, Edo State — location, access rules and shisha service on request.',
  keywords: 'smoking area uromi hotel, shisha uromi, blue pair hotel smoking policy',
  path: '/smoking-area',
  noindex: false,
})

export default function SmokingAreaPage() {
  return <AmenityPage config={{
    name: 'Smoking Area', eyebrow: 'Designated zone',
    heroImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80',
    description: 'An open-air designated smoking area located on the east terrace, away from dining and pool areas, with comfortable outdoor seating.',
    gallery: [
      'https://images.unsplash.com/photo-1521401830884-6c03c1c87ebb?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=900&q=80',
    ],
    hours: 'Open 24 hours',
    facilities: ['East terrace, open-air', 'Comfortable outdoor seating', 'Ashtray service', 'Away from dining & pool areas', 'Shisha available on request'],
    pricingNote: 'No charge — access is complimentary for all guests.',
    ctaLabel: 'View location on map',
    breadcrumbs: [{name:'Home',path:'/'},{name:'Smoking Area',path:'/smoking-area'}],
    extra: (
      <div className="mt-8 bg-cream-100 rounded-xl2 p-5 text-sm text-navy-600">
        <b className="block mb-1.5 text-navy-900">Access &amp; rules</b>
        Smoking is strictly prohibited in all rooms, indoor common areas, and the restaurant. The east terrace is the only designated smoking zone on the property, accessible via the pool deck corridor.
      </div>
    )
  }} />
}
