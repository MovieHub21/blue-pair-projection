import { Suspense } from 'react'
import { buildMetadata } from '../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../components/JsonLd'
import { SITE_URL } from '../../../lib/siteConfig'
import PageHero from '../../../components/layout/PageHero'
import RoomsClient from './RoomsClient'

export const metadata = buildMetadata({
  title: 'Hotel Rooms & Suites in Uromi, Edo State | Prices & Online Booking',
  description: 'Browse Standard, Deluxe, Executive, Premium, Suite and VIP Suite rooms at Blue Pair Hotel, Uromi, Edo State. Compare prices in Naira and book online.',
  keywords: 'hotel rooms uromi, book hotel room edo state, uromi hotel rooms, cheap hotel uromi, vip suite edo state, hotel room prices uromi',
  path: '/rooms',
})

const breadcrumbs = [{name:'Home',path:'/'},{name:'Rooms & Suites',path:'/rooms'}]

export default function RoomsPage() {
  return (
    <div>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs, SITE_URL)} />
      <PageHero image="https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1600&q=80"
        eyebrow="Accommodation" title="Rooms & Suites" crumbs="Home / Rooms & Suites" />
      <Suspense>
        <RoomsClient />
      </Suspense>
    </div>
  )
}
