import { buildMetadata } from '../../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../../components/JsonLd'
import { SITE_URL } from '../../../../lib/siteConfig'
import { getMenuItems } from '../../../../lib/data'
import { naira } from '../../../../lib/format'
import PageHero from '../../../../components/layout/PageHero'
import SectionHeading from '../../../../components/ui/SectionHeading'

export const metadata = buildMetadata({
  title: 'Grill Menu & Prices in Uromi, Edo State | Blue Pair Hotel Annex',
  description: 'Whole chicken, fish and suya grilled fresh over open coal at the Blue Pair Hotel Annex, Uromi, Edo State. View the grill menu and prices.',
  keywords: 'grill menu uromi, suya uromi, annex grilling blue pair, grill house edo state',
  path: '/annex/grilling',
})

const breadcrumbs = [{name:'Home',path:'/'},{name:'The Annex',path:'/annex'},{name:'Grilling',path:'/annex/grilling'}]

export default async function GrillingPage() {
  const menuItems = await getMenuItems()
  const items = menuItems.filter(m => m.outlet === 'Annex Grilling')
  return (
    <div>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs, SITE_URL)} />
      <PageHero image="https://images.unsplash.com/photo-1598515213692-5f252f9a90a6?auto=format&fit=crop&w=1600&q=80"
        eyebrow="Live fire" title="Annex Grilling" crumbs="Home / Annex / Grilling" height="h-72" />
      <section className="section">
        <div className="container-w">
          <SectionHeading eyebrow="Menu" title="Off the grill" subtitle="Whole chicken, fish, and suya grilled fresh to order over open coal." />
          <div className="grid sm:grid-cols-2 gap-4">
            {items.map(item => (
              <div key={item.id} className="card p-4 flex gap-4 items-center">
                <img src={item.image} alt={item.name} className="w-20 h-20 rounded-lg object-cover shrink-0" />
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
