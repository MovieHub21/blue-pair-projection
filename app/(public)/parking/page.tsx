import { buildMetadata } from '../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../components/JsonLd'
import { SITE_URL } from '../../../lib/siteConfig'
import PageHero from '../../../components/layout/PageHero'
import SectionHeading from '../../../components/ui/SectionHeading'
import { parkingZones } from '../../../store/useStore'
import { Car, ShieldCheck } from 'lucide-react'

export const metadata = buildMetadata({
  title: 'Hotel Parking & VIP Parking in Uromi, Edo State',
  description: 'Secure on-site parking at Blue Pair Hotel, Uromi, Edo State — complimentary guest parking plus a dedicated VIP courtyard.',
  keywords: 'hotel parking uromi, vip parking edo state, secure parking uromi hotel',
  path: '/parking',
})

const breadcrumbs = [{name:'Home',path:'/'},{name:'Parking',path:'/parking'}]

export default function ParkingPage() {
  return (
    <div>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs, SITE_URL)} />
      <PageHero image="https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1600&q=80"
        eyebrow="Getting here" title="Parking" crumbs="Home / Parking" height="h-72" />
      <section className="section">
        <div className="container-w">
          <SectionHeading eyebrow="On-site parking" title="Secure parking for every guest"
            subtitle="Complimentary parking for all hotel guests, with a dedicated VIP courtyard for suite bookings and event guests." />
          <div className="grid md:grid-cols-3 gap-6 mb-14">
            {parkingZones.map(z => {
              const pct = Math.round((z.occupied / z.capacity) * 100)
              return (
                <div key={z.id} className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold flex items-center gap-2"><Car size={16} className="text-gold-500" />{z.name}</h4>
                    <span className={z.type === 'VIP' ? 'pill-gold' : 'pill-blue'}>{z.type}</span>
                  </div>
                  <div className="h-2 rounded-full bg-cream-100 overflow-hidden mb-2">
                    <div className="h-full bg-navy-900 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-navy-500">{z.occupied} / {z.capacity} spaces occupied</span>
                </div>
              )
            })}
          </div>
          <div className="card p-7 flex gap-4 items-start">
            <ShieldCheck size={22} className="text-gold-500 shrink-0 mt-0.5" />
            <div>
              <b className="block mb-2">Parking rules</b>
              <ul className="text-sm text-navy-500 space-y-1.5 list-disc pl-4">
                <li>Complimentary for all hotel guests, restaurant &amp; club patrons with a minimum spend.</li>
                <li>VIP courtyard reserved for VIP Suite guests and pre-booked event guests.</li>
                <li>Valet available at the main entrance, 24 hours.</li>
                <li>The hotel is not liable for items left in unattended vehicles.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
