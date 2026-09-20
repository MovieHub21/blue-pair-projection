import { notFound } from 'next/navigation'
import { buildMetadata } from '../../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../../components/JsonLd'
import { SITE_URL } from '../../../../lib/siteConfig'
import { getMenuItems, getAmenity } from '../../../../lib/data'
import { naira } from '../../../../lib/format'
import PageHero from '../../../../components/layout/PageHero'
import SectionHeading from '../../../../components/ui/SectionHeading'

export const metadata = buildMetadata({
  title: 'Annex Restaurant Menu in Uromi, Edo State | Blue Pair Hotel',
  description: 'Homestyle Nigerian dishes served at the Annex Restaurant, Blue Pair Hotel, Uromi, Edo State. View the menu and prices.',
  keywords: 'annex restaurant uromi, nigerian food edo state, blue pair annex menu, restaurant esan north-east',
  path: '/annex/restaurant',
})

const breadcrumbs = [{name:'Home',path:'/'},{name:'The Annex',path:'/annex'},{name:'Restaurant',path:'/annex/restaurant'}]

export default async function AnnexRestaurantPage() {
  const [menuItems, amenity] = await Promise.all([getMenuItems(), getAmenity('annex-restaurant')])
  if (!amenity || !amenity.published) notFound()
  const items = menuItems.filter(m => m.outlet === 'Annex Restaurant')
  return (
    <div>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs, SITE_URL)} />
      <PageHero image={amenity.heroImage} eyebrow={amenity.eyebrow} title={amenity.name} crumbs={`Home / Annex / restaurant`} height="h-72" />
      <section className="section">
        <div className="container-w">
          <SectionHeading eyebrow="Menu" title={amenity.name} subtitle={amenity.description} />
          <div className="grid sm:grid-cols-2 gap-4">
            {items.map(item => (
              <div key={item.id} className="card p-4 flex gap-4 items-center">
                <img loading="lazy" decoding="async" src={item.image} alt={item.name} className="w-20 h-20 rounded-lg object-cover shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-2"><b className="text-sm">{item.name}</b><span className="font-display text-sm">{naira(item.price)}</span></div>
                  <span className={'mt-1.5 inline-block ' + (item.available ? 'pill-green' : 'pill-red')}>{item.available ? 'Available' : 'Sold out'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
