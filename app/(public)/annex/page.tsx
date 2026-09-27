import { buildMetadata } from '../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../components/JsonLd'
import { SITE_URL } from '../../../lib/siteConfig'
import { getDrinks, getMenuItems, getPublishedAmenities } from '../../../lib/data'
import { getAnnexActiveBookings } from '../../../lib/annexOrders'
import AnnexUnifiedExperience, { type AnnexSection } from '../../../components/annex/AnnexUnifiedExperience'

const FALLBACK_HEROES = {
  restaurant: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=85',
  grilling: 'https://images.unsplash.com/photo-1598515213692-5f252f9a90a6?auto=format&fit=crop&w=1600&q=85',
  outdoor_eatery: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=1600&q=85',
  bar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=85',
}

export const metadata = buildMetadata({
  title: 'The Annex — Restaurant, Grill, Bar & Outdoor Dining in Uromi',
  description: 'Explore and order from the Blue Pair Hotel Annex Restaurant, Grilling, Outdoor Eatery and Bar in one place, with one easy checkout.',
  keywords: 'blue pair annex, annex restaurant uromi, annex bar uromi, grilling uromi, outdoor eatery uromi',
  path: '/annex',
})

export default async function AnnexPage() {
  const [menuItems, drinks, amenities, activeBookings] = await Promise.all([
    getMenuItems(),
    getDrinks(),
    getPublishedAmenities('annex-'),
    getAnnexActiveBookings(),
  ])

  const amenityMap = new Map(amenities.map(item => [item.key, item]))
  const getHero = (key: keyof typeof FALLBACK_HEROES) => amenityMap.get('annex-' + key)?.heroImage || FALLBACK_HEROES[key]

  const sections: AnnexSection[] = [
    {
      key: 'restaurant',
      label: 'Restaurant',
      eyebrow: amenityMap.get('annex-restaurant')?.eyebrow || 'Dining',
      title: amenityMap.get('annex-restaurant')?.name || 'Annex Restaurant',
      description: amenityMap.get('annex-restaurant')?.description || 'Homestyle dishes and a relaxed dining experience at the Blue Pair Hotel Annex.',
      heroImage: getHero('restaurant'),
      items: menuItems.filter(item => item.outlet === 'Annex Restaurant').map(item => ({ ...item, outlet: 'restaurant' as const })),
    },
    {
      key: 'grilling',
      label: 'Grilling',
      eyebrow: amenityMap.get('annex-grilling')?.eyebrow || 'Fire & flavour',
      title: amenityMap.get('annex-grilling')?.name || 'Annex Grilling',
      description: amenityMap.get('annex-grilling')?.description || 'Freshly prepared food from the Annex kitchen, served with the atmosphere of an open grill.',
      heroImage: getHero('grilling'),
      items: menuItems.filter(item => item.outlet === 'Annex Grilling').map(item => ({ ...item, outlet: 'grilling' as const })),
    },
    {
      key: 'outdoor_eatery',
      label: 'Outdoor Eatery',
      eyebrow: amenityMap.get('annex-outdoor-eatery')?.eyebrow || 'Open-air dining',
      title: amenityMap.get('annex-outdoor-eatery')?.name || 'Outdoor Eatery',
      description: amenityMap.get('annex-outdoor-eatery')?.description || 'An open-air Annex dining space for relaxed meals and an easygoing night out.',
      heroImage: getHero('outdoor_eatery'),
      items: menuItems.filter(item => item.outlet === 'Outdoor Bar & Eatery' || item.outlet === 'Annex Outdoor Eatery').map(item => ({ ...item, outlet: 'outdoor_eatery' as const })),
    },
    {
      key: 'bar',
      label: 'Bar · Drinks',
      eyebrow: amenityMap.get('annex-bar')?.eyebrow || 'Drinks & nightlife',
      title: amenityMap.get('annex-bar')?.name || 'Annex Bar',
      description: amenityMap.get('annex-bar')?.description || 'A relaxed Annex bar for drinks, conversation and late-evening atmosphere.',
      heroImage: getHero('bar'),
      items: drinks.filter(item => item.bar === 'Annex Bar').map(item => ({ ...item, outlet: 'bar' as const })),
    },
  ]

  const breadcrumbs = [{ name: 'Home', path: '/' }, { name: 'The Annex', path: '/annex' }]
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs, SITE_URL)} />
      <AnnexUnifiedExperience sections={sections} activeBookings={activeBookings} />
    </>
  )
}
