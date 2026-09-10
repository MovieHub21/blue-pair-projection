import { buildMetadata } from '../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../components/JsonLd'
import { SITE_URL } from '../../../lib/siteConfig'
import PageHero from '../../../components/layout/PageHero'
import { getBillboards } from '../../../lib/data'
import BillboardClient from './BillboardClient'

export const metadata = buildMetadata({
  title: 'Billboard & Advertising Space in Uromi, Edo State',
  description: 'Advertise on high-visibility billboard spaces across the Blue Pair Hotel campus in Uromi, Edo State. View locations, dimensions and pricing.',
  keywords: 'billboard advertising uromi, billboard edo state, advertise hotel uromi',
  path: '/billboard',
})

const breadcrumbs = [{name:'Home',path:'/'},{name:'Billboard',path:'/billboard'}]

export default async function BillboardPage() {
  const billboards = await getBillboards()
  return (
    <div>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs, SITE_URL)} />
      <PageHero image="https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1600&q=80"
        eyebrow="Advertising" title="Billboard & Advertising" crumbs="Home / Billboard" height="h-72" />
      <BillboardClient billboards={billboards} />
    </div>
  )
}
