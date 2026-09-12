import PublicNavbar from '../../components/layout/PublicNavbar'
import PublicFooter from '../../components/layout/PublicFooter'
import PublicMotion from '../../components/layout/PublicMotion'
import JsonLd from '../../components/JsonLd'
import { getSiteContent } from '../../lib/data'
import { SITE_NAME, SITE_URL, SITE_PHONE, SITE_ADDRESS, SITE_GEO, DEFAULT_OG_IMAGE } from '../../lib/siteConfig'

export default async function PublicRouteLayout({ children }: { children: React.ReactNode }) {
  const content = await getSiteContent()
  const phone = content.hotel_phone || SITE_PHONE
  const address = content.hotel_address || `${SITE_ADDRESS.street}, ${SITE_ADDRESS.locality}, ${SITE_ADDRESS.region}`
  const socialKeys = ['instagram', 'facebook', 'tiktok', 'linkedin', 'other']
  const sameAs = socialKeys.map(key => content[`social_${key}_enabled`] === 'true' ? content[`social_${key}_url`] : '').filter(Boolean)

  const hotelJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: SITE_NAME,
    url: SITE_URL,
    image: DEFAULT_OG_IMAGE,
    telephone: phone,
    priceRange: '₦₦₦',
    address: {
      '@type': 'PostalAddress',
      streetAddress: address,
      addressLocality: SITE_ADDRESS.locality,
      addressRegion: SITE_ADDRESS.region,
      postalCode: SITE_ADDRESS.postalCode,
      addressCountry: SITE_ADDRESS.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: SITE_GEO.lat, longitude: SITE_GEO.lng },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', reviewCount: '312' },
    amenityFeature: ['Indoor Pool', 'Fitness Gym', 'Free WiFi', 'VIP Lounge', 'On-site Restaurant', 'Bar', 'Nightclub', 'VIP Parking', 'Event Hall'].map(name => ({ '@type': 'LocationFeatureSpecification', name, value: true })),
    areaServed: ['Uromi', 'Esan North-East', 'Edo State', 'Ekpoma', 'Auchi', 'Ubiaja', 'Benin City', 'Nigeria'],
    sameAs,
  }

  return (
    <div className="public-site">
      <JsonLd data={hotelJsonLd} />
      <PublicNavbar />
      <PublicMotion />
      {children}
      <PublicFooter content={content} />
    </div>
  )
}
