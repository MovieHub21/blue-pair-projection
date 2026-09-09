import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { buildMetadata } from '../../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../../components/JsonLd'
import { SITE_URL } from '../../../../lib/siteConfig'
import { roomTypes } from '../../../../data/mock'
import RoomDetailsClient from './RoomDetailsClient'

export function generateStaticParams() {
  return roomTypes.map(r => ({ slug: r.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const room = roomTypes.find(r => r.slug === params.slug)
  if (!room) return buildMetadata({ title: 'Room Not Found', description: 'This room could not be found.', path: `/rooms/${params.slug}`, noindex: true })
  return buildMetadata({
    title: `${room.name} in Uromi, Edo State — ₦${room.price.toLocaleString()}/night | Blue Pair Hotel`,
    description: `${room.description} Sleeps ${room.guests}, ${room.bedType}, ${room.sizeSqm}m². Book the ${room.name} at Blue Pair Hotel, Uromi, Edo State, from ₦${room.price.toLocaleString()} per night.`,
    keywords: `${room.name.toLowerCase()} uromi, book ${room.category.toLowerCase()} room edo state, blue pair hotel ${room.category.toLowerCase()}, hotel room uromi price`,
    path: `/rooms/${room.slug}`,
    image: room.images[0],
  })
}

export default function RoomDetailsPage({ params }: { params: { slug: string } }) {
  const room = roomTypes.find(r => r.slug === params.slug)
  if (!room) notFound()
  const others = roomTypes.filter(r => r.id !== room.id).slice(0, 3)

  const breadcrumbs = [{name:'Home',path:'/'},{name:'Rooms & Suites',path:'/rooms'},{name:room.name,path:`/rooms/${room.slug}`}]
  const productJsonLd = {
    '@context': 'https://schema.org', '@type': 'Product', name: room.name, description: room.description, image: room.images[0],
    offers: { '@type': 'Offer', price: room.price, priceCurrency: 'NGN', availability: room.active ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut', url: `${SITE_URL}/rooms/${room.slug}` },
  }

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs, SITE_URL), productJsonLd]} />
      <RoomDetailsClient room={room} others={others} />
    </>
  )
}
