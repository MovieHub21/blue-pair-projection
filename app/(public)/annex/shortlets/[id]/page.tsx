import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '../../../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../../../components/JsonLd'
import { SITE_URL } from '../../../../../lib/siteConfig'
import { getShortLets } from '../../../../../lib/data'
import { BedDouble, Home } from 'lucide-react'
import ShortLetGallery from './ShortLetGallery'
import ShortLetAmenities from './ShortLetAmenities'
import ShortLetBookingClient from './ShortLetBookingClient'


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
    image: sl.images?.[0] || sl.image,
  })
}

export default async function ShortLetDetailsPage({ params }: { params: { id: string } }) {
  const shortLets = await getShortLets()
  const sl = shortLets.find(s => s.id === params.id)
  if (!sl) notFound()
  const codeImages = sl.images?.length ? sl.images : (sl.image ? [sl.image] : [])

const breadcrumbs = [{ name: 'Home', path: '/' }, { name: 'The Annex', path: '/annex' }, { name: 'Short-lets', path: '/annex/shortlets' }, { name: sl.name, path: `/annex/shortlets/${sl.id}` }]
  const productJsonLd = {
    '@context': 'https://schema.org', '@type': 'Product', name: sl.name, description: sl.description, image: codeImages,
    offers: { '@type': 'Offer', price: sl.price, priceCurrency: 'NGN', availability: sl.available ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut' },
  }

  return (
    <div className="bg-cream-50 text-navy-900">
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs, SITE_URL), productJsonLd]} />

      <div className="mx-auto max-w-7xl px-5 pt-5 md:px-10 md:pt-7">
        <ShortLetGallery images={codeImages} name={sl.name} />
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-10 md:px-10 md:py-14 lg:grid-cols-[1.6fr,1fr] lg:items-start lg:gap-16">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[.22em] text-gold-600">{sl.type}</span>
          <h1 className="mt-2 font-display text-3xl leading-tight text-navy-950 md:text-4xl">{sl.name}</h1>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-navy-900/10 py-5 text-sm text-navy-700">
            <span className="flex items-center gap-2"><Home size={16} className="text-gold-600" /> Entire home</span>
            <span className="flex items-center gap-2"><BedDouble size={16} className="text-gold-600" /> {sl.bedrooms} bedroom{sl.bedrooms > 1 ? 's' : ''}</span>
          </div>

          <p className="mt-6 max-w-2xl text-[15px] leading-7 text-navy-700">{sl.description}</p>

          <div className="mt-10 border-t border-navy-900/10 pt-8">
            <ShortLetAmenities amenities={sl.amenities} />
          </div>
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="rounded-2xl border border-navy-900/10 bg-white p-6 shadow-[0_18px_46px_-24px_rgba(6,11,23,.25)]">
            <ShortLetBookingClient shortLet={{ id: sl.id, name: sl.name, price: sl.price, bedrooms: sl.bedrooms, available: sl.available }} />
          </div>
        </aside>
      </div>

      <div className="border-t border-navy-900/10 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-10 text-center md:px-10">
          <p className="text-sm text-navy-500">Looking for something else in The Annex?</p>
          <Link href="/annex/shortlets" className="mt-2 inline-block font-display text-lg text-navy-950 underline underline-offset-4 hover:text-gold-600">Browse all short-let properties</Link>
        </div>
      </div>
    </div>
  )
}
