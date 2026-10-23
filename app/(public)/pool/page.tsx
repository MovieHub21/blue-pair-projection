import { buildMetadata } from '../../../lib/buildMetadata'
import AmenityPage from '../../../components/ui/AmenityPage'
import { resolveAmenityConfig } from '../../../lib/amenity'

export const metadata = buildMetadata({
  title: 'Indoor Swimming Pool in Uromi, Edo State | Blue Pair Signature',
  description: "Visit the indoor swimming pool at Blue Pair Signature in Uromi. Day entry is available for adults and children, with special-event access arranged by enquiry.",
  keywords: 'indoor swimming pool Uromi, hotel with swimming pool Uromi, swimming pool in Uromi, Blue Pair Signature pool',
  path: '/pool',
})

export default async function PoolPage() {
  const config = await resolveAmenityConfig('pool', {
    name: 'Indoor Pool', eyebrow: 'Swim year-round', mini: 'AN EXPERIENCE FOR THE SENSES',
    heroImage: 'https://bluepairsignature.com/images/blue-pair-pool.jpeg',
    description: 'A temperature-controlled indoor pool section and poolside service from the Outdoor Bar & Eatery.',
    gallery: [
      'https://bluepairsignature.com/images/blue-pair-pool.jpeg',
      'https://bluepairsignature.com/images/pool2.JPG',
      'https://images.unsplash.com/photo-1600965962361-9035dbfd1c50?auto=format&fit=crop&w=900&q=80',
    ],
    hours: 'Daily, 7:00 AM – 7:00 PM',
    facilities: ['Temperature-controlled water', 'Poolside towel service', 'Lifeguard on duty', 'Poolside food & drink menu', 'Sun loungers & cabanas'],
    pricingNote: '',
    ctaLabel: 'Enquire',
    breadcrumbs: [{name:'Home',path:'/'},{name:'Indoor Pool',path:'/pool'}],
    extra: (
      <div className="mt-8 space-y-5 rounded-xl2 bg-cream-100 p-5 text-sm text-navy-600">
        <div><b className="mb-2 block text-navy-900">Pool entry</b><div className="flex justify-between gap-4 border-b border-black/5 py-2"><span>Adult</span><b>₦3,000</b></div><div className="flex justify-between gap-4 py-2"><span>Children</span><b>₦2,000</b></div></div>
        <p className="text-xs leading-5">For birthdays and other occasions, the pool may be opened outside normal hours with prior hotel approval. Contact us to enquire about special-event or after-hours access. Pool entry is arranged by enquiry; online ticketing is not available.</p>
        <a href="/contact" className="inline-flex text-xs font-semibold text-navy-900 underline underline-offset-4 hover:text-gold-700">Enquire about the pool <span aria-hidden="true">→</span></a>
        <div className="border-t border-black/5 pt-4"><b className="mb-1.5 block text-navy-900">Pool rules</b>Children under 12 must be supervised at all times. No glass containers poolside. Swimwear required — no street clothing in the pool.</div>
      </div>
    )
  })
  return <AmenityPage config={config} />
}
