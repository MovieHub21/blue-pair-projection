import { buildMetadata } from '../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../components/JsonLd'
import { SITE_URL, SITE_ADDRESS_DISPLAY, SITE_PHONE_DISPLAY, SITE_EMAIL } from '../../../lib/siteConfig'
import PageHero from '../../../components/layout/PageHero'
import { Phone, Mail, MapPin } from 'lucide-react'

export const metadata = buildMetadata({
  title: 'Contact Blue Pair Hotel | Uromi, Edo State',
  description: `Get in touch with Blue Pair Hotel, ${SITE_ADDRESS_DISPLAY}. Phone, email and directions.`,
  keywords: 'blue pair hotel contact, hotel uromi address, hotel phone number edo state, hotel near me uromi',
  path: '/contact',
})

const breadcrumbs = [{name:'Home',path:'/'},{name:'Contact',path:'/contact'}]

export default function ContactPage() {
  return (
    <div>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs, SITE_URL)} />
      <PageHero image="https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1600&q=80"
        eyebrow="Get in touch" title="Contact Us" crumbs="Home / Contact" height="h-72" />
      <section className="section">
        <div className="container-w grid lg:grid-cols-2 gap-14">
          <div>
            <h3 className="text-2xl font-semibold mb-6">Send us a message</h3>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="field-label">Full name</label><input className="field-input" placeholder="Your name" /></div>
                <div><label className="field-label">Email</label><input className="field-input" placeholder="you@email.com" /></div>
              </div>
              <div><label className="field-label">Subject</label><input className="field-input" placeholder="How can we help?" /></div>
              <div><label className="field-label">Message</label><textarea className="field-input !h-auto py-2.5" rows={5} /></div>
              <button className="btn-primary w-fit">Send message</button>
            </div>
          </div>
          <div className="flex flex-col gap-5">
            <div className="card p-6 flex items-center gap-4"><MapPin className="text-gold-500" /><div><b className="block text-sm">Address</b><span className="text-sm text-navy-500">{SITE_ADDRESS_DISPLAY}</span></div></div>
            <div className="card p-6 flex items-center gap-4"><Phone className="text-gold-500" /><div><b className="block text-sm">Phone</b><span className="text-sm text-navy-500">{SITE_PHONE_DISPLAY}</span></div></div>
            <div className="card p-6 flex items-center gap-4"><Mail className="text-gold-500" /><div><b className="block text-sm">Email</b><span className="text-sm text-navy-500">{SITE_EMAIL}</span></div></div>
            <div className="h-56 rounded-xl2 bg-navy-100" />
          </div>
        </div>
      </section>
    </div>
  )
}
