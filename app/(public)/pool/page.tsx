import { buildMetadata } from '../../../lib/buildMetadata'
import AmenityPage from '../../../components/ui/AmenityPage'

export const metadata = buildMetadata({
  title: 'Indoor Swimming Pool in Uromi, Edo State | Blue Pair Hotel',
  description: "Temperature-controlled indoor pool at Blue Pair Hotel, Uromi, Edo State — kids' section, poolside service and cabanas. Open daily 6am–9pm.",
  keywords: 'indoor pool uromi, swimming pool edo state, hotel pool uromi, hotel with pool esan north-east, blue pair hotel pool',
  path: '/pool',
})

export default function PoolPage() {
  return <AmenityPage config={{
    name: 'Indoor Pool', eyebrow: 'Swim year-round',
    heroImage: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1600&q=80',
    description: 'A temperature-controlled indoor pool with a dedicated kids\u2019 section and poolside service from the Outdoor Bar & Eatery.',
    gallery: [
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1600965962361-9035dbfd1c50?auto=format&fit=crop&w=900&q=80',
    ],
    hours: 'Daily, 6:00 AM – 9:00 PM',
    facilities: ['Temperature-controlled water', 'Dedicated kids\u2019 section', 'Poolside towel service', 'Lifeguard on duty', 'Poolside food & drink menu', 'Sun loungers & cabanas'],
    pricingNote: 'Complimentary for hotel guests. Day pass for non-guests: ₦15,000 (includes one drink).',
    ctaLabel: 'Reserve a cabana',
    breadcrumbs: [{name:'Home',path:'/'},{name:'Indoor Pool',path:'/pool'}],
    extra: (
      <div className="mt-8 bg-cream-100 rounded-xl2 p-5 text-sm text-navy-600">
        <b className="block mb-1.5 text-navy-900">Pool rules</b>
        Children under 12 must be supervised at all times. No glass containers poolside. Swimwear required — no street clothing in the pool.
      </div>
    )
  }} />
}
