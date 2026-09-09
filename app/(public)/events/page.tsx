import { buildMetadata } from '../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../components/JsonLd'
import { SITE_URL } from '../../../lib/siteConfig'
import PageHero from '../../../components/layout/PageHero'
import SectionHeading from '../../../components/ui/SectionHeading'
import { events } from '../../../data/mock'
import { naira, formatDate } from '../../../lib/format'
import { Users, Calendar } from 'lucide-react'

export const metadata = buildMetadata({
  title: 'Upcoming Events in Uromi, Edo State | Blue Pair Hotel',
  description: 'From pool brunches to black-tie evenings — see upcoming events at Blue Pair Hotel, Uromi, Edo State, and reserve your spot.',
  keywords: 'events uromi, events edo state, hotel events uromi, event centre esan north-east, wedding venue uromi',
  path: '/events',
})

const breadcrumbs = [{name:'Home',path:'/'},{name:'Events',path:'/events'}]

export default function EventsPage() {
  const published = events.filter(e => e.published)
  const eventsJsonLd = published.map(e => ({
    '@context': 'https://schema.org', '@type': 'Event', name: e.title, startDate: e.date, description: e.description, image: e.image,
    location: { '@type': 'Place', name: 'Blue Pair Hotel', address: 'Auchi Road, Uromi, Edo State' },
    offers: { '@type': 'Offer', price: e.price, priceCurrency: 'NGN', availability: 'https://schema.org/InStock' },
  }))
  return (
    <div>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs, SITE_URL), ...eventsJsonLd]} />
      <PageHero image="https://images.unsplash.com/photo-1519167758481-83f29c8e8de8?auto=format&fit=crop&w=1600&q=80"
        eyebrow="What's on" title="Events" crumbs="Home / Events" height="h-72" />
      <section className="section">
        <div className="container-w">
          <SectionHeading eyebrow="Upcoming" title="Events at Blue Pair" subtitle="From pool brunches to black-tie evenings — book your spot before tables run out." />
          <div className="grid md:grid-cols-3 gap-6">
            {published.map(e => (
              <div key={e.id} className="card overflow-hidden flex flex-col">
                <div className="h-48"><img src={e.image} alt={e.title} className="w-full h-full object-cover" /></div>
                <div className="p-5 flex flex-col gap-2.5 flex-1">
                  <h4 className="font-semibold text-lg">{e.title}</h4>
                  <span className="text-xs text-navy-500 flex items-center gap-1.5"><Calendar size={13} />{formatDate(e.date)}</span>
                  <span className="text-xs text-navy-500 flex items-center gap-1.5"><Users size={13} />{e.capacity} capacity</span>
                  <p className="text-sm text-navy-500">{e.description}</p>
                  <div className="flex items-center justify-between mt-auto pt-3">
                    <b className="font-display">{naira(e.price)}</b>
                    <button className="btn-gold btn-sm">Reserve spot</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
