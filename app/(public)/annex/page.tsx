import Link from 'next/link'
import { getPublishedAmenities, getShortLets } from '../../../lib/data'
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

export default async function AnnexPage() {
  const [amenities, shortLets] = await Promise.all([getPublishedAmenities('annex-'), getShortLets()])
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
            {amenities.map(a => (
              <Link key={a.key} href={`/annex/${a.key.replace(/^annex-/, '')}`} className="card overflow-hidden group">
                <div className="h-40 overflow-hidden">{a.heroImage ? <img src={a.heroImage} alt={a.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full bg-cream-100" />}</div>
                <div className="p-5">
                  <h4 className="font-semibold">{a.name}</h4>
                  <p className="text-xs text-navy-500 mt-1">{a.description}</p>
                  <span className="text-xs font-semibold text-navy-900 mt-3 flex items-center gap-1">Explore <ArrowRight size={12} /></span>
                </div>
              </Link>
            ))}
            {shortLets.length > 0 && <Link href="/annex/shortlets" className="card p-5 group">
              <h4 className="font-semibold">Accommodation & Short-lets</h4>
              <p className="text-xs text-navy-500 mt-1">{shortLets.length} property{shortLets.length === 1 ? '' : 'ies'} available in the database.</p>
              <span className="text-xs font-semibold text-navy-900 mt-3 flex items-center gap-1">Explore <ArrowRight size={12} /></span>
            </Link>}
          </div>
        </div>
      </section>
    </div>
  )
}
