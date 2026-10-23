import type { Metadata } from 'next'
import { getGoogleMapsProfileUrl } from '../../../lib/googleReviews'
import { SITE_NAME, SITE_URL } from '../../../lib/siteConfig'
import GuestReviews from '../../../components/public/GuestReviews'

export const metadata: Metadata = {
  title: { absolute: 'Google Reviews | Blue Pair Signature Uromi' },
  description: `Read Google guest reviews for ${SITE_NAME} in Uromi, Edo State, or rate your stay directly on Google.`,
  keywords: ['Blue Pair Signature Google reviews', 'hotel reviews Uromi', 'Blue Pair Signature reviews'],
  alternates: { canonical: `${SITE_URL}/reviews` },
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function ReviewsPage() {
  return <main className="bg-cream-50 text-navy-950">
    <div className="pt-24 md:pt-32"><div className="container-w px-4"><div className="mb-2 max-w-3xl"><h1 className="font-display text-4xl font-medium md:text-5xl">Google Reviews</h1><p className="mt-3 text-sm leading-7 text-navy-600">See what guests have shared about {SITE_NAME} in Uromi, and leave your own feedback on Google.</p></div></div>
      <GuestReviews mapsProfileUrl={getGoogleMapsProfileUrl()} />
    </div>
  </main>
}
