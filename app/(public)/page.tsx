import { buildMetadata } from '../../lib/buildMetadata'
import { SITE_NAME } from '../../lib/siteConfig'
import { getRoomTypes, getRooms, getOffers, getGalleryImages, getSiteContent } from '../../lib/data'
import { getGoogleMapsProfileUrl } from '../../lib/googleReviews'
import HomeClient from './HomeClient'
import GuestReviews from '../../components/public/GuestReviews'

export const metadata = buildMetadata({
  title: 'Hotels in Uromi | Blue Pair Signature',
  description: `Book ${SITE_NAME}, a premium hotel in Uromi, Edo State, Nigeria, for rooms and suites, dining, an indoor pool, VIP lounge, events and short-let accommodation. Reserve your stay online.`,
  keywords: 'hotels, hotel with swimming pool in uromi, hotel with gym in uromi, uromi hotel with 24/7 light, best hotel with constant light in uromi, hotel with free wifi in uromi, luxury hotel in uromi with pool, blue pair signature pool party, uromi gym and hotel lodging, hotel with game center in uromi, shortlet apartment with swimming pool uromi, hotels in uromi with solar power, hotel with constant power supply edo state, safe hotel with tight security in uromi, hotel with gym and bar uromi, hotels near me, hotel in Uromi, best hotel in uromi edo state, hotel uromi, blue pair, blue pair uromi, cheap hotel in uromi, best hotel in uromi, afforable hotel, hotels in Uromi Edo State, book a hotel in Uromi, hotel rooms in Uromi, Blue Pair Signature, Blue Pair Signature Crown Hotel & Suites, standard hotel in uromi, new hotel in uromi, biggest hotel in uromi, , blue pearl hotel in uromi, names of hotel in uromi, titan hotel uromi, the genesis hotel uromi photos, obehi hotel uromi, sambema hotel & suites uromi location, citadel hotel uromi price, blue pearl hotel uromi edo state, p man hotel uromi photos',
  path: '/',
})

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage() {
  const [roomTypes, rooms, offers, gallery, content] = await Promise.all([getRoomTypes(), getRooms(), getOffers(true), getGalleryImages(), getSiteContent()])
  return <>
    <HomeClient roomTypes={roomTypes} rooms={rooms} offers={offers} gallery={gallery} headline={content.home_headline} subtitle={content.home_subtitle} hotelAddress={content.hotel_address} />
    <GuestReviews mapsProfileUrl={getGoogleMapsProfileUrl()} />
  </>
}
