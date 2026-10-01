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

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'The Annex', path: '/annex' },
    { name: 'Short-lets', path: '/annex/shortlets' },
    { name: sl.name, path: `/annex/shortlets/${sl.id}` },
  ]

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: sl.name,
    description: sl.description,
    image: codeImages,
    offers: {
      '@type': 'Offer',
      price: sl.price,
      priceCurrency: 'NGN',
      availability: sl.available ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
    },
  }

  return (
    <div className="bg-cream-50 text-navy-900">
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs, SITE_URL), productJsonLd]} />

      <div className="container-w min-w-0 max-w-full overflow-x-hidden px-4 py-8 sm:px-6 md:px-10">
        <Link href="/annex/shortlets" className="text-xs text-navy-400 hover:text-navy-700">
          ← Back to Short-lets
        </Link>

        <div className="grid min-w-0 max-w-full gap-8 mt-5 lg:grid-cols-[1.35fr,.65fr]">
          <div className="min-w-0 max-w-full">
            <ShortLetGallery images={codeImages} name={sl.name} />

            <span className="eyebrow mt-8 inline-block">{sl.type} · The Annex</span>
            <h1 className="text-4xl font-semibold mt-2">{sl.name}</h1>

            <p className="text-xs text-navy-400 mt-2">
              Entire home · {sl.bedrooms} bedroom{sl.bedrooms > 1 ? 's' : ''}
            </p>

            <p className="text-navy-500 leading-relaxed mt-4">{sl.description}</p>

            <div className="flex flex-wrap gap-8 py-6 my-6 border-y border-black/10">
              <div className="flex gap-2">
                <Home size={18} className="text-gold-500" />
                <b>Entire home</b>
              </div>

              <div className="flex gap-2">
                <BedDouble size={18} className="text-gold-500" />
                <b>{sl.bedrooms} bedroom{sl.bedrooms > 1 ? 's' : ''}</b>
              </div>
            </div>

            <ShortLetAmenities amenities={sl.amenities} />
          </div>

          <aside className="card p-6 h-fit sticky top-24 min-w-0 max-w-full">
            <ShortLetBookingClient
              shortLet={{
                id: sl.id,
                name: sl.name,
                price: sl.price,
                bedrooms: sl.bedrooms,
                available: sl.available,
              }}
            />
          </aside>
        </div>
      </div>

      <div className="border-t border-navy-900/10 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-10 text-center md:px-10">
          <p className="text-sm text-navy-500">Looking for something else in The Annex?</p>
          <Link href="/annex/shortlets" className="mt-2 inline-block font-display text-lg text-navy-950 underline underline-offset-4 hover:text-gold-600">
            Browse all short-let properties
          </Link>
        </div>
      </div>
    </div>
  )
}
