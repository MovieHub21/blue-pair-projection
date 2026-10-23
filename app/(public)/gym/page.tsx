import { buildMetadata } from '../../../lib/buildMetadata'
import AmenityPage from '../../../components/ui/AmenityPage'
import GymHeroVideo from '../../../components/ui/GymHeroVideo'
import { resolveAmenityConfig } from '../../../lib/amenity'
import Link from 'next/link'

export const metadata = buildMetadata({
  title: 'Hotel Gym & Fitness Centre in Uromi, Edo State | Blue Pair Hotel',
  description: 'A full-equipment fitness studio at Blue Pair Hotel in Uromi, with daily morning and evening sessions and membership options for local visitors.',
  keywords: 'gym in Uromi, hotel gym Uromi, fitness centre Uromi, Blue Pair Hotel gym',
  path: '/gym',
})

export default async function GymPage() {
  const config = await resolveAmenityConfig('gym', {
    name: 'Fitness Gym', eyebrow: 'Stay on routine', mini: 'AN EXPERIENCE FOR THE SENSES',

    heroImage: 'https://www.bluepairsignature.com/images/blue-pair-gym.jpeg',
    heroVideo: <GymHeroVideo poster="https://www.bluepairsignature.com/image/blue-pair-gym.jpeg" />,

    description: 'A full-equipment fitness studio overlooking the pool deck, with personal trainers available on request.',
    gallery: [
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=900&q=80',
      'https://www.bluepairsignature.com/images/blue-pair-gym.jpeg',
    ],
    hours: 'Morning: 6:00 AM – 10:00 AM · Evening: 5:00 PM – 9:00 PM',
    facilities: ['Free weights & racks', 'Cardio machines', 'Personal trainers on request', 'Fresh towels provided', 'Changing rooms & showers', 'Bottled water station'],
    pricingNote: '',
    ctaLabel: 'Enquire',
    breadcrumbs: [{name:'Home',path:'/'},{name:'Gym',path:'/gym'}],
    extra: <div className="mt-8 rounded-xl2 bg-cream-100 p-5 text-sm text-navy-600"><h3 className="font-semibold text-navy-900">Gym membership</h3><div className="mt-3 divide-y divide-black/5 text-xs"><div className="flex justify-between gap-3 py-2"><span>Monthly · first-time member</span><b>₦25,000</b></div><div className="flex justify-between gap-3 py-2"><span>Monthly · returning member</span><b>₦20,000</b></div><div className="flex justify-between gap-3 py-2"><span>Daily session</span><b>₦2,000</b></div></div><p className="mt-3 text-xs leading-5">A second membership option is ₦15,000 for first-time members and ₦11,000 for returning members Bi-Weekly.</p><Link href="/contact" className="mt-4 inline-flex text-xs font-semibold text-navy-900 underline underline-offset-4 hover:text-gold-700">Ask about gym membership <span aria-hidden="true">→</span></Link></div>,
  })
  return <AmenityPage config={config} />
}
