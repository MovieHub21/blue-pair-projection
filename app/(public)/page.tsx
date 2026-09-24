import { buildMetadata } from '../../lib/buildMetadata'
import { SITE_NAME } from '../../lib/siteConfig'
import { getRoomTypes, getRooms, getOffers, getGalleryImages, getSiteContent } from '../../lib/data'
import { getPublishedGuestReviews } from '../../lib/reviews'
import HomeClient from './HomeClient'
import GuestReviews from '../../components/public/GuestReviews'

export const metadata = buildMetadata({
  title: 'Hotels in Uromi | Blue Pair Hotel',
  description: `Book ${SITE_NAME}, a premium hotel in Uromi, Edo State, Nigeria, for rooms and suites, dining, an indoor pool, VIP lounge, events and short-let accommodation. Reserve your stay online.`,
  keywords: 'hotels in uromi, hotels in uromi edo state, hotel in uromi, hotels in uromi edo state nigeria, hotels in uromi nigeria, best hotel in uromi edo state, best hotels in uromi, biggest hotel in uromi nigeria, cheap hotels in uromi, hotel in edo state, luxury hotel uromi, hotel esan north-east, book hotel uromi, Blue Pair Signature Crown Hotel & Suites, Blue Pair Signature Crown, hotel near ekpoma, hotel near auchi',
  path: '/',
})

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage() {
  const [roomTypes, rooms, offers, gallery, content, reviews] = await Promise.all([getRoomTypes(), getRooms(), getOffers(true), getGalleryImages(), getSiteContent(), getPublishedGuestReviews(8)])
  return <>
    <HomeClient roomTypes={roomTypes} rooms={rooms} offers={offers} gallery={gallery} headline={content.home_headline} subtitle={content.home_subtitle} />
    <GuestReviews reviews={reviews} />
  </>
}
