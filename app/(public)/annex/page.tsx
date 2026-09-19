import Link from 'next/link'
import { buildMetadata } from '../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../components/JsonLd'
import { SITE_URL } from '../../../lib/siteConfig'
import PageHero from '../../../components/layout/PageHero'
import SectionHeading from '../../../components/ui/SectionHeading'
import { ArrowRight } from 'lucide-react'

export const metadata = buildMetadata({
  title: 'The Annex — Short-lets, Bar & Restaurant in Uromi | Blue Pair Hotel',
  description: 'Explore the Blue Pair Hotel Annex in Uromi, Edo State — short-let apartments, an outdoor eatery and grill, a dedicated bar, VIP lounge and restaurant.',
  keywords: 'blue pair annex, short-let uromi, annex restaurant uromi, annex bar edo state, apartment for rent uromi',
  path: '/annex',
})

const breadcrumbs = [{name:'Home',path:'/'},{name:'The Annex',path:'/annex'}]

const sections = [
  { to: '/annex/shortlets', name: 'Accommodation & Short-lets', img: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=700&q=80', desc: 'Self-contained apartments for extended stays.' },
  { to: '/annex/outdoor-eatery', name: 'Outdoor Eatery', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=700&q=80', desc: 'Open-air dining under the stars.' },
  { to: '/annex/grilling', name: 'Grilling Section', img: 'https://images.unsplash.com/photo-1598515213692-5f252f9a90a6?auto=format&fit=crop&w=700&q=80', desc: 'Live-fire grill, fresh off the coal.' },
  { to: '/annex/bar', name: 'Annex Bar', img: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=700&q=80', desc: 'A relaxed, open-air drinks scene.' },
  { to: '/annex/vip-lounge', name: 'Annex VIP Lounge', img: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=700&q=80', desc: 'Private VIP seating within the Annex.' },
  { to: '/annex/restaurant', name: 'Annex Restaurant', img: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?auto=format&fit=crop&w=700&q=80', desc: 'Full-service dining, Annex side.' },
]

export default function AnnexPage() {
  return (
    <div>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs, SITE_URL)} />
      <PageHero image="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1600&q=80"
        eyebrow="A world of its own" title="The Annex" crumbs="Home / The Annex" height="h-80" />
      <section className="section">
        <div className="container-w">
          <SectionHeading eyebrow="Introducing" title="A second campus, built for longer stays and open-air evenings"
            subtitle="The Annex sits just behind the main hotel in Uromi — short-let apartments, an open-air eatery and grill, a dedicated bar and VIP lounge, and its own restaurant." />
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {sections.map(s => (
              <Link key={s.to} href={s.to} className="card overflow-hidden group">
                <div className="h-40 overflow-hidden"><img src={s.img} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>
                <div className="p-5">
                  <h4 className="font-semibold">{s.name}</h4>
                  <p className="text-xs text-navy-500 mt-1">{s.desc}</p>
                  <span className="text-xs font-semibold text-navy-900 mt-3 flex items-center gap-1">Explore <ArrowRight size={12} /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
