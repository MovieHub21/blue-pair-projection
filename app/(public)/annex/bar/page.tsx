import { notFound } from 'next/navigation'
import { buildMetadata } from '../../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../../components/JsonLd'
import { SITE_URL } from '../../../../lib/siteConfig'
import { getDrinks, getAmenity } from '../../../../lib/data'
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
  const [drinks, amenity] = await Promise.all([getDrinks(), getAmenity('annex-bar')])
  if (!amenity || !amenity.published) notFound()
  const items = drinks.filter(d => d.bar === 'Annex Bar')
  const categories = Array.from(new Set(items.map(i => i.category)))
  return (
    <div>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs, SITE_URL)} />
      <PageHero image={amenity.heroImage} eyebrow={amenity.eyebrow} title={amenity.name} crumbs={`Home / Annex / bar`} height="h-72" />
      <section className="section">
        <div className="container-w">
          <SectionHeading eyebrow="Menu" title={amenity.name} subtitle={amenity.description} />
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
