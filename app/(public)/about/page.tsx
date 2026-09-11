import { buildMetadata } from '../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../components/JsonLd'
import { SITE_URL } from '../../../lib/siteConfig'
import PageHero from '../../../components/layout/PageHero'
import SectionHeading from '../../../components/ui/SectionHeading'
import { getGalleryImages, getSiteContent } from '../../../lib/data'
import { CheckCircle2 } from 'lucide-react'

export const metadata = buildMetadata({
  title: "About Blue Pair Hotel | Uromi's Premier Luxury Hotel Brand",
  description: 'Discover the story behind Blue Pair Hotel — a homegrown Nigerian luxury hospitality brand in Uromi, Edo State, welcoming guests since 2014.',
  keywords: 'blue pair hotel history, luxury hotel brand edo state, about blue pair hotel, hotel uromi story',
  path: '/about',
})

const breadcrumbs = [{name:'Home',path:'/'},{name:'About',path:'/about'}]

export default async function AboutPage() {
  const [gallery, content] = await Promise.all([getGalleryImages(), getSiteContent()])
  return (
    <div>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs, SITE_URL)} />
      <PageHero image="https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1600&q=80"
        eyebrow="Our story" title="About Blue Pair Hotel" crumbs="Home / About" height="h-80" />
      <section className="section">
        <div className="container-w grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="eyebrow">Since 2014</span>
            <h2 className="text-3xl md:text-4xl font-semibold mt-3 mb-5">{content.about_title || 'A Nigerian hospitality brand, built to compete anywhere'}</h2>
            <p className="text-navy-500 text-[15px] leading-relaxed mb-4">Blue Pair Hotel opened on Auchi Road, Uromi in 2014 with a simple premise: Edo State deserved a hotel that matched Esan hospitality with world-class standards, without guests needing to travel to Lagos or Abuja for it. Twelve years on, Blue Pair is a full campus — the main hotel, the Annex short-let residences, two restaurants, three bars, an indoor pool, a club, and an events hall — serving Uromi, Ekpoma, Auchi, Ubiaja and beyond.</p>
            <p className="text-navy-500 text-[15px] leading-relaxed">Every department, from housekeeping to the kitchen, is trained and managed in-house. Nothing here is outsourced — which is why the same warmth shows up whether you're checking into a Standard Room or hosting 200 guests in the Grand Hall.</p>
          </div>
          <div className="h-[420px] rounded-xl2 overflow-hidden">
            <img src="https://images.unsplash.com/photo-1519167758481-83f29c8e8de8?auto=format&fit=crop&w=1000&q=80" alt="Blue Pair Hotel event space, Uromi, Edo State" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>
      <section className="section bg-navy-950 text-white">
        <div className="container-w">
          <SectionHeading eyebrow="Hospitality philosophy" title="What guests can expect" light center
            subtitle="Four principles that shape every department at Blue Pair." />
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { t: 'Warm, not scripted', d: 'Staff are trained on judgment, not just scripts — every guest interaction is genuine.' },
              { t: 'Detail over decoration', d: 'We spend on mattresses and water pressure before we spend on lobby flowers.' },
              { t: 'Proudly Edo', d: 'Our menus, music, and events celebrate Esan and Edo culture, with global-standard execution.' },
              { t: 'Always improving', d: 'Every guest request feeds back into how we run the property, department by department.' },
            ].map(v => (
              <div key={v.t} className="bg-white/5 border border-white/10 rounded-xl2 p-6">
                <CheckCircle2 size={18} className="text-gold-400 mb-4" />
                <h4 className="font-semibold mb-2">{v.t}</h4>
                <p className="text-white/55 text-sm leading-relaxed">{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container-w">
          <SectionHeading eyebrow="Gallery" title="Around the property" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {gallery.map(g => <div key={g.id} className="h-48 rounded-xl2 overflow-hidden"><img src={g.url} alt={g.caption || 'Blue Pair Hotel, Uromi, Edo State'} className="w-full h-full object-cover" /></div>)}
          </div>
        </div>
      </section>
    </div>
  )
}
