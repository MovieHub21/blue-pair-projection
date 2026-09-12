import { buildMetadata } from '../../lib/buildMetadata'
import { SITE_NAME } from '../../lib/siteConfig'
import { getRoomTypes, getOffers, getGalleryImages, getSiteContent } from '../../lib/data'
import { getPublishedGuestReviews } from '../../lib/reviews'
import HomeClient from './HomeClient'
import GuestReviews from '../../components/public/GuestReviews'

export const metadata = buildMetadata({
  title: `${SITE_NAME} — Luxury Hotel in Uromi, Edo State`,
  description: `Book ${SITE_NAME}, a premium hotel in Uromi, Edo State, Nigeria, for rooms and suites, dining, an indoor pool, VIP lounge, events and short-let accommodation. Reserve your stay online.`,
  keywords: 'hotel in uromi, hotel in edo state, luxury hotel uromi, hotel esan north-east, book hotel uromi, Blue Pair Signature Crown Hotel & Suites, Blue Pair Signature Crown, hotel near ekpoma, hotel near auchi',
  path: '/',
})

export default async function HomePage() {
  const [roomTypes, offers, gallery, content, reviews] = await Promise.all([getRoomTypes(), getOffers(true), getGalleryImages(), getSiteContent(), getPublishedGuestReviews(8)])
  return <>
    <HomeClient roomTypes={roomTypes} offers={offers} gallery={gallery} headline={content.home_headline} subtitle={content.home_subtitle} />
    <GuestReviews reviews={reviews} />
  </>
}
