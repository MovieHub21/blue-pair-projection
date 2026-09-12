import PublicNavbar from '../../components/layout/PublicNavbar'
import PublicFooter from '../../components/layout/PublicFooter'
import PublicMotion from '../../components/layout/PublicMotion'
import JsonLd from '../../components/JsonLd'
import { SITE_NAME, SITE_URL, SITE_PHONE, SITE_ADDRESS, SITE_GEO, DEFAULT_OG_IMAGE } from '../../lib/siteConfig'

// Site-wide Hotel structured data — present on every public page so Google
// can show a rich result (address, phone, rating, amenities) no matter
// which page someone lands on first. This is also what a Google Business
// Profile cross-references against for local ranking, so keep the address
// and phone here byte-for-byte identical to what's set up in the profile.
const hotelJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Hotel',
  name: SITE_NAME,
  url: SITE_URL,
  image: DEFAULT_OG_IMAGE,
  telephone: SITE_PHONE,
  priceRange: '₦₦₦',
  address: {
    '@type': 'PostalAddress',
    streetAddress: SITE_ADDRESS.street,
    addressLocality: SITE_ADDRESS.locality,
    addressRegion: SITE_ADDRESS.region,
    postalCode: SITE_ADDRESS.postalCode,
    addressCountry: SITE_ADDRESS.country,
  },
  geo: { '@type': 'GeoCoordinates', latitude: SITE_GEO.lat, longitude: SITE_GEO.lng },
  aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', reviewCount: '312' },
  amenityFeature: [
    'Indoor Pool', 'Fitness Gym', 'Free WiFi', 'VIP Lounge', 'On-site Restaurant', 'Bar', 'Nightclub', 'VIP Parking', 'Event Hall',
  ].map(name => ({ '@type': 'LocationFeatureSpecification', name, value: true })),
  areaServed: ['Uromi', 'Esan North-East', 'Edo State', 'Ekpoma', 'Auchi', 'Ubiaja', 'Benin City'],
  sameAs: ['https://instagram.com/bluepairhotel', 'https://facebook.com/bluepairhotel', 'https://twitter.com/bluepairhotel'],
}

export default function PublicRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-site">
      <JsonLd data={hotelJsonLd} />
      <PublicNavbar />
      <PublicMotion />
      {children}
      <PublicFooter />
    </div>
  )
}
