import { buildMetadata } from '../../../lib/buildMetadata'
import AmenityPage from '../../../components/ui/AmenityPage'

export const metadata = buildMetadata({
  title: 'Games Room & Entertainment in Uromi, Edo State | Blue Pair Hotel',
  description: 'Pool tables, table tennis and a sports lounge at Blue Pair Hotel, Uromi, Edo State. Open daily 10am–midnight — free for VIP Suite guests.',
  keywords: 'games room uromi, pool table uromi, entertainment edo state, things to do in uromi, blue pair hotel games',
  path: '/games',
})

export default function GamesPage() {
  return <AmenityPage config={{
    name: 'Games & Entertainment', eyebrow: 'For every evening',
    heroImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1600&q=80',
    description: 'A dedicated games room with pool tables, table tennis, board games, and a big-screen sports lounge.',
    gallery: [
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1615117972428-52295aeb3c99?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1595326953832-6f9d3f39e4e7?auto=format&fit=crop&w=900&q=80',
    ],
    hours: 'Daily, 10:00 AM – 12:00 AM',
    facilities: ['2 pool tables', 'Table tennis', 'Board game library', 'Big-screen sports lounge', 'Snacks & drinks service', 'Console gaming corner'],
    pricingNote: 'Pool table: ₦3,000/hour. Table tennis: ₦2,000/hour. Free for VIP Suite guests.',
    ctaLabel: 'Reserve a table',
    breadcrumbs: [{name:'Home',path:'/'},{name:'Games',path:'/games'}],
  }} />
}
