import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { buildMetadata } from '../../../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../../../components/JsonLd'
import { SITE_URL } from '../../../../../lib/siteConfig'
import { getShortLets } from '../../../../../lib/data'
import { naira } from '../../../../../lib/format'
import { CheckCircle2, BedDouble } from 'lucide-react'

export async function generateStaticParams() {
  const shortLets = await getShortLets()
  return shortLets.map(sl => ({ id: sl.id }))
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const shortLets = await getShortLets()
  const sl = shortLets.find(s => s.id === params.id)
  if (!sl) return buildMetadata({ title: 'Short-let Not Found', description: 'This property could not be found.', path: `/annex/shortlets/${params.id}`, noindex: true })
  return buildMetadata({
    title: `${sl.name} — Short-let in Uromi, Edo State | ₦${sl.price.toLocaleString()}/night`,
    description: `${sl.description} ${sl.bedrooms} bedrooms, from ₦${sl.price.toLocaleString()} per night at the Blue Pair Hotel Annex, Uromi, Edo State.`,
    keywords: `${sl.name.toLowerCase()}, short let uromi, ${sl.type.toLowerCase()} for rent edo state`,
    path: `/annex/shortlets/${sl.id}`,
    image: sl.image,
  })
}

export default async function ShortLetDetailsPage({ params }: { params: { id: string } }) {
  const shortLets = await getShortLets()
  const sl = shortLets.find(s => s.id === params.id)
  if (!sl) notFound()

  const breadcrumbs = [{name:'Home',path:'/'},{name:'The Annex',path:'/annex'},{name:'Short-lets',path:'/annex/shortlets'},{name:sl.name,path:`/annex/shortlets/${sl.id}`}]
  const productJsonLd = {
    '@context': 'https://schema.org', '@type': 'Product', name: sl.name, description: sl.description, image: sl.image,
    offers: { '@type': 'Offer', price: sl.price, priceCurrency: 'NGN', availability: sl.available ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut' },
  }

  return (
    <div>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs, SITE_URL), productJsonLd]} />
      <div className="container-w px-6 md:px-10 pt-6">
        <div className="text-xs text-navy-400 mb-4">Home / Annex / Short-lets / {sl.name}</div>
        <div className="h-96 rounded-xl2 overflow-hidden"><img src={sl.image} alt={sl.name} className="w-full h-full object-cover" /></div>
      </div>
      <section className="section grid lg:grid-cols-[1.6fr,1fr] gap-14 container-w items-start">
        <div>
          <span className="eyebrow">{sl.type}</span>
          <h1 className="text-3xl font-semibold mt-2 mb-4">{sl.name}</h1>
          <p className="text-navy-500 leading-relaxed max-w-xl">{sl.description}</p>
          <div className="flex items-center gap-2.5 mt-6 text-sm"><BedDouble size={16} className="text-gold-500" /><b>{sl.bedrooms} bedrooms</b></div>
          <h4 className="font-semibold mt-8 mb-4">Amenities</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            {sl.amenities.map(a => <div key={a} className="flex items-center gap-2.5 text-sm text-navy-700"><CheckCircle2 size={16} className="text-gold-500" />{a}</div>)}
          </div>
        </div>
        <aside className="card p-6">
          <div className="font-display text-2xl">{naira(sl.price)}<span className="text-xs font-body text-navy-400"> /night</span></div>
          <span className={'inline-block mt-3 ' + (sl.available ? 'pill-green' : 'pill-red')}>{sl.available ? 'Available' : 'Currently booked'}</span>
          <button disabled={!sl.available} className={'w-full justify-center mt-6 ' + (sl.available ? 'btn-primary' : 'btn-outline opacity-50 cursor-not-allowed')}>
            {sl.available ? 'Book this property' : 'Notify when available'}
          </button>
        </aside>
      </section>
    </div>
  )
}
