import { buildMetadata } from '../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../components/JsonLd'
import { SITE_URL } from '../../../lib/siteConfig'
import PageHero from '../../../components/layout/PageHero'
import { galleryImages } from '../../../data/mock'

export const metadata = buildMetadata({
  title: 'Photo Gallery | Blue Pair Hotel Uromi',
  description: 'A visual tour of Blue Pair Hotel, Uromi, Edo State — rooms, pool, dining and events.',
  keywords: 'blue pair hotel photos, hotel gallery uromi, hotel edo state pictures',
  path: '/gallery',
})

const breadcrumbs = [{name:'Home',path:'/'},{name:'Gallery',path:'/gallery'}]

export default function GalleryPage() {
  return (
    <div>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs, SITE_URL)} />
      <PageHero image={galleryImages[0]} eyebrow="Visual tour" title="Gallery" crumbs="Home / Gallery" height="h-72" />
      <section className="section">
        <div className="container-w columns-2 md:columns-3 gap-3 [column-fill:_balance]">
          {[...galleryImages, ...galleryImages.slice(0,4)].map((g,i) => (
            <div key={i} className="mb-3 rounded-xl2 overflow-hidden break-inside-avoid">
              <img src={g} alt="Blue Pair Hotel, Uromi, Edo State" className="w-full object-cover" style={{ height: i % 3 === 0 ? '320px' : '220px' }} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
