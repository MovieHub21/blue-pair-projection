import { buildMetadata } from '../../../lib/buildMetadata'
import AmenityPage from '../../../components/ui/AmenityPage'
import JsonLd from '../../../components/JsonLd'
import { getEvents } from '../../../lib/data'
import { formatDate, naira } from '../../../lib/format'

export const metadata = buildMetadata({
  title: 'Nightclub in Uromi, Edo State | The Club at Blue Pair Hotel',
  description: 'Edo State\u2019s after-dark address — resident DJs, bottle service and VIP tables at The Club, Blue Pair Hotel, Uromi. Open Thursday to Sunday, 9pm–4am.',
  keywords: 'nightclub uromi, club edo state, vip table uromi, night club esan north-east, blue pair hotel club',
  path: '/club',
})

export default async function ClubPage() {
  const upcoming = await getEvents(true)
  const eventsJsonLd = upcoming.map(e => ({
    '@context': 'https://schema.org', '@type': 'Event', name: e.title, startDate: e.date, description: e.description, image: e.image,
    location: { '@type': 'Place', name: 'The Club at Blue Pair Hotel', address: 'Auchi Road, Uromi, Edo State' },
    offers: { '@type': 'Offer', price: e.price, priceCurrency: 'NGN', availability: 'https://schema.org/InStock' },
  }))
  return (
    <>
      <JsonLd data={eventsJsonLd} />
      <AmenityPage config={{
    name: 'The Club', eyebrow: 'Nightlife',
    heroImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80',
    description: 'Edo State\u2019s after-dark address — resident and guest DJs, bottle service, and a terrace that opens onto the pool deck.',
    gallery: [
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1571266028243-d220c9e1345c?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1571266028316-4ab4a8f24b1d?auto=format&fit=crop&w=900&q=80',
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
            <div key={e.id} className="flex items-center justify-between bg-cream-100 rounded-xl px-4 py-3 text-sm">
              <span className="font-medium">{e.title}</span>
              <span className="text-navy-400">{formatDate(e.date)} · {naira(e.price)}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }} />
    </>
  )
}
