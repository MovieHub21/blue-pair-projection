import { buildMetadata } from '../../../lib/buildMetadata'
import AmenityPage from '../../../components/ui/AmenityPage'

export const metadata = buildMetadata({
  title: 'Hotel Gym & Fitness Centre in Uromi, Edo State | Blue Pair Hotel',
  description: 'Full-equipment fitness studio at Blue Pair Hotel, Uromi, Edo State — free weights, cardio machines and personal trainers. Open daily 5am–10pm, free for hotel guests.',
  keywords: 'hotel gym uromi, fitness centre edo state, gym near me uromi, hotel with gym esan north-east, blue pair hotel gym',
  path: '/gym',
})

export default function GymPage() {
  return <AmenityPage config={{
    name: 'Fitness Gym', eyebrow: 'Stay on routine',
    heroImage: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1600&q=80',
    description: 'A full-equipment fitness studio overlooking the pool deck, with personal trainers available on request.',
    gallery: [
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80',
    ],
    hours: 'Daily, 5:00 AM – 10:00 PM',
    facilities: ['Free weights & racks', 'Cardio machines', 'Personal trainers on request', 'Fresh towels provided', 'Changing rooms & showers', 'Bottled water station'],
    pricingNote: 'Complimentary for all hotel guests. Day passes for non-guests: ₦10,000.',
    ctaLabel: 'Book a trainer',
    breadcrumbs: [{name:'Home',path:'/'},{name:'Gym',path:'/gym'}],
  }} />
}
