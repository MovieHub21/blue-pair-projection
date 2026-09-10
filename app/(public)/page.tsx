import { buildMetadata } from '../../lib/buildMetadata'
import { getRoomTypes, getOffers } from '../../lib/data'
import HomeClient from './HomeClient'

export const metadata = buildMetadata({
  title: 'Blue Pair Hotel — Luxury Hotel in Uromi, Edo State',
  description: "Book Blue Pair Hotel, Uromi's 5-star address in Edo State for rooms & suites, fine dining, an indoor pool, VIP lounge and events. Reserve your stay online.",
  keywords: 'hotel in uromi, hotel in edo state, luxury hotel uromi, hotel esan north-east, book hotel uromi, blue pair hotel, 5 star hotel edo state, hotel near ekpoma, hotel near auchi',
  path: '/',
})

export default async function HomePage() {
  const [roomTypes, offers] = await Promise.all([getRoomTypes(), getOffers(true)])
  return <HomeClient roomTypes={roomTypes} offers={offers} />
}
