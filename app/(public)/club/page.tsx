import { buildMetadata } from '../../../lib/buildMetadata'
import AmenityPage from '../../../components/ui/AmenityPage'
import JsonLd from '../../../components/JsonLd'
import { getClubEvents, getSiteContent } from '../../../lib/data'
import { resolveAmenityConfig } from '../../../lib/amenity'
import { formatDate } from '../../../lib/format'

export const metadata = buildMetadata({
  title: 'Nightclub in Uromi, Edo State | The Club at Blue Pair Signature',
  description: 'Edo State\u2019s after-dark address — resident DJs, bottle service and VIP tables at The Club, Blue Pair Signature, Uromi. Open Thursday to Sunday, 9pm–4am.',
  keywords: 'nightclub Uromi, night club Uromi, club in Uromi Edo State, VIP table Uromi, The Club Blue Pair Signature',
  path: '/club',
})

export default async function ClubPage() {
  const [upcoming, content] = await Promise.all([getClubEvents(), getSiteContent()])
  const address = content.hotel_address?.trim() || 'Uromi, Edo State'
  const eventsJsonLd = upcoming.map(e => ({
    '@context': 'https://schema.org', '@type': 'Event', name: e.title, startDate: e.date, description: e.description,
    location: { '@type': 'Place', name: 'The Club at Blue Pair Signature', address },
  }))
  const config = await resolveAmenityConfig('club', {
    name: 'Club', eyebrow: 'Nightlife', mini: 'AN EXPERIENCE FOR THE SENSES',
    heroImage: 'https://www.bluepairsignature.com/images/CLUB2.jpg',
    description: 'Edo State\u2019s after-dark address — resident and guest DJs, bottle service, and a terrace that opens onto the pool deck.',
    gallery: [
      'https://www.bluepairsignature.com/images/club2.png',
      'https://www.bluepairsignature.com/images/club3.png',
      'https://www.bluepairsignature.com/images/CLUB2.jpg',
      'images/lawson.jpg',
    ],
    hours: 'Thursday – Sunday, 9:00 PM – 4:00 AM',
    facilities: ['Resident & guest DJs', 'Bottle service', 'VIP table booths', 'Outdoor terrace', 'Dedicated security & valet', 'Live performances on weekends'],
    pricingNote: 'Entry: ₦10,000 (redeemable at the bar). VIP tables from ₦150,000.',
    ctaLabel: 'Book a VIP table',
    breadcrumbs: [{name:'Home',path:'/'},{name:'The Club',path:'/club'}],
    extra: (
      <div className="mt-8">
        <b className="block mb-3 text-navy-900">Upcoming at the Club</b>
        <div className="flex flex-col gap-2.5">
          {upcoming.map(e => (
            <div key={e.id} className="flex flex-col gap-1 bg-cream-100 rounded-xl px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="font-medium">{e.title}{e.description ? <span className="mt-1 block text-xs font-normal leading-5 text-navy-500">{e.description}</span> : null}</span>
              <span className="shrink-0 text-navy-400">{formatDate(e.date)}</span>
            </div>
          ))}
        </div>
      </div>
    )
  })
  return (
    <>
      <JsonLd data={eventsJsonLd} />
      <AmenityPage config={config} />
    </>
  )
}
