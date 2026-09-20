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

const annexOutlets = [
  { key: 'annex-bar', path: '/annex/bar', name: 'Annex Bar', description: 'Drinks, cocktails and a relaxed evening atmosphere.' },
  { key: 'annex-grilling', path: '/annex/grilling', name: 'Annex Grilling', description: 'Freshly grilled chicken, fish, suya and other open-fire favourites.' },
  { key: 'annex-outdoor-eatery', path: '/annex/outdoor-eatery', name: 'Outdoor Eatery', description: 'Open-air dining, live music weekends and relaxed courtyard seating.' },
  { key: 'annex-restaurant', path: '/annex/restaurant', name: 'Annex Restaurant', description: 'Homestyle Nigerian dishes served at the Annex Restaurant.' },
  { key: 'annex-vip-lounge', path: '/annex/vip-lounge', name: 'VIP Lounge', description: 'A private, intimate lounge for small celebrations and relaxed evenings.' },
]

export default async function AnnexPage() {
  const [amenities, shortLets] = await Promise.all([getPublishedAmenities('annex-'), getShortLets()])
  const amenityMap = new Map(amenities.map(a => [a.key, a]))
  const heroImage = amenityMap.get('annex-home')?.heroImage || amenities.find(a => a.key !== 'annex-home')?.heroImage || shortLets[0]?.image || ''

  return (
    <div>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs, SITE_URL)} />
      <PageHero image={heroImage}
        eyebrow="A world of its own" title="The Annex" crumbs="Home / The Annex" height="h-80" />
      <section className="section">
        <div className="container-w">
          <SectionHeading eyebrow="The Annex" title="Everything the Annex has to offer"
            subtitle="Explore the Annex outlets, dining, drinks, leisure and short-let accommodation. Select an option below to view its dedicated page." />

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {annexOutlets.map(outlet => {
              const amenity = amenityMap.get(outlet.key)
              return (
                <Link key={outlet.key} href={outlet.path} className="card overflow-hidden group">
                  <div className="h-40 overflow-hidden">
                    {amenity?.heroImage ? (
                      <img loading="lazy" decoding="async" src={amenity.heroImage} alt={amenity.name || outlet.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-cream-100" />
                    )}
                  </div>
                  <div className="p-5">
                    <h4 className="font-semibold">{amenity?.name || outlet.name}</h4>
                    <p className="text-xs text-navy-500 mt-1">{amenity?.description || outlet.description}</p>
                    <span className="text-xs font-semibold text-navy-900 mt-3 flex items-center gap-1">Explore <ArrowRight size={12} /></span>
                  </div>
                </Link>
              )
            })}

            <Link href="/annex/shortlets" className="card overflow-hidden group">
              <div className="h-40 overflow-hidden">
                {shortLets[0]?.image ? (
                  <img loading="lazy" decoding="async" src={shortLets[0].image} alt="Annex short-let accommodation" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-cream-100" />
                )}
              </div>
              <div className="p-5">
                <h4 className="font-semibold">Accommodation & Short-lets</h4>
                <p className="text-xs text-navy-500 mt-1">Self-contained short-let apartments and duplexes for extended stays in Uromi.</p>
                <span className="text-xs font-semibold text-navy-900 mt-3 flex items-center gap-1">Explore <ArrowRight size={12} /></span>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
