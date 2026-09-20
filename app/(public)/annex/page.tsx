import Link from 'next/link'
import { getAmenity, getPublishedAmenities, getShortLets } from '../../../lib/data'
import { notFound } from 'next/navigation'
import { buildMetadata } from '../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../components/JsonLd'
import { SITE_URL } from '../../../lib/siteConfig'
import PageHero from '../../../components/layout/PageHero'
import SectionHeading from '../../../components/ui/SectionHeading'
import { ArrowRight } from 'lucide-react'

export async function generateMetadata() { const home = await getAmenity('annex-home'); return buildMetadata({ title: home?.name || 'The Annex', description: home?.description || '', keywords: 'blue pair annex, short-let uromi, annex restaurant uromi, annex bar edo state', path: '/annex', image: home?.heroImage || undefined }) }

const breadcrumbs = [{name:'Home',path:'/'},{name:'The Annex',path:'/annex'}]

export default async function AnnexPage() {
  const [home, allAmenities, shortLets] = await Promise.all([getAmenity('annex-home'), getPublishedAmenities('annex-'), getShortLets()])
  if (!home || !home.published) notFound()
  const amenities = allAmenities.filter(a => a.key !== 'annex-home')
  const heroImage = home.heroImage || amenities[0]?.heroImage || shortLets[0]?.image || ''
  return (
    <div>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs, SITE_URL)} />
      <PageHero image={heroImage}
        eyebrow={home.eyebrow} title={home.name} crumbs="Home / The Annex" height="h-80" />
      <section className="section">
        <div className="container-w">
          <SectionHeading eyebrow={home.ctaLabel || home.eyebrow} title={home.name} subtitle={home.description} />
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {amenities.map(a => (
              <Link key={a.key} href={`/annex/${a.key.replace(/^annex-/, '')}`} className="card overflow-hidden group">
                <div className="h-40 overflow-hidden">{a.heroImage ? <img loading="lazy" decoding="async" src={a.heroImage} alt={a.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full bg-cream-100" />}</div>
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
