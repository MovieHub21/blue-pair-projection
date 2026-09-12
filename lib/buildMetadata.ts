import type { Metadata } from 'next'
import { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE } from './siteConfig'

interface Params {
  title: string
  description: string
  path: string
  keywords?: string
  image?: string
  noindex?: boolean
}

const HOTEL_SEARCH_CONTEXT = [
  'hotel in Nigeria',
  'hotel in Edo State',
  'hotel in Uromi',
  'hotel with swimming pool in Nigeria',
  'hotel with gym in Nigeria',
  'hotel with pool and gym in Edo State',
  'luxury hotel Nigeria',
  'hotel accommodation Nigeria',
  'hotel rooms and suites Nigeria',
  'hotel booking Nigeria',
  'hotel near Ekpoma',
  'hotel near Auchi',
  'hotel near Benin City',
]

export function buildMetadata({ title, description, path, keywords, image, noindex }: Params): Metadata {
  const url = `${SITE_URL}${path}`
  const ogImage = image ?? DEFAULT_OG_IMAGE
  const alreadyBranded = title.includes(SITE_NAME)
  const keywordSet = new Set([...(keywords ? keywords.split(',').map(value => value.trim()).filter(Boolean) : []), ...HOTEL_SEARCH_CONTEXT])
  return {
    title: alreadyBranded ? { absolute: title } : title,
    description,
    keywords: Array.from(keywordSet),
    alternates: { canonical: url },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: alreadyBranded ? title : `${title} | ${SITE_NAME}`, description, url, siteName: SITE_NAME,
      images: [{ url: ogImage, width: 1200, height: 630 }], locale: 'en_NG', type: 'website',
    },
    twitter: { card: 'summary_large_image', title: alreadyBranded ? title : `${title} | ${SITE_NAME}`, description, images: [ogImage] },
  }
}
