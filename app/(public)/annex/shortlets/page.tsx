
import Link from 'next/link'

import { buildMetadata } from '../../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../../components/JsonLd'
import { SITE_URL } from '../../../../lib/siteConfig'
import { getPublicShortLets } from '../../../../lib/data'
import { naira } from '../../../../lib/format'
import { BedDouble } from 'lucide-react'

export const metadata = buildMetadata({
  title: 'Short-let Apartments for Rent in Uromi, Edo State | Blue Pair Hotel Annex',
  description:
    'Self-contained short-let apartments and duplexes at the Blue Pair Hotel Annex, Uromi, Edo State. Compare properties and prices.',
  keywords:
    'short let uromi, short let apartment edo state, furnished apartment uromi rent, apartment for rent esan north-east, shortlet apartment in uromi,',
  path: '/annex/shortlets',
})

const breadcrumbs = [
  { name: 'Home', path: '/' },
  { name: 'The Annex', path: '/annex' },
  { name: 'Short-lets', path: '/annex/shortlets' },
]

export default async function ShortLetsPage() {
  const shortLets = await getPublicShortLets()

  const heroImage =
    shortLets.find((sl) => sl.images?.length)?.images?.[0] ||
    shortLets.find((sl) => sl.image)?.image ||
    ''

  return (
    <div className="bg-cream-50 text-navy-900">
      {/* A home to picture yourself in, not a room to book — full-bleed, quiet, no clutter. */}
      <div className="relative isolate overflow-hidden bg-navy-950 text-white">
        {heroImage && (
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 -z-10 h-full w-full object-cover opacity-55"
          />
        )}

        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(6,11,23,.5)_0%,rgba(6,11,23,.35)_45%,rgba(6,11,23,.92)_100%)]" />

        <div className="mx-auto max-w-7xl px-5 pb-16 pt-16 md:px-10 md:pb-20 md:pt-24">
          <span className="text-[11px] font-semibold uppercase tracking-[.26em] text-gold-400">
            Extended stays · The Annex
          </span>

          <h1 className="mt-4 max-w-2xl font-display text-4xl font-medium leading-[1.05] tracking-[-.02em] [text-wrap:balance] md:text-6xl">
            A home for as long as you need one.
          </h1>

          <p className="mt-5 max-w-lg text-sm leading-7 text-white/70 md:text-base">
            Self-contained apartments and duplexes in Uromi, Edo State — your
            own kitchen, your own space, and Blue Pair&apos;s hospitality close
            by.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-14 md:px-10 md:py-20">
        <div className="mb-9 flex items-end justify-between gap-6">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[.24em] text-gold-600">
              Available now
            </span>

            <h2 className="mt-2 font-display text-3xl md:text-4xl">
              {shortLets.length}{' '}
              {shortLets.length === 1 ? 'property' : 'properties'} to choose
              from
            </h2>
          </div>
        </div>

        <div className="grid gap-x-6 gap-y-11 sm:grid-cols-2 lg:grid-cols-3">
          {shortLets.map((sl) => {
            const images = sl.images?.length
              ? sl.images
              : sl.image
                ? [sl.image]
                : []

            const imageUrl = images[0]

            return (
              <Link
                key={sl.id}
                href={`/annex/shortlets/${sl.id}`}
                className="group block"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-navy-100">
                  {imageUrl && (
                    <img
                      loading="lazy"
                      decoding="async"
                      src={imageUrl}
                      alt={sl.name}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  )}

                  <span
                    className={
                      'absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold shadow-sm ' +
                      (sl.available
                        ? 'bg-white/95 text-emerald-700'
                        : 'bg-white/95 text-red-600')
                    }
                  >
                    {sl.available ? 'Available now' : 'Currently booked'}
                  </span>

                  {images.length > 1 && (
                    <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                      {images.length} photos
                    </span>
                  )}
                </div>

                <div className="mt-3.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-lg leading-tight text-navy-950">
                      {sl.name}
                    </h3>

                    <p className="mt-1 flex items-center gap-1.5 text-xs text-navy-500">
                      <BedDouble size={13} />
                      {sl.bedrooms} bedroom{sl.bedrooms > 1 ? 's' : ''}

                      <span className="text-navy-300">·</span>

                      {sl.type}
                    </p>
                  </div>
                </div>

                <p className="mt-2 font-display text-base text-navy-950">
                  {naira(sl.price)}{' '}
                  <span className="font-body text-xs font-normal text-navy-400">
                    / night
                  </span>
                </p>
              </Link>
            )
          })}
        </div>

        {shortLets.length === 0 && (
          <div className="rounded-xl border border-dashed border-navy-900/15 bg-white/60 px-6 py-16 text-center">
            <h3 className="font-display text-2xl">No properties listed yet</h3>

            <p className="mx-auto mt-2 max-w-sm text-sm text-navy-500">
              Please check back soon, or contact us and we&apos;ll gladly help
              you find a stay.
            </p>
          </div>
        )}
      </div>

      <JsonLd data={breadcrumbJsonLd(breadcrumbs, SITE_URL)} />
    </div>
  )
}

