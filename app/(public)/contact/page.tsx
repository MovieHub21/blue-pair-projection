import { buildMetadata } from '../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../components/JsonLd'
import { getSiteContent } from '../../../lib/data'
import { SITE_URL, SITE_ADDRESS_DISPLAY, SITE_PHONE_DISPLAY, SITE_EMAIL } from '../../../lib/siteConfig'
import PageHero from '../../../components/layout/PageHero'
import ContactForm from './ContactForm'
import { Phone, Mail, MapPin } from 'lucide-react'

export const metadata = buildMetadata({
  title: 'Contact Blue Pair Hotel | Uromi, Edo State',
  description: `Get in touch with Blue Pair Hotel, ${SITE_ADDRESS_DISPLAY}. Phone, email and directions.`,
  keywords: 'blue pair hotel contact, hotel uromi address, hotel phone number edo state, hotel near me uromi, hotel booking uromi, hotel reservations nigeria',
  path: '/contact',
})

const breadcrumbs = [{ name: 'Home', path: '/' }, { name: 'Contact', path: '/contact' }]

export default async function ContactPage() {
  const content = await getSiteContent()
  const address = content.hotel_address || SITE_ADDRESS_DISPLAY
  const phone = content.hotel_phone || SITE_PHONE_DISPLAY
  const email = content.hotel_email || SITE_EMAIL
  const intro = content.contact_intro || 'Questions about rooms, reservations, dining, events or the hotel? Send us a message and our team will get back to you.'

  return (
    <div>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs, SITE_URL)} />
      <PageHero image="https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1600&q=80" eyebrow="Get in touch" title="Contact Us" crumbs="Home / Contact" height="h-72" />
      <section className="section">
        <div className="container-w grid lg:grid-cols-2 gap-14">
          <div>
            <h3 className="text-2xl font-semibold mb-3">Send us a message</h3>
            <p className="text-sm text-navy-500 leading-relaxed mb-6">{intro}</p>
            <ContactForm />
          </div>
          <div className="flex flex-col gap-5">
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer" className="card p-6 flex items-center gap-4 hover:border-gold-400 transition-colors"><MapPin className="text-gold-500" /><div><b className="block text-sm">Address</b><span className="text-sm text-navy-500">{address}</span></div></a>
            <a href={`tel:${phone}`} className="card p-6 flex items-center gap-4 hover:border-gold-400 transition-colors"><Phone className="text-gold-500" /><div><b className="block text-sm">Phone</b><span className="text-sm text-navy-500">{phone}</span></div></a>
            <a href={`mailto:${email}`} className="card p-6 flex items-center gap-4 hover:border-gold-400 transition-colors"><Mail className="text-gold-500" /><div><b className="block text-sm">Email</b><span className="text-sm text-navy-500">{email}</span></div></a>
            <div className="h-56 rounded-xl2 bg-navy-100 flex items-center justify-center text-sm text-navy-400">Blue Pair Hotel · Uromi, Edo State</div>
          </div>
        </div>
      </section>
    </div>
  )
}
