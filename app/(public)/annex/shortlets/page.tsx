import Link from 'next/link'
import { buildMetadata } from '../../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../../components/JsonLd'
import { SITE_URL } from '../../../../lib/siteConfig'
import PageHero from '../../../../components/layout/PageHero'
import SectionHeading from '../../../../components/ui/SectionHeading'
import { getShortLets } from '../../../../lib/data'
import { naira } from '../../../../lib/format'
import { BedDouble } from 'lucide-react'

export const metadata = buildMetadata({
  title: 'Short-let Apartments for Rent in Uromi, Edo State | Blue Pair Hotel Annex',
  description: 'Self-contained short-let apartments and duplexes at the Blue Pair Hotel Annex, Uromi, Edo State. Compare properties and prices.',
  keywords: 'short let uromi, short let apartment edo state, furnished apartment uromi rent, apartment for rent esan north-east',
  path: '/annex/shortlets',
})

const breadcrumbs = [{name:'Home',path:'/'},{name:'The Annex',path:'/annex'},{name:'Short-lets',path:'/annex/shortlets'}]

export default async function ShortLetsPage() {
  const shortLets = await getShortLets()
  return (
    <div>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs, SITE_URL)} />
      <PageHero image="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80"
        eyebrow="Extended stays" title="Accommodation & Short-lets" crumbs="Home / Annex / Short-lets" height="h-72" />
      <section className="section">
        <div className="container-w">
          <SectionHeading eyebrow="Available properties" title="Annex short-let listings" subtitle="Self-contained apartments and duplexes for stays of a week or longer, in Uromi, Edo State." />
          <div className="grid md:grid-cols-3 gap-6">
            {shortLets.map(sl => (
              <div key={sl.id} className="card overflow-hidden flex flex-col">
                <div className="h-48 relative">
                  <img src={sl.image} alt={sl.name} className="w-full h-full object-cover" />
                  <span className={'absolute top-3 left-3 ' + (sl.available ? 'pill-green' : 'pill-red') + ' bg-white/95'}>{sl.available ? 'Available' : 'Booked'}</span>
                </div>
                <div className="p-5 flex flex-col gap-2.5 flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold">{sl.name}</h4>
                    <span className="tag">{sl.type}</span>
                  </div>
                  <span className="text-xs text-navy-500 flex items-center gap-1.5"><BedDouble size={13} />{sl.bedrooms} bedroom{sl.bedrooms>1?'s':''}</span>
                  <div className="font-display text-lg">{naira(sl.price)}<span className="text-xs font-body text-navy-400"> /night</span></div>
                  <Link href={`/annex/shortlets/${sl.id}`} className="btn-outline btn-sm mt-auto justify-center">View property</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
