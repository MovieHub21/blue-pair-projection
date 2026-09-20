import PublicNavbar from '../../components/layout/PublicNavbar'
import PublicFooter from '../../components/layout/PublicFooter'
import PublicMotion from '../../components/layout/PublicMotion'
import JsonLd from '../../components/JsonLd'
import BackButton from '../../components/ui/BackButton'
import { getSiteContent } from '../../lib/data'
import { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE } from '../../lib/siteConfig'

export default async function PublicRouteLayout({ children }: { children: React.ReactNode }) {
  const content = await getSiteContent()
  const socialKeys = ['instagram', 'facebook', 'tiktok', 'linkedin', 'other']
  const sameAs = socialKeys.map(key => content[`social_${key}_enabled`] === 'true' ? content[`social_${key}_url`] : '').filter(Boolean)

  const hotelJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    '@id': `${SITE_URL}#hotel`,
    name: SITE_NAME,
    url: SITE_URL,
    image: DEFAULT_OG_IMAGE,
    sameAs,
  }

  return (
    <div className="public-site">
      <JsonLd data={hotelJsonLd} />
      <PublicNavbar />
      <div className="pointer-events-none fixed inset-x-0 top-[76px] z-30">
        <div className="container-w px-4 md:px-10">
          <div className="pointer-events-auto w-fit">
            <BackButton />
          </div>
        </div>
      </div>
      <PublicMotion />
      {children}
      <PublicFooter content={content} />
    </div>
  )
}
