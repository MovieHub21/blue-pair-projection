import { buildMetadata } from '../../lib/buildMetadata'
import { getRoomTypes, getOffers, getGalleryImages, getSiteContent } from '../../lib/data'
import { getPublishedGuestReviews } from '../../lib/reviews'
import HomeClient from './HomeClient'
import GuestReviews from '../../components/public/GuestReviews'

export const metadata = buildMetadata({
  title: 'Blue Pair Hotel — Luxury Hotel in Uromi, Edo State',
  description: "Book Blue Pair Hotel, Uromi's 5-star address in Edo State for rooms & suites, fine dining, an indoor pool, VIP lounge and events. Reserve your stay online.",
  keywords: 'hotel in uromi, hotel in edo state, luxury hotel uromi, hotel esan north-east, book hotel uromi, blue pair hotel, 5 star hotel edo state, hotel near ekpoma, hotel near auchi',
  path: '/',
})

export default async function HomePage() {
  const [roomTypes, offers, gallery, content, reviews] = await Promise.all([getRoomTypes(), getOffers(true), getGalleryImages(), getSiteContent(), getPublishedGuestReviews(8)])
  return <>
    <HomeClient roomTypes={roomTypes} offers={offers} gallery={gallery} headline={content.home_headline} subtitle={content.home_subtitle} />
    <GuestReviews reviews={reviews} />
  </>
}
