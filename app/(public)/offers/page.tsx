import { buildMetadata } from '../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../components/JsonLd'
import { SITE_URL } from '../../../lib/siteConfig'
import PageHero from '../../../components/layout/PageHero'
import SectionHeading from '../../../components/ui/SectionHeading'
import { getOffers } from '../../../lib/data'

export const metadata = buildMetadata({
  title: 'Hotel Deals & Discounts in Uromi, Edo State | Blue Pair Hotel Offers',
  description: 'Current room, restaurant and seasonal offers at Blue Pair Hotel, Uromi, Edo State. Save on your next stay.',
  keywords: 'hotel deals uromi, hotel discount edo state, blue pair hotel offers, cheap hotel uromi',
  path: '/offers',
})

const breadcrumbs = [{name:'Home',path:'/'},{name:'Offers',path:'/offers'}]

export default async function OffersPage() {
  const offers = await getOffers(true)
  return (
    <div>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs, SITE_URL)} />
      <PageHero image="https://images.unsplash.com/photo-1601565415267-724db67003c2?auto=format&fit=crop&w=1600&q=80"
        eyebrow="Save more" title="Offers & Promotions" crumbs="Home / Offers" height="h-72" />
      <section className="section">
        <div className="container-w">
          <SectionHeading eyebrow="Current" title="Live offers" />
          <div className="grid md:grid-cols-2 gap-6">
            {offers.map(o => (
              <div key={o.id} className="card p-7 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="tag">{o.category}</span>
                  <span className="pill-gold">{o.discount}</span>
                </div>
                <h4 className="text-xl font-semibold">{o.title}</h4>
                <p className="text-sm text-navy-500">{o.description}</p>
                <button className="btn-outline btn-sm w-fit mt-2">Claim offer</button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
