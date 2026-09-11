import { buildMetadata } from '../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../components/JsonLd'
import { SITE_URL } from '../../../lib/siteConfig'
import PageHero from '../../../components/layout/PageHero'
import { getGalleryImages } from '../../../lib/data'

export const metadata = buildMetadata({
  title: 'Photo Gallery | Blue Pair Hotel Uromi',
  description: 'A visual tour of Blue Pair Hotel, Uromi, Edo State — rooms, pool, dining and events.',
  keywords: 'blue pair hotel photos, hotel gallery uromi, hotel edo state pictures',
  path: '/gallery',
})

const breadcrumbs = [{name:'Home',path:'/'},{name:'Gallery',path:'/gallery'}]

export default async function GalleryPage() {
  const gallery = await getGalleryImages()
  const heroImage = gallery[0]?.url ?? 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=80'
  const tiles = gallery.length ? [...gallery, ...gallery.slice(0, 4)] : []
  return (
    <div>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs, SITE_URL)} />
      <PageHero image={heroImage} eyebrow="Visual tour" title="Gallery" crumbs="Home / Gallery" height="h-72" />
      <section className="section">
        <div className="container-w columns-2 md:columns-3 gap-3 [column-fill:_balance]">
          {tiles.map((g, i) => (
            <div key={`${g.id}-${i}`} className="mb-3 rounded-xl2 overflow-hidden break-inside-avoid">
              <img src={g.url} alt={g.caption || 'Blue Pair Hotel, Uromi, Edo State'} className="w-full object-cover" style={{ height: i % 3 === 0 ? '320px' : '220px' }} />
            </div>
          ))}
          {tiles.length === 0 && <p className="text-sm text-navy-400 col-span-full">No gallery images yet.</p>}
        </div>
      </section>
    </div>
  )
}
