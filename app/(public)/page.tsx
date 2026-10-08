import { buildMetadata } from '../../lib/buildMetadata'
import { SITE_NAME } from '../../lib/siteConfig'
import { getRoomTypes, getRooms, getOffers, getGalleryImages, getSiteContent } from '../../lib/data'
import { getPublishedGuestReviews } from '../../lib/reviews'
import HomeClient from './HomeClient'
import GuestReviews from '../../components/public/GuestReviews'

export const metadata = buildMetadata({
  title: 'Hotels in Uromi | Blue Pair Signature',
  description: `Book ${SITE_NAME}, a premium hotel in Uromi, Edo State, Nigeria, for rooms and suites, dining, an indoor pool, VIP lounge, events and short-let accommodation. Reserve your stay online.`,
  keywords: 'hotel in Uromi, hotels in Uromi Edo State, book a hotel in Uromi, hotel rooms in Uromi, Blue Pair Hotel, Blue Pair Signature Crown Hotel & Suites',
  path: '/',
})

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage() {
  const [roomTypes, rooms, offers, gallery, content, reviews] = await Promise.all([getRoomTypes(), getRooms(), getOffers(true), getGalleryImages(), getSiteContent(), getPublishedGuestReviews(8)])
  return <>
    <HomeClient roomTypes={roomTypes} rooms={rooms} offers={offers} gallery={gallery} headline={content.home_headline} subtitle={content.home_subtitle} hotelAddress={content.hotel_address} />
    <GuestReviews reviews={reviews} />
  </>
}
