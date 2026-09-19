import { buildMetadata } from '../../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../../components/JsonLd'
import { SITE_URL } from '../../../../lib/siteConfig'
import { getDrinks } from '../../../../lib/data'
import { naira } from '../../../../lib/format'
import PageHero from '../../../../components/layout/PageHero'
import SectionHeading from '../../../../components/ui/SectionHeading'

export const metadata = buildMetadata({
  title: 'Annex Bar — Drinks Menu in Uromi, Edo State | Blue Pair Hotel',
  description: 'Beer, spirits and cocktails at the Annex Bar, Blue Pair Hotel, Uromi, Edo State. View the full drinks menu and prices.',
  keywords: 'annex bar uromi, drinks menu edo state, bar uromi, hotel with bar esan north-east',
  path: '/annex/bar',
})

const breadcrumbs = [{name:'Home',path:'/'},{name:'The Annex',path:'/annex'},{name:'Bar',path:'/annex/bar'}]

export default async function AnnexBarPage() {
  const drinks = await getDrinks()
  const items = drinks.filter(d => d.bar === 'Annex Bar')
  const categories = Array.from(new Set(items.map(i => i.category)))
  return (
    <div>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs, SITE_URL)} />
      <PageHero image="https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1600&q=80"
        eyebrow="Drinks" title="Annex Bar" crumbs="Home / Annex / Bar" height="h-72" />
      <section className="section">
        <div className="container-w">
          <SectionHeading eyebrow="Menu" title="Cold drinks, open air" subtitle="Beer, spirits and cocktails served at the Annex courtyard bar." />
          {categories.map(cat => (
            <div key={cat} className="mb-8">
              <h4 className="font-semibold mb-3">{cat}</h4>
              <div className="card divide-y divide-black/5">
                {items.filter(i => i.category === cat).map(d => (
                  <div key={d.id} className="flex justify-between items-center px-5 py-3.5">
                    <span className="text-sm">{d.name}</span>
                    <div className="flex items-center gap-3">
                      {!d.available && <span className="pill-red">Sold out</span>}
                      <b className="font-display text-sm">{naira(d.price)}</b>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
