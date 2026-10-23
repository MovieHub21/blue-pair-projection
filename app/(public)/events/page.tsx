import { buildMetadata } from '../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../components/JsonLd'
import { SITE_URL } from '../../../lib/siteConfig'
import PageHero from '../../../components/layout/PageHero'
import SectionHeading from '../../../components/ui/SectionHeading'
import { getEvents, getSiteContent } from '../../../lib/data'
import { naira, formatDate } from '../../../lib/format'
import { Users, Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import ReserveSpotButton from './ReserveSpotButton'

export const metadata = buildMetadata({ title: 'Events & Event Hall in Uromi, Edo State | Blue Pair Signature', description: 'Find upcoming hotel events and enquire about the Blue Pair event hall in Uromi for meetings, corporate events, birthdays, weddings and church programmes. Venue capacity varies by seating arrangement.', keywords: 'events Uromi, event hall Uromi, event venue Uromi, wedding venue Uromi, meeting venue Uromi, corporate event space Uromi, hotel events Uromi, event reservations Uromi, Blue Pair Signature events', path: '/events' })
const breadcrumbs = [{name:'Home',path:'/'},{name:'Events',path:'/events'}]

export default async function EventsPage() {
  const [published, content] = await Promise.all([getEvents(true), getSiteContent()])
  const address = content.hotel_address?.trim() || 'Uromi, Edo State'
  const eventsJsonLd = published.map(e => ({ '@context': 'https://schema.org', '@type': 'Event', name: e.title, startDate: e.date, description: e.description, image: e.image, location: { '@type': 'Place', name: 'Blue Pair Signature', address }, offers: { '@type': 'Offer', price: e.price, priceCurrency: 'NGN', availability: 'https://schema.org/InStock' } }))
  return <div>
    <JsonLd data={[breadcrumbJsonLd(breadcrumbs, SITE_URL), ...eventsJsonLd]} />
    <PageHero image="https://images.unsplash.com/photo-1519167758481-83f29c8e8de8?auto=format&fit=crop&w=1600&q=80" eyebrow="What's on" title="Upcoming Events at Blue Pair" crumbs="Home / Events" height="h-72" />
    <section className="section"><div className="container-w">
      <SectionHeading eyebrow="Upcoming" title="Events at Blue Pair" subtitle="From pool brunches to black-tie evenings — request your spot and let our reception team confirm availability." />
      <div className="grid md:grid-cols-3 gap-6">
        {published.map(e => <div key={e.id} className="card overflow-hidden flex flex-col">
          <div className="h-48"><img loading="lazy" decoding="async" src={e.image} alt={e.title} className="w-full h-full object-cover" /></div>
          <div className="p-5 flex flex-col gap-2.5 flex-1"><h4 className="font-semibold text-lg">{e.title}</h4><span className="text-xs text-navy-500 flex items-center gap-1.5"><Calendar size={13} />{formatDate(e.date)}</span><span className="text-xs text-navy-500 flex items-center gap-1.5"><Users size={13} />{e.capacity} capacity</span><p className="text-sm text-navy-500">{e.description}</p><div className="flex items-center justify-between mt-auto pt-3"><b className="font-display">{naira(e.price)}</b><ReserveSpotButton eventId={e.id} eventTitle={e.title} eventDate={formatDate(e.date)} price={e.price} capacity={e.capacity} /></div></div>
        </div>)}
      </div>
    </div></section>
    <section className="section border-t border-black/5 bg-cream-50"><div className="container-w"><SectionHeading eyebrow="Make it yours" title="Host your event at Blue Pair" subtitle="Our event hall in Uromi welcomes celebrations, meetings and gatherings. Capacity depends on the seating arrangement; enquire with our team for a tailored setup." /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[{name:'General event',capacity:'250 guests'},{name:'Board meetings',capacity:'250–300 guests*'},{name:'Corporate events',capacity:'200 guests'},{name:'Birthday parties',capacity:'180–200 guests'},{name:'Destination weddings',capacity:'150–200 guests'},{name:'Church programmes',capacity:'250 guests'}].map(item=><div key={item.name} className="rounded-xl border border-black/[.07] bg-white p-5"><p className="text-xs text-navy-400">Event hall</p><h3 className="mt-1 font-semibold">{item.name}</h3><p className="mt-2 font-display text-xl text-navy-900">{item.capacity}</p></div>)}</div><p className="mt-4 text-xs text-navy-500">*A 300-person board-meeting arrangement requires confirmation by the hotel. All capacities vary with seating and room layout.</p><Link href="/contact" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-navy-900 underline underline-offset-4 hover:text-gold-700">Enquire about the event hall <ArrowRight size={14}/></Link></div></section>
  </div>
}
